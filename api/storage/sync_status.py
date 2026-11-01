"""Change markers, so clients can poll one small request to see what changed.

`sync_status/{household_id}` holds one opaque version per household data kind. `sync_status/_global`
holds the recipe version: through sharing, a recipe written by one household can change what every
other household sees, so any recipe write changes it. Every write path calls a touch function after
its write; clients remember the versions they last synced and refetch only the kinds whose version
differs. Versions are compared for equality, never ordered, so clock skew cannot hide a change.
"""

from typing import Any, Literal, get_args
from uuid import uuid4

from api.storage.firestore_client import SYNC_STATUS_COLLECTION, get_firestore_client

HouseholdKind = Literal["grocery", "meal_plan", "settings"]
HOUSEHOLD_KINDS: tuple[HouseholdKind, ...] = get_args(HouseholdKind)
GLOBAL_DOC_ID = "_global"


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
    client = db or get_firestore_client()
    client.collection(SYNC_STATUS_COLLECTION).document(household_id).set(
        {kind: uuid4().hex for kind in kinds}, merge=True
    )


def touch_recipes(db: Any = None) -> None:
    """Give recipes a new version (any recipe write, by any household).

    Args:
        db: Firestore client to use; defaults to the API client (scripts pass their own).
    """
    client = db or get_firestore_client()
    client.collection(SYNC_STATUS_COLLECTION).document(GLOBAL_DOC_ID).set({"recipes": uuid4().hex}, merge=True)


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
