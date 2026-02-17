"""User and household management commands for the admin CLI.

Operates directly on Firestore collections:
- household_members: email (doc ID) → {household_id, role, display_name, joined_at, invited_by}
- households: auto-ID → {name, created_at, created_by}
- households/{id}/settings/config: household preferences

Superuser management is intentionally excluded — superusers are managed
exclusively through Terraform (infra/environments/dev/access/superusers.txt).
"""

import argparse
from datetime import UTC, datetime

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

DATABASE = "meal-planner"
HOUSEHOLDS_COLLECTION = "households"
HOUSEHOLD_MEMBERS_COLLECTION = "household_members"
SUPERUSERS_COLLECTION = "superusers"

VALID_ROLES = ("admin", "member")
SETTINGS_FIELDS = {
    "language": str,
    "household_size": int,
    "default_servings": int,
    "week_start": str,
    "ai_features_enabled": bool,
}

_project: str = ""


def _get_db() -> firestore.Client:
    return firestore.Client(project=_project, database=DATABASE)


def set_project(project: str) -> None:
    global _project  # noqa: PLW0603
    _project = project


# ---------------------------------------------------------------------------
# User commands
# ---------------------------------------------------------------------------


def user_get(email: str) -> None:
    """Look up a user's household membership and superuser status."""
    db = _get_db()
    normalized = email.lower()

    su_doc = db.collection(SUPERUSERS_COLLECTION).document(normalized).get()
    member_doc = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized).get()

    print(f"\n{'=' * 60}")
    print(f"  User: {normalized}")
    print(f"  Superuser: {'Yes' if su_doc.exists else 'No'}")

    if not member_doc.exists:
        print("  Household: (none)")
        print(f"{'=' * 60}\n")
        return

    data = member_doc.to_dict() or {}
    household_id = data.get("household_id", "")
    role = data.get("role", "member")
    display_name = data.get("display_name")
    joined_at = data.get("joined_at")

    household_name = ""
    if household_id:
        h_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
        if h_doc.exists:
            household_name = (h_doc.to_dict() or {}).get("name", "")

    print(f"  Household: {household_name} ({household_id})")
    print(f"  Role: {role}")
    if display_name:
        print(f"  Display name: {display_name}")
    if joined_at:
        ts = joined_at.isoformat() if hasattr(joined_at, "isoformat") else str(joined_at)
        print(f"  Joined: {ts}")
    print(f"{'=' * 60}\n")


def user_add(email: str, household_id: str, *, role: str = "member") -> None:
    """Add a user to a household."""
    if "@" not in email or "." not in email.split("@")[-1]:
        print(f"\u274c Invalid email format: {email}")
        return

    db = _get_db()
    normalized = email.lower()

    if role not in VALID_ROLES:
        print(f"\u274c Invalid role: {role}. Must be one of {VALID_ROLES}")
        return

    h_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
    if not h_doc.exists:
        print(f"\u274c Household not found: {household_id}")
        return

    existing = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized).get()
    if existing.exists:
        existing_data = existing.to_dict() or {}
        existing_hid = existing_data.get("household_id")
        print(f"\u26a0\ufe0f {normalized} is already a member of household {existing_hid}")
        print("   Remove them first if you want to move them.")
        return

    now = datetime.now(tz=UTC)
    db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized).set(
        {"household_id": household_id, "role": role, "display_name": None, "joined_at": now, "invited_by": "admin-tool"}
    )

    household_name = (h_doc.to_dict() or {}).get("name", "")
    print(f"\u2705 Added {normalized} to {household_name} ({household_id}) as {role}")


def user_remove(email: str) -> None:
    """Remove a user from their household."""
    db = _get_db()
    normalized = email.lower()

    doc_ref = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized)
    doc = doc_ref.get()

    if not doc.exists:
        print(f"\u274c {normalized} is not a member of any household")
        return

    data = doc.to_dict() or {}
    household_id = data.get("household_id", "")
    doc_ref.delete()
    print(f"\u2705 Removed {normalized} from household {household_id}")


def user_set_role(email: str, role: str) -> None:
    """Change a user's role within their household."""
    db = _get_db()
    normalized = email.lower()

    if role not in VALID_ROLES:
        print(f"\u274c Invalid role: {role}. Must be one of {VALID_ROLES}")
        return

    doc_ref = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).document(normalized)
    doc = doc_ref.get()

    if not doc.exists:
        print(f"\u274c {normalized} is not a member of any household")
        return

    old_role = (doc.to_dict() or {}).get("role", "member")
    doc_ref.update({"role": role})
    print(f"\u2705 Changed {normalized} role: {old_role} \u2192 {role}")


