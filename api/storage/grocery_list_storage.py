"""Grocery list storage service using Firestore.

Stores per-household grocery list state: selected meals, servings,
checked items, and custom items. All household members share the same list.
"""

from datetime import UTC, datetime
from typing import Any, cast

from api.storage.firestore_client import GROCERY_LISTS_COLLECTION, get_firestore_client

_DOC_ID = "current"


def _doc_ref(household_id: str) -> Any:  # pragma: no cover
    """Get the document reference for a household's grocery list."""
    db = get_firestore_client()
    return db.collection(GROCERY_LISTS_COLLECTION).document(household_id).collection("lists").document(_DOC_ID)


def load_grocery_state(household_id: str) -> dict[str, Any] | None:  # pragma: no cover
    """Load the current grocery list state for a household.

    Returns:
        Dict with selected_meals, meal_servings, checked_items, custom_items,
        or None if no state exists.
    """
    doc = cast("Any", _doc_ref(household_id).get())
    if not doc.exists:
        return None
    return doc.to_dict()


def save_grocery_state(  # noqa: PLR0913
    household_id: str,
    *,
    selected_meals: list[str],
    meal_servings: dict[str, int],
    checked_items: list[str] | None = None,
    custom_items: list[dict[str, str]] | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:  # pragma: no cover
    """Save or replace the grocery list state for a household.

    Args:
        household_id: The household identifier.
        selected_meals: Meal keys like ["2026-02-10_lunch", "2026-02-11_dinner"].
        meal_servings: Servings per meal key, e.g. {"2026-02-10_lunch": 4}.
        checked_items: List of checked item names.
        custom_items: Custom items, each with at least "name" and optionally "category".
        created_by: Email of the user saving the list.

    Returns:
        The saved state dict.
    """
    now = datetime.now(tz=UTC)
    data: dict[str, Any] = {
        "selected_meals": selected_meals,
        "meal_servings": meal_servings,
        "checked_items": checked_items or [],
        "custom_items": custom_items or [],
        "updated_at": now,
    }
    if created_by:
        data["created_by"] = created_by

    _doc_ref(household_id).set(data)
    return data


def update_grocery_state(household_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:  # pragma: no cover
    """Merge-update specific fields of the grocery list state.

    Args:
        household_id: The household identifier.
        updates: Fields to merge (e.g. checked_items, custom_items).

    Returns:
        The full updated state, or None if no state existed.
    """
    ref = _doc_ref(household_id)
    doc = cast("Any", ref.get())
    if not doc.exists:
        return None

    updates["updated_at"] = datetime.now(tz=UTC)
    ref.update(updates)

    updated_doc = cast("Any", ref.get())
    return updated_doc.to_dict()


def delete_grocery_state(household_id: str) -> bool:  # pragma: no cover
    """Delete the grocery list state for a household.

    Returns:
        True if a document was deleted, False if none existed.
    """
    ref = _doc_ref(household_id)
    doc = cast("Any", ref.get())
    if not doc.exists:
        return False
    ref.delete()
    return True
