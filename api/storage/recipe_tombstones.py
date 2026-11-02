"""Tombstones for recipes that went away for some viewers, so clients can delta-sync removals.

A recipe stops being visible to a household when it is deleted, moved to another household, or
stops being shared. Each such event gets a tiny `recipe_tombstones` document holding the recipe ID,
its owner before the change, whether it was shared, and when it happened. It is written in the same
batch as the change it records, so the two never disagree. Clients ask for everything removed since
their last sync; a recipe that is still (or again) visible is reported as changed instead, and
`get_recipe_changes` leaves it out of the removed IDs.
"""

from datetime import datetime
from typing import Any

from google.cloud.firestore_v1 import FieldFilter

from api.storage.firestore_client import RECIPE_TOMBSTONES_COLLECTION


def add_tombstone(  # noqa: PLR0913
    writer: Any, db: Any, recipe_id: str, *, household_id: str | None, was_shared: bool, removed_at: datetime
) -> None:
    """Add a tombstone write to a Firestore batch or transaction.

    Args:
        writer: The batch (or transaction) that also carries the removal.
        db: Firestore client, to address the tombstone collection.
        recipe_id: The recipe that went away.
        household_id: Its owning household before the change.
        was_shared: Whether every household could see it before the change.
        removed_at: When it happened.
    """
    writer.set(
        db.collection(RECIPE_TOMBSTONES_COLLECTION).document(),
        {"recipe_id": recipe_id, "household_id": household_id, "was_shared": was_shared, "removed_at": removed_at},
    )


def is_removal_for(tombstone: dict[str, Any], household_id: str | None) -> bool:
    """Whether a household could see the recipe before the recorded removal.

    Args:
        tombstone: The tombstone document.
        household_id: The caller's household, or None for a superuser, who sees everything.

    Returns:
        True if the caller should drop the recipe from its copy.
    """
    if household_id is None:
        return True
    return bool(tombstone.get("was_shared")) or tombstone.get("household_id") == household_id


def get_removed_recipe_ids(db: Any, since: datetime, household_id: str | None) -> list[str]:
    """Get IDs of recipes removed for the caller since a time.

    Args:
        db: Firestore client.
        since: Start of the window (a previous sync's server time).
        household_id: The caller's household, or None for a superuser.

    Returns:
        Removed recipe IDs, each once.
    """
    query = db.collection(RECIPE_TOMBSTONES_COLLECTION).where(filter=FieldFilter("removed_at", ">", since))
    removed: dict[str, None] = {}
    for doc in query.stream():
        data = doc.to_dict() or {}
        if data.get("recipe_id") and is_removal_for(data, household_id):
            removed[data["recipe_id"]] = None
    return list(removed)
