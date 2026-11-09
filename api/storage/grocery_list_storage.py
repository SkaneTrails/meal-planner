"""Grocery list storage service using Firestore.

Stores per-household grocery list state: selected meals, servings,
checked items, and custom items. All household members share the same list.
"""

from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore

from api.storage.firestore_client import GROCERY_LISTS_COLLECTION, get_firestore_client
from api.storage.sync_status import touch_household

_DOC_ID = "current"


def merge_checked_items(current: list[str], check: list[str], uncheck: list[str]) -> list[str]:
    """Apply per-item check/uncheck operations to a checked list.

    Unchecks are applied before checks; existing order is kept and new items are appended once.

    Args:
        current: The stored checked item names.
        check: Item names to mark checked.
        uncheck: Item names to mark unchecked.

    Returns:
        The merged checked item names.
    """
    removed = set(uncheck)
    merged = [item for item in current if item not in removed]
    present = set(merged)
    for item in check:
        if item not in present:
            merged.append(item)
            present.add(item)
    return merged


def apply_grocery_patch(  # noqa: PLR0913
    current: dict[str, Any] | None,
    updates: dict[str, Any],
    *,
    check: list[str],
    uncheck: list[str],
    created_by: str | None,
    now: datetime,
) -> dict[str, Any]:
    """Compute the grocery state after a patch; a missing state starts empty, so the patch creates it.

    Args:
        current: The stored state, or None if the household has none yet.
        updates: Fields to replace.
        check: Item names to mark checked.
        uncheck: Item names to mark unchecked.
        created_by: Email recorded when the state is created.
        now: Time to record as updated_at.

    Returns:
        The full new state.
    """
    if current is None:
        current = {
            "selected_meals": [],
            "meal_servings": {},
            "checked_items": [],
            "custom_items": [],
            "item_order": [],
            "removed_items": [],
            **({"created_by": created_by} if created_by else {}),
        }
    result = {**current, **updates}
    if check or uncheck:
        result["checked_items"] = merge_checked_items(current.get("checked_items", []), check, uncheck)
    result["updated_at"] = now
    return result


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
    doc = _doc_ref(household_id).get()
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
    item_order: list[str] | None = None,
    removed_items: list[str] | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:
    """Save or replace the grocery list state for a household.

    Args:
        household_id: The household identifier.
        selected_meals: Meal keys like ["2026-02-10_lunch", "2026-02-11_dinner"].
        meal_servings: Servings per meal key, e.g. {"2026-02-10_lunch": 4}.
        checked_items: List of checked item names.
        custom_items: Custom items, each with at least "name" and optionally "category".
        item_order: User-defined item ordering by name.
        removed_items: Generated item names hidden by the user (cleared/deleted).
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
        "item_order": item_order or [],
        "removed_items": removed_items or [],
        "updated_at": now,
    }
    if created_by:
        data["created_by"] = created_by

    _doc_ref(household_id).set(data)
    touch_household(household_id, "grocery")
    return data


def update_grocery_state(
    household_id: str,
    updates: dict[str, Any],
    *,
    check: list[str] | None = None,
    uncheck: list[str] | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:  # pragma: no cover
    """Merge-update the grocery list state, creating it if the household has none yet.

    Runs in one transaction, including the creation, so ticks from several devices are combined
    (a concurrent request retries against the other's result) instead of the last write winning.

    Args:
        household_id: The household identifier.
        updates: Fields to merge (e.g. custom_items, item_order).
        check: Item names to mark checked.
        uncheck: Item names to mark unchecked.
        created_by: Email recorded if the state is created.

    Returns:
        The full updated state.
    """
    ref = _doc_ref(household_id)

    @firestore.transactional  # type: ignore[misc]
    def apply(transaction: Any) -> dict[str, Any]:
        doc = ref.get(transaction=transaction)
        result = apply_grocery_patch(
            (doc.to_dict() or {}) if doc.exists else None,
            updates,
            check=check or [],
            uncheck=uncheck or [],
            created_by=created_by,
            now=datetime.now(tz=UTC),
        )
        transaction.set(ref, result)
        return result

    result = apply(get_firestore_client().transaction())
    touch_household(household_id, "grocery")
    return result


def delete_grocery_state(household_id: str) -> bool:  # pragma: no cover
    """Delete the grocery list state for a household.

    Returns:
        True if a document was deleted, False if none existed.
    """
    ref = _doc_ref(household_id)
    doc = ref.get()
    if not doc.exists:
        return False
    ref.delete()
    touch_household(household_id, "grocery")
    return True
