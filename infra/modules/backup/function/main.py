"""Cloud Function to export Firestore database to Cloud Storage.

This function is triggered by Cloud Scheduler to perform weekly backups.
It uses the Firestore Admin REST API to export all collections to a Cloud Storage bucket.
Supports backing up multiple databases in a single invocation.
"""

import logging
import os
from datetime import UTC, datetime
from typing import Any

import functions_framework
import google.auth
from googleapiclient import discovery
from googleapiclient.errors import HttpError

# Configure logging for Cloud Functions
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@functions_framework.http
def backup_firestore(_request: Any) -> tuple[dict[str, Any], int]:
    """Export Firestore databases to Cloud Storage.

    Triggered by Cloud Scheduler via HTTP POST.
    Backs up all databases specified in DATABASE_NAMES (comma-separated).

    Environment variables required:
        PROJECT_ID: GCP project ID
        DATABASE_NAMES: Comma-separated list of Firestore database names
        BUCKET_NAME: Cloud Storage bucket for backups

    Returns:
        Tuple of (response_body, status_code)
    """
    project_id = os.environ.get("PROJECT_ID")
    database_names_str = os.environ.get("DATABASE_NAMES")
    bucket_name = os.environ.get("BUCKET_NAME")

    if not all([project_id, database_names_str, bucket_name]):
        logger.error("Missing required environment variables")
        return {"error": "Missing required environment variables"}, 500

    # Parse comma-separated database names
    database_names = [name.strip() for name in database_names_str.split(",") if name.strip()]

    if not database_names:
        logger.error("No database names provided in DATABASE_NAMES")
        return {"error": "No database names provided"}, 400

    # Create timestamped backup folder
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d-%H%M%S")
    logger.info("Starting Firestore backup with timestamp %s for databases: %s", timestamp, database_names)

    # Initialize Firestore Admin API client
    try:
        credentials, _ = google.auth.default()
        service = discovery.build("firestore", "v1", credentials=credentials)
    except Exception as e:
        logger.exception("Failed to initialize Firestore Admin API client")
        return {"error": f"Failed to initialize API client: {e}"}, 500

    results = []
    errors = []

    for database_name in database_names:
        output_uri = f"gs://{bucket_name}/{timestamp}/{database_name}"

        # Build the database resource name
        database_path = f"projects/{project_id}/databases/{database_name}"

        # Create export request body
        export_body = {
            "outputUriPrefix": output_uri,
            # Empty collectionIds means export all collections
            "collectionIds": [],
        }

        try:
            logger.info("Starting export for database %s to %s", database_name, output_uri)
            # Start the export operation (async - returns immediately)
            operation = service.projects().databases().exportDocuments(name=database_path, body=export_body).execute()
            operation_name = operation.get("name")
            logger.info("Export started for %s, operation: %s", database_name, operation_name)
            results.append({"database": database_name, "operation": operation_name, "output_uri": output_uri})
        except HttpError as e:
            error_msg = f"HTTP error exporting {database_name}: {e.resp.status} {e.reason}"
            logger.exception(error_msg)
            errors.append({"database": database_name, "error": error_msg})
        except Exception as e:
            error_msg = f"Unexpected error exporting {database_name}: {e}"
            logger.exception(error_msg)
            errors.append({"database": database_name, "error": str(e)})

    # Determine response status based on results
    if not results and errors:
        # All exports failed
        logger.error("All database exports failed")
        return {"status": "failed", "timestamp": timestamp, "errors": errors}, 500
    if errors:
        # Partial success
        logger.warning("Some database exports failed: %d succeeded, %d failed", len(results), len(errors))
        return {"status": "partial", "timestamp": timestamp, "databases": results, "errors": errors}, 207
    # All succeeded
    logger.info("All %d database exports started successfully", len(results))
    return {"status": "started", "timestamp": timestamp, "databases": results}, 200
