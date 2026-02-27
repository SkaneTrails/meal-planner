"""Store order storage service using Firestore.

Stores per-household, per-store item orderings that are learned
from shopping trip tick sequences. Each store has its own ordering
document under the household's grocery_lists collection.

Path: grocery_lists/{household_id}/store_orders/{store_id}
"""

from datetime import UTC, datetime
from typing import Any

from api.storage.firestore_client import GROCERY_LISTS_COLLECTION, get_firestore_client


def _store_order_ref(household_id: str, store_id: str) -> Any:  # pragma: no cover
    """Get the document reference for a store's learned ordering."""
    db = get_firestore_client()
    return db.collection(GROCERY_LISTS_COLLECTION).document(household_id).collection("store_orders").document(store_id)


def get_store_order(household_id: str, store_id: str) -> list[str]:  # pragma: no cover
    """Load the learned item ordering for a store.

    Args:
        household_id: The household identifier.
        store_id: The store identifier.

    Returns:
        Ordered list of item names, or empty list if no order exists.
    """
    doc = _store_order_ref(household_id, store_id).get()
    if not doc.exists:
        return []
    data = doc.to_dict()
    return data.get("item_order", []) if data else []


def save_store_order(household_id: str, store_id: str, item_order: list[str]) -> None:  # pragma: no cover
    """Save or replace the learned item ordering for a store.

    Args:
        household_id: The household identifier.
        store_id: The store identifier.
        item_order: Ordered list of item names.
    """
    _store_order_ref(household_id, store_id).set(
        {"item_order": item_order, "updated_at": datetime.now(tz=UTC)}, merge=True
    )


def delete_store_order(household_id: str, store_id: str) -> None:  # pragma: no cover
    """Delete the learned ordering for a store.

    Called when a store is removed from household settings.

    Args:
        household_id: The household identifier.
        store_id: The store identifier.
    """
    ref = _store_order_ref(household_id, store_id)
    doc = ref.get()
    if doc.exists:
        ref.delete()
