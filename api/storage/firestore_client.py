"""Firestore client for data persistence."""

import os

from google.cloud import firestore

# Firestore client singleton
_client: firestore.Client | None = None

# Database name
DATABASE = "meal-planner"


def get_firestore_client() -> firestore.Client:  # pragma: no cover
    """Get or create Firestore client singleton.

    Supports multiple credential sources:
    - Service account impersonation via ADC (recommended for local dev)
    - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a key file
    - Cloud Run metadata server (production)
    - Firestore emulator via FIRESTORE_EMULATOR_HOST
    """
    global _client  # noqa: PLW0603
    if _client is None:
        # Use explicit project ID from environment (required for local dev)
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

        if project_id:
            _client = firestore.Client(project=project_id, database=DATABASE)
        else:
            _client = firestore.Client(database=DATABASE)
    return _client


def reset_client() -> None:
    """Reset Firestore client singleton (useful for testing)."""
    global _client  # noqa: PLW0603
    _client = None


# Collection names
RECIPES_COLLECTION = "recipes"
MEAL_PLANS_COLLECTION = "meal_plans"
GROCERY_LISTS_COLLECTION = "grocery_lists"
