"""Firestore client for data persistence."""

from google.cloud import firestore

# Firestore client singleton
_db: firestore.Client | None = None


def get_firestore_client() -> firestore.Client:
    """Get or create Firestore client singleton."""
    global _db  # noqa: PLW0603
    if _db is None:
        _db = firestore.Client()
    return _db


# Collection names
RECIPES_COLLECTION = "recipes"
MEAL_PLANS_COLLECTION = "meal_plans"
GROCERY_LISTS_COLLECTION = "grocery_lists"
