"""Firestore client for data persistence."""

import os

from google.cloud import firestore

# Firestore client singletons for different databases
_clients: dict[str, firestore.Client] = {}

# Available databases
DEFAULT_DATABASE = "(default)"
ENHANCED_DATABASE = "meal-planner"


def get_firestore_client(database: str = DEFAULT_DATABASE) -> firestore.Client:  # pragma: no cover
    """Get or create Firestore client singleton for a specific database.

    Supports multiple credential sources:
    - Service account impersonation via ADC (recommended for local dev)
    - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a key file
    - Cloud Run metadata server (production)
    - Firestore emulator via FIRESTORE_EMULATOR_HOST

    Args:
        database: The database ID to connect to. Use "(default)" for the default database
                  or "meal-planner" for the AI-enhanced recipes database.
    """
    global _clients  # noqa: PLW0602
    if database not in _clients:
        # Use explicit project ID from environment (required for local dev)
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

        if project_id:
            # Explicit project - use with ADC (works with impersonation, key files, etc.)
            _clients[database] = firestore.Client(project=project_id, database=database)
        else:
            # Fall back to ADC defaults (Cloud Run uses metadata server)
            _clients[database] = firestore.Client(database=database)
    return _clients[database]


def reset_client() -> None:
    """Reset all Firestore client singletons (useful for testing)."""
    global _clients  # noqa: PLW0603
    _clients = {}


# Collection names
RECIPES_COLLECTION = "recipes"
MEAL_PLANS_COLLECTION = "meal_plans"
GROCERY_LISTS_COLLECTION = "grocery_lists"
