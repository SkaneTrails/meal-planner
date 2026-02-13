"""Meal plan storage service using Firestore."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from google.cloud.firestore_v1 import DocumentSnapshot

from api.storage.firestore_client import MEAL_PLANS_COLLECTION, get_firestore_client

# Expected number of parts when splitting meal key (date_str, meal_type_str)
_MEAL_KEY_PARTS = 2


def _get_meal_plan_doc_id(household_id: str) -> str:  # pragma: no cover
    """Get the document ID for a household's meal plan."""
    return f"{household_id}_meal_plan"


def save_meal_plan(
    household_id: str, meals: dict[str, str], notes: dict[str, str] | None = None, extras: list[str] | None = None
) -> None:  # pragma: no cover
    """
    Save the entire meal plan to Firestore.

    Args:
        household_id: The household identifier.
        meals: Dictionary with date_mealtype keys and recipe_id/custom values.
        notes: Optional dictionary with date keys and note text values.
        extras: Optional list of recipe IDs for the "Other" section.
    """
    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id))

    data: dict[str, Any] = {"meals": meals, "updated_at": datetime.now(tz=UTC)}
    if notes is not None:
        data["notes"] = notes
    if extras is not None:
        data["extras"] = extras

    doc_ref.set(data)


def load_meal_plan(household_id: str) -> tuple[dict[str, str], dict[str, str], list[str]]:  # pragma: no cover
    """
    Load the meal plan from Firestore.

    Args:
        household_id: The household identifier.

    Returns:
        Tuple of (meals dict, notes dict, extras list).
    """
    db = get_firestore_client()
    doc = cast(
        "DocumentSnapshot", db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id)).get()
    )

    if not doc.exists:
        return {}, {}, []

    data = doc.to_dict()
    if data is None:
        return {}, {}, []

    return data.get("meals", {}), data.get("notes", {}), data.get("extras", [])


def update_meal(household_id: str, date_str: str, meal_type_str: str, value: str) -> None:  # pragma: no cover
    """
    Update a single meal in the meal plan.

    Args:
        household_id: The household identifier.
        date_str: The ISO date string of the meal.
        meal_type_str: The meal type value (breakfast, lunch, dinner, snack).
        value: The recipe ID or custom text (prefixed with "custom:").
    """
    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id))

    key = f"{date_str}_{meal_type_str}"
    doc_ref.set({"meals": {key: value}, "updated_at": datetime.now(tz=UTC)}, merge=True)


def delete_meal(household_id: str, date_str: str, meal_type_str: str) -> None:  # pragma: no cover
    """
    Delete a single meal from the meal plan.

    Args:
        household_id: The household identifier.
        date_str: The ISO date string of the meal.
        meal_type_str: The meal type value.
    """
    from google.cloud.firestore_v1 import DELETE_FIELD

    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id))

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return

    key = f"meals.{date_str}_{meal_type_str}"
    doc_ref.update({key: DELETE_FIELD, "updated_at": datetime.now(tz=UTC)})


def load_day_notes(household_id: str) -> dict[str, str]:  # pragma: no cover
    """
    Load day notes from Firestore.

    Args:
        household_id: The household identifier.

    Returns:
        Dictionary with date_str keys and note text values.
    """
    db = get_firestore_client()
    doc = cast(
        "DocumentSnapshot", db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id)).get()
    )

    if not doc.exists:
        return {}

    data = doc.to_dict()
    if data is None:
        return {}

    return data.get("notes", {})


def update_day_note(household_id: str, date_str: str, note: str) -> None:  # pragma: no cover
    """
    Update or delete a single day's note in Firestore.

    Args:
        household_id: The household identifier.
        date_str: The ISO date string for the note.
        note: The note text. If empty, the note is deleted.
    """
    from google.cloud.firestore_v1 import DELETE_FIELD

    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id))

    if note:
        doc_ref.set({"notes": {date_str: note}, "updated_at": datetime.now(tz=UTC)}, merge=True)
    else:
        doc = cast("DocumentSnapshot", doc_ref.get())
        if doc.exists:
            doc_ref.update({f"notes.{date_str}": DELETE_FIELD, "updated_at": datetime.now(tz=UTC)})


def update_extras(household_id: str, extras: list[str]) -> None:  # pragma: no cover
    """
    Update the extras list (Other section) in the meal plan.

    Args:
        household_id: The household identifier.
        extras: List of recipe IDs for the "Other" section.
    """
    db = get_firestore_client()
    doc_ref = db.collection(MEAL_PLANS_COLLECTION).document(_get_meal_plan_doc_id(household_id))
    doc_ref.set({"extras": extras, "updated_at": datetime.now(tz=UTC)}, merge=True)
