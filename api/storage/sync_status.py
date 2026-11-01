"""Change markers, so clients can poll one small request to see what changed.

`sync_status/{household_id}` holds one opaque version per household data kind. `sync_status/_global`
holds the recipe version: through sharing, a recipe written by one household can change what every
other household sees, so any recipe write changes it. Every write path calls a touch function after
its write; clients remember the versions they last synced and refetch only the kinds whose version
differs. Versions are compared for equality, never ordered, so clock skew cannot hide a change.

A touch is best-effort: its data was already written, so failing the request (and inviting the
client to repeat a non-idempotent write) would be worse than a missed marker. Clients also refresh
every kind after a maximum age, which repairs a missed marker.
"""

import logging
from typing import Any, Literal, get_args
from uuid import uuid4

from api.storage.firestore_client import SYNC_STATUS_COLLECTION, get_firestore_client

logger = logging.getLogger(__name__)

HouseholdKind = Literal["grocery", "meal_plan", "settings"]
HOUSEHOLD_KINDS: tuple[HouseholdKind, ...] = get_args(HouseholdKind)
GLOBAL_DOC_ID = "_global"


def _set_versions(client: Any, doc_id: str, versions: dict[str, str]) -> None:
    try:
        client.collection(SYNC_STATUS_COLLECTION).document(doc_id).set(versions, merge=True)
    except Exception:
        logger.exception("Failed to bump sync version(s) %s on %s", sorted(versions), doc_id)


def touch_household(household_id: str, *kinds: HouseholdKind, db: Any = None) -> None:
    """Give household data kinds a new version.

    Args:
        household_id: The household whose data changed.
        *kinds: Members of HOUSEHOLD_KINDS.
        db: Firestore client to use; defaults to the API client (scripts pass their own).

    Raises:
        ValueError: If a kind is not a household data kind.
    """
    unknown = [kind for kind in kinds if kind not in HOUSEHOLD_KINDS]
    if unknown:
        msg = f"Unknown household sync kind(s): {unknown}"
        raise ValueError(msg)
    _set_versions(db or get_firestore_client(), household_id, {kind: uuid4().hex for kind in kinds})


def touch_recipes(db: Any = None) -> None:
    """Give recipes a new version (any recipe write, by any household).

    Args:
        db: Firestore client to use; defaults to the API client (scripts pass their own).
    """
    _set_versions(db or get_firestore_client(), GLOBAL_DOC_ID, {"recipes": uuid4().hex})


def get_status(household_id: str | None) -> dict[str, str | None]:
    """Get the current version of every data kind visible to a household.

    Args:
        household_id: The caller's household, or None for a user without one.

    Returns:
        Version per kind; None for a kind that was never written (or has no household).
    """
    client = get_firestore_client()
    collection = client.collection(SYNC_STATUS_COLLECTION)
    refs = [collection.document(GLOBAL_DOC_ID)]
    if household_id:
        refs.append(collection.document(household_id))

    docs = {doc.id: (doc.to_dict() or {}) for doc in client.get_all(refs) if doc.exists}
    household = docs.get(household_id, {}) if household_id else {}
    return {
        "recipes": docs.get(GLOBAL_DOC_ID, {}).get("recipes"),
        **{kind: household.get(kind) for kind in HOUSEHOLD_KINDS},
    }
