"""Firestore client for data persistence."""

import os

from google.cloud import firestore

# Firestore client singletons for different databases
_clients: dict[str, firestore.Client] = {}

# Available databases
DEFAULT_DATABASE = "(default)"
ENHANCED_DATABASE = "meal-planner"


def get_firestore_client(database: str = DEFAULT_DATABASE) -> firestore.Client:
    """Get or create Firestore client singleton for a specific database.

    Supports Firestore emulator via FIRESTORE_EMULATOR_HOST environment variable.

    Args:
        database: The database ID to connect to. Use "(default)" for the default database
                  or "meal-planner" for the AI-enhanced recipes database.
    """
    global _clients  # noqa: PLW0602
    if database not in _clients:
        # Check for emulator
        emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
        if emulator_host:
            # When using emulator, we need to set the project ID
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "meal-planner-local")
            _clients[database] = firestore.Client(project=project_id, database=database)
        else:
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
