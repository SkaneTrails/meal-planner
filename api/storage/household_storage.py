"""Household and membership storage operations."""

from dataclasses import dataclass
from datetime import UTC, datetime

from google.cloud import firestore
from google.cloud.firestore_v1.transaction import Transaction

from api.storage.firestore_client import get_firestore_client

HOUSEHOLDS_COLLECTION = "households"
HOUSEHOLD_MEMBERS_COLLECTION = "household_members"
SUPERUSERS_COLLECTION = "superusers"


@dataclass
class Household:
    """Represents a household."""

    id: str
    name: str
    created_at: datetime
    created_by: str


@dataclass
class HouseholdMember:
    """Represents a user's membership in a household."""

    email: str
    household_id: str
    role: str  # "superuser" | "admin" | "member"
    display_name: str | None = None
    joined_at: datetime | None = None
    invited_by: str | None = None


def _get_db() -> firestore.Client:
    """Get Firestore client for meal-planner database."""
    return get_firestore_client()


def is_superuser(email: str) -> bool:
    """Check if user is a superuser (has global access)."""
    db = _get_db()
    # Normalize email to lowercase for consistent document ID lookup
    normalized_email = email.lower()
    doc = db.collection(SUPERUSERS_COLLECTION).document(normalized_email).get()
    return doc.exists  # type: ignore[union-attr]


def add_superuser(email: str) -> None:
    """Grant superuser access to a user."""
    db = _get_db()
    # Normalize email to lowercase for consistent document ID
    normalized_email = email.lower()
    db.collection(SUPERUSERS_COLLECTION).document(normalized_email).set(
        {"email": normalized_email, "created_at": datetime.now(UTC)}
    )


def remove_superuser(email: str) -> None:
    """Revoke superuser access from a user."""
    db = _get_db()
    # Normalize email to lowercase for consistent document ID
    normalized_email = email.lower()
    db.collection(SUPERUSERS_COLLECTION).document(normalized_email).delete()


def get_user_membership(email: str) -> HouseholdMember | None:
    """
    Get user's household membership.

    Returns None if user is not a member of any household.
    """
    db = _get_db()
    # Normalize email to lowercase for consistent document ID lookup
    normalized_email = email.lower()
    doc = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized_email).get()

    if not doc.exists:  # type: ignore[union-attr]
        return None

    data = doc.to_dict()  # type: ignore[union-attr]
    if data is None:
        return None
    return HouseholdMember(
        email=email,
        household_id=data.get("household_id", ""),
        role=data.get("role", "member"),
        display_name=data.get("display_name"),
        joined_at=data.get("joined_at"),
        invited_by=data.get("invited_by"),
    )


def get_household(household_id: str) -> Household | None:
    """Get household by ID."""
    db = _get_db()
    doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()

    if not doc.exists:  # type: ignore[union-attr]
        return None

    data = doc.to_dict()  # type: ignore[union-attr]
    if data is None:
        return None
    return Household(
        id=household_id,
        name=data.get("name", ""),
        created_at=data.get("created_at", datetime.now(UTC)),
        created_by=data.get("created_by", ""),
    )


def create_household(name: str, created_by: str) -> str:
    """
    Create a new household.

    Returns the generated household ID.
    """
    db = _get_db()
    now = datetime.now(UTC)

    doc_ref = db.collection(HOUSEHOLDS_COLLECTION).document()
    doc_ref.set({"name": name, "created_at": now, "created_by": created_by})

    return doc_ref.id


def add_member(
    household_id: str, email: str, role: str = "member", display_name: str | None = None, invited_by: str | None = None
) -> None:
    """
    Add a user to a household.

    Uses email (lowercased) as document ID for O(1) lookup.
    """
    db = _get_db()
    now = datetime.now(UTC)
    # Normalize email to lowercase for consistent document ID
    normalized_email = email.lower()

    db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized_email).set(
        {
            "household_id": household_id,
            "role": role,
            "display_name": display_name,
            "joined_at": now,
            "invited_by": invited_by,
        }
    )


def remove_member(email: str) -> bool:
    """
    Remove a user from their household.

    Returns True if member existed and was removed.
    """
    db = _get_db()
    # Normalize email to lowercase for consistent document ID
    normalized_email = email.lower()
    doc_ref = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized_email)

    if not doc_ref.get().exists:  # type: ignore[union-attr]
        return False

    doc_ref.delete()
    return True


def list_household_members(household_id: str) -> list[HouseholdMember]:
    """Get all members of a household."""
    db = _get_db()
    query = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).where("household_id", "==", household_id)

    members = []
    for doc in query.stream():
        data = doc.to_dict()
        members.append(
            HouseholdMember(
                email=doc.id,
                household_id=household_id,
                role=data.get("role", "member"),
                display_name=data.get("display_name"),
                joined_at=data.get("joined_at"),
                invited_by=data.get("invited_by"),
            )
        )

    return members


def list_all_households() -> list[Household]:
    """Get all households (for superuser admin view)."""
    db = _get_db()
    households = []

    for doc in db.collection(HOUSEHOLDS_COLLECTION).stream():
        data = doc.to_dict()
        households.append(
            Household(
                id=doc.id,
                name=data.get("name", ""),
                created_at=data.get("created_at", datetime.now(UTC)),
                created_by=data.get("created_by", ""),
            )
        )

    return households


