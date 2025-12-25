"""Meal plan storage service using Firestore."""

from datetime import UTC, date, datetime
from typing import Any, cast

from google.cloud.firestore_v1 import DocumentSnapshot

from app.models.meal_plan import MealType
from app.storage.firestore_client import MEAL_PLANS_COLLECTION, get_firestore_client

# Use a single document ID for the meal plan (can be extended for multi-user later)
MEAL_PLAN_DOC_ID = "default_meal_plan"


def _meal_plan_to_firestore(meal_plan: dict[tuple[str, str], str]) -> dict[str, Any]:
    """
    Convert the in-memory meal plan to Firestore-compatible format.

    Args:
        meal_plan: Dictionary with (date_str, meal_type_str) keys and recipe_id/custom text values.

    Returns:
        Dictionary with string keys suitable for Firestore.
    """
    result: dict[str, Any] = {"meals": {}, "updated_at": datetime.now(tz=UTC)}

    for (date_str, meal_type_str), value in meal_plan.items():
        key = f"{date_str}_{meal_type_str}"
        result["meals"][key] = value

    return result


def _firestore_to_meal_plan(data: dict[str, Any]) -> dict[tuple[str, str], str]:
    """
    Convert Firestore data back to in-memory meal plan format.

    Args:
        data: Firestore document data.

    Returns:
        Dictionary with (date_str, meal_type_str) keys.
    """
    result: dict[tuple[str, str], str] = {}
    meals = data.get("meals", {})

    for key, value in meals.items():
        parts = key.rsplit("_", 1)
        if len(parts) == 2:
            date_str, meal_type_str = parts
            result[(date_str, meal_type_str)] = value

    return result


def save_meal_plan(meal_plan: dict[tuple[str, str], str]) -> None:
    """
    Save the entire meal plan to Firestore.

    Args:
        meal_plan: The meal plan dictionary to save.
    """
    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(MEAL_PLAN_DOC_ID)
    doc_ref.set(_meal_plan_to_firestore(meal_plan))


def load_meal_plan() -> dict[tuple[str, str], str]:
    """
    Load the meal plan from Firestore.

    Returns:
        The meal plan dictionary, or empty dict if not found.
    """
    db = get_firestore_client()
    doc = cast("DocumentSnapshot", db.collection(MEAL_PLANS_COLLECTION).document(MEAL_PLAN_DOC_ID).get())

    if not doc.exists:
        return {}

    data = doc.to_dict()
    if data is None:
        return {}

    return _firestore_to_meal_plan(data)


def update_meal(date_str: str, meal_type_str: str, value: str) -> None:
    """
    Update a single meal in the meal plan.

    Args:
        date_str: The ISO date string of the meal.
        meal_type_str: The meal type value (breakfast, lunch, dinner, snack).
        value: The recipe ID or custom text (prefixed with "custom:").
    """
    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(MEAL_PLAN_DOC_ID)

    key = f"{date_str}_{meal_type_str}"
    doc_ref.set({"meals": {key: value}, "updated_at": datetime.now(tz=UTC)}, merge=True)


def delete_meal(date_str: str, meal_type_str: str) -> None:
    """
    Delete a single meal from the meal plan.

    Args:
        date_str: The ISO date string of the meal.
        meal_type_str: The meal type value.
    """
    from google.cloud.firestore_v1 import DELETE_FIELD

    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(MEAL_PLAN_DOC_ID)

    # Check if document exists before updating
    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return  # Nothing to delete

    key = f"meals.{date_str}_{meal_type_str}"
    doc_ref.update({key: DELETE_FIELD, "updated_at": datetime.now(tz=UTC)})
