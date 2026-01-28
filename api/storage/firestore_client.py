"""Firestore client for data persistence."""

import os

from google.cloud import firestore

# Firestore client singleton
_db: firestore.Client | None = None


def get_firestore_client() -> firestore.Client:
    """Get or create Firestore client singleton.

    Supports Firestore emulator via FIRESTORE_EMULATOR_HOST environment variable.
    """
    global _db  # noqa: PLW0603
    if _db is None:
        # Check for emulator
        emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
        if emulator_host:
            # When using emulator, we need to set the project ID
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "meal-planner-local")
            _db = firestore.Client(project=project_id)
        else:
            _db = firestore.Client()
    return _db


def reset_client() -> None:
    """Reset the Firestore client singleton (useful for testing)."""
    global _db  # noqa: PLW0603
    _db = None


# Collection names
RECIPES_COLLECTION = "recipes"
MEAL_PLANS_COLLECTION = "meal_plans"
GROCERY_LISTS_COLLECTION = "grocery_lists"