def household_name_exists(name: str, exclude_id: str | None = None) -> bool:
    """
    Check if a household name is already in use.

    Args:
        name: The name to check (case-insensitive).
        exclude_id: Optionally exclude a household ID (for rename checks).

    Returns True if the name is already taken by another household.
    """
    normalized = name.strip().lower()
    for household in list_all_households():
        if household.name.strip().lower() == normalized:
            if exclude_id and household.id == exclude_id:
                continue  # Same household, allow keeping its own name
            return True
    return False


def update_household(household_id: str, name: str) -> bool:
    """
    Update household name.

    Returns True if household existed and was updated.
    """
    db = _get_db()
    doc_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id)

    if not doc_ref.get().exists:  # type: ignore[union-attr]
        return False

    doc_ref.update({"name": name})
    return True


def delete_household(household_id: str) -> bool:
    """
    Delete a household.

    Note: Does NOT delete members - caller should remove members first.
    Returns True if household existed and was deleted.
    """
    db = _get_db()
    doc_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id)

    if not doc_ref.get().exists:  # type: ignore[union-attr]
        return False

    doc_ref.delete()
    return True


def get_household_settings(household_id: str) -> dict | None:
    """
    Get settings for a household.

    Returns the settings dict, or None if household doesn't exist.
    Settings are stored in a 'settings' subcollection with a single 'config' document.
    """
    db = _get_db()

    # First check household exists
    household_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
    if not household_doc.exists:  # type: ignore[union-attr]
        return None

    # Get settings from subcollection
    settings_doc = (
        db.collection(HOUSEHOLDS_COLLECTION).document(household_id).collection("settings").document("config").get()
    )

    if not settings_doc.exists:  # type: ignore[union-attr]
        return {}  # Household exists but no settings yet

    return settings_doc.to_dict() or {}  # type: ignore[union-attr]


def update_household_settings(household_id: str, settings: dict) -> bool:
    """
    Update settings for a household (merge update).

    Returns False if household doesn't exist.
    """
    db = _get_db()

    # First check household exists
    household_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
    if not household_doc.exists:  # type: ignore[union-attr]
        return False

    # Update settings in subcollection (merge to preserve existing fields)
    settings_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).collection("settings").document("config")

    settings_ref.set(settings, merge=True)
    return True


def add_item_at_home(household_id: str, item: str) -> list[str]:
    """
    Add an item to the household's items-at-home list.

    Returns the updated list of items, or raises ValueError if household doesn't exist.
    Items are normalized to lowercase and duplicates are prevented.
    Uses a Firestore transaction to ensure atomic read-modify-write.
    """
    db = _get_db()

    # Normalize item before transaction
    normalized_item = item.lower().strip()
    if not normalized_item:
        msg = "Item cannot be empty"
        raise ValueError(msg)

    household_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id)
    settings_ref = household_ref.collection("settings").document("config")

    @firestore.transactional  # type: ignore[misc]
    def update_in_transaction(transaction: Transaction) -> list[str]:
        # Check household exists
        household_doc = household_ref.get(transaction=transaction)
        if not household_doc.exists:  # type: ignore[union-attr]
            msg = "Household not found"
            raise ValueError(msg)

        # Get current settings
        settings_doc = settings_ref.get(transaction=transaction)
        current_items: list[str] = []
        if settings_doc.exists:  # type: ignore[union-attr]
            data = settings_doc.to_dict() or {}  # type: ignore[union-attr]
            current_items = list(data.get("items_at_home", []))

        # Add item if not already present
        if normalized_item not in current_items:
            current_items.append(normalized_item)
            current_items.sort()

        # Update settings
        transaction.set(settings_ref, {"items_at_home": current_items}, merge=True)
        return current_items

    transaction = db.transaction()
    return update_in_transaction(transaction)


def remove_item_at_home(household_id: str, item: str) -> list[str]:
    """
    Remove an item from the household's items-at-home list.

    Returns the updated list of items, or raises ValueError if household doesn't exist.
    Uses a Firestore transaction to ensure atomic read-modify-write.
    """
    db = _get_db()

    # Normalize item before transaction
    normalized_item = item.lower().strip()

    household_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id)
    settings_ref = household_ref.collection("settings").document("config")

    @firestore.transactional  # type: ignore[misc]
    def update_in_transaction(transaction: Transaction) -> list[str]:
        # Check household exists
        household_doc = household_ref.get(transaction=transaction)
        if not household_doc.exists:  # type: ignore[union-attr]
            msg = "Household not found"
            raise ValueError(msg)

        # Get current settings
        settings_doc = settings_ref.get(transaction=transaction)
        current_items: list[str] = []
        if settings_doc.exists:  # type: ignore[union-attr]
            data = settings_doc.to_dict() or {}  # type: ignore[union-attr]
            current_items = list(data.get("items_at_home", []))

        # Remove item if present
        current_items = [i for i in current_items if i != normalized_item]

        # Update settings
        transaction.set(settings_ref, {"items_at_home": current_items}, merge=True)
        return current_items

    transaction = db.transaction()
    return update_in_transaction(transaction)


def get_items_at_home(household_id: str) -> list[str]:
    """
    Get the household's items-at-home list.

    Returns empty list if household has no settings or doesn't exist.
    """
    settings = get_household_settings(household_id)
    if settings is None:
        return []
    return settings.get("items_at_home", [])