def user_list(*, household_id: str | None = None) -> None:
    """List users, optionally filtered by household."""
    db = _get_db()

    if household_id:
        h_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
        if not h_doc.exists:
            print(f"\u274c Household not found: {household_id}")
            return
        household_name = (h_doc.to_dict() or {}).get("name", "")
        query = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).where(
            filter=FieldFilter("household_id", "==", household_id)
        )
        print(f"\n  Members of {household_name} ({household_id}):")
    else:
        query = db.collection(HOUSEHOLD_MEMBERS_COLLECTION)
        print("\n  All household members:")

    print(f"  {'Email':<35s}  {'Role':<8s}  {'Household ID'}")
    print(f"  {'-' * 35}  {'-' * 8}  {'-' * 24}")

    count = 0
    for doc in query.stream():
        data = doc.to_dict() or {}
        print(f"  {doc.id:<35s}  {data.get('role', 'member'):<8s}  {data.get('household_id', '')}")
        count += 1

    print(f"\n  Total: {count} members\n")


# ---------------------------------------------------------------------------
# Household commands
# ---------------------------------------------------------------------------


def household_list() -> None:
    """List all households."""
    db = _get_db()

    print(f"\n  {'ID':<24s}  {'Name':<30s}  {'Created by'}")
    print(f"  {'-' * 24}  {'-' * 30}  {'-' * 30}")

    count = 0
    for doc in db.collection(HOUSEHOLDS_COLLECTION).stream():
        data = doc.to_dict() or {}
        name = (data.get("name") or "")[:30]
        created_by = (data.get("created_by") or "")[:30]
        print(f"  {doc.id:<24s}  {name:<30s}  {created_by}")
        count += 1

    print(f"\n  Total: {count} households\n")


def household_get(household_id: str) -> None:
    """Show a household's details, members, and settings."""
    db = _get_db()

    h_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
    if not h_doc.exists:
        print(f"\u274c Household not found: {household_id}")
        return

    data = h_doc.to_dict() or {}
    print(f"\n{'=' * 60}")
    print(f"  Household: {data.get('name', '')}")
    print(f"  ID: {household_id}")
    created_at = data.get("created_at")
    if created_at and hasattr(created_at, "isoformat"):
        print(f"  Created: {created_at.isoformat()}")
    print(f"  Created by: {data.get('created_by', '')}")

    query = db.collection(HOUSEHOLD_MEMBERS_COLLECTION).where(filter=FieldFilter("household_id", "==", household_id))
    members = list(query.stream())
    print(f"\n  --- Members ({len(members)}) ---")
    for m in members:
        m_data = m.to_dict() or {}
        print(f"    {m.id} ({m_data.get('role', 'member')})")

    settings_doc = (
        db.collection(HOUSEHOLDS_COLLECTION).document(household_id).collection("settings").document("config").get()
    )
    if settings_doc.exists:
        s = settings_doc.to_dict() or {}
        print("\n  --- Settings ---")
        for key in sorted(s):
            val = s[key]
            if isinstance(val, dict):
                print(f"    {key}:")
                for k2, v2 in sorted(val.items()):
                    print(f"      {k2}: {v2}")
            elif isinstance(val, list) and len(val) > 5:
                print(f"    {key}: [{len(val)} items]")
            else:
                print(f"    {key}: {val}")
    else:
        print("\n  --- Settings ---")
        print("    (no settings configured)")

    print(f"{'=' * 60}\n")


def household_create(name: str) -> None:
    """Create a new household."""
    db = _get_db()

    for doc in db.collection(HOUSEHOLDS_COLLECTION).stream():
        existing_name = (doc.to_dict() or {}).get("name", "")
        if existing_name.strip().lower() == name.strip().lower():
            print(f"\u274c A household named '{existing_name}' already exists (ID: {doc.id})")
            return

    now = datetime.now(tz=UTC)
    doc_ref = db.collection(HOUSEHOLDS_COLLECTION).document()
    doc_ref.set({"name": name.strip(), "created_at": now, "created_by": "admin-tool"})
    print(f"\u2705 Created household '{name.strip()}' (ID: {doc_ref.id})")


def household_set(household_id: str, field: str, value: str) -> None:
    """Update a single household setting."""
    db = _get_db()

    h_doc = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).get()
    if not h_doc.exists:
        print(f"\u274c Household not found: {household_id}")
        return

    if field not in SETTINGS_FIELDS:
        print(f"\u274c Unknown setting: {field}")
        print(f"   Valid settings: {', '.join(sorted(SETTINGS_FIELDS))}")
        return

    field_type = SETTINGS_FIELDS[field]
    try:
        if field_type is bool:
            normalized = value.strip().lower()
            truthy_values = ("true", "1", "yes")
            falsy_values = ("false", "0", "no")
            if normalized in truthy_values:
                parsed = True
            elif normalized in falsy_values:
                parsed = False
            else:
                valid_values = ", ".join(truthy_values + falsy_values)
                print(f"\u274c Invalid boolean value for {field}: {value!r}")
                print(f"   Expected one of: {valid_values}")
                return
        elif field_type is int:
            parsed = int(value)
        else:
            parsed = value
    except ValueError:
        print(f"\u274c Invalid value for {field}: expected {field_type.__name__}")
        return

    settings_ref = db.collection(HOUSEHOLDS_COLLECTION).document(household_id).collection("settings").document("config")
    settings_ref.set({field: parsed}, merge=True)

    household_name = (h_doc.to_dict() or {}).get("name", "")
    print(f"\u2705 Set {field}={parsed} on {household_name} ({household_id})")


# ---------------------------------------------------------------------------
# CLI parser registration
# ---------------------------------------------------------------------------


def register_subcommands(sub: argparse._SubParsersAction) -> None:  # type: ignore[type-arg]
    """Register user and household subcommands on an existing subparser."""
    p_user = sub.add_parser("user", help="User management commands")
    user_sub = p_user.add_subparsers(dest="user_command")

    p_user_get = user_sub.add_parser("get", help="Look up a user")
    p_user_get.add_argument("email")

    p_user_add = user_sub.add_parser("add", help="Add user to household")
    p_user_add.add_argument("email")
    p_user_add.add_argument("household_id")
    p_user_add.add_argument("--role", default="member", choices=VALID_ROLES)

    p_user_remove = user_sub.add_parser("remove", help="Remove user from household")
    p_user_remove.add_argument("email")

    p_user_role = user_sub.add_parser("set-role", help="Change user role")
    p_user_role.add_argument("email")
    p_user_role.add_argument("role", choices=VALID_ROLES)

    p_user_list = user_sub.add_parser("list", help="List members")
    p_user_list.add_argument("--household", default=None, help="Filter by household ID")

    p_hh = sub.add_parser("household", help="Household management commands")
    hh_sub = p_hh.add_subparsers(dest="household_command")

    hh_sub.add_parser("list", help="List all households")

    p_hh_get = hh_sub.add_parser("get", help="Show household details")
    p_hh_get.add_argument("household_id")

    p_hh_create = hh_sub.add_parser("create", help="Create a new household")
    p_hh_create.add_argument("name")

    p_hh_set = hh_sub.add_parser("set", help="Update a household setting")
    p_hh_set.add_argument("household_id")
    p_hh_set.add_argument("field", help=f"Setting name ({', '.join(sorted(SETTINGS_FIELDS))})")
    p_hh_set.add_argument("value")


def dispatch(args: argparse.Namespace) -> bool:
    """Dispatch user/household subcommands. Returns True if handled."""
    if args.command == "user":
        cmd = getattr(args, "user_command", None)
        if cmd == "get":
            user_get(args.email)
        elif cmd == "add":
            user_add(args.email, args.household_id, role=args.role)
        elif cmd == "remove":
            user_remove(args.email)
        elif cmd == "set-role":
            user_set_role(args.email, args.role)
        elif cmd == "list":
            user_list(household_id=args.household)
        else:
            print("\u274c Missing user subcommand. Use: get, add, remove, set-role, list")
        return True

    if args.command == "household":
        cmd = getattr(args, "household_command", None)
        if cmd == "list":
            household_list()
        elif cmd == "get":
            household_get(args.household_id)
        elif cmd == "create":
            household_create(args.name)
        elif cmd == "set":
            household_set(args.household_id, args.field, args.value)
        else:
            print("\u274c Missing household subcommand. Use: list, get, create, set")
        return True

    return False
