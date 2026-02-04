"""
Household Management CLI - Create and manage households for multi-tenancy.

Usage:
    uv run python scripts/manage_households.py list                     # List all households
    uv run python scripts/manage_households.py create "Family Name"     # Create household
    uv run python scripts/manage_households.py show <household_id>      # Show household details
    uv run python scripts/manage_households.py members <household_id>   # List members
    uv run python scripts/manage_households.py add-member <household_id> <email> [role]
    uv run python scripts/manage_households.py remove-member <email>
    uv run python scripts/manage_households.py set-superuser <email>    # Grant superuser
    uv run python scripts/manage_households.py remove-superuser <email> # Revoke superuser

Examples:
    # Create a new household
    uv run python scripts/manage_households.py create "Smith Family"

    # Add a member as admin
    uv run python scripts/manage_households.py add-member abc123 user@example.com admin

    # Grant superuser access
    uv run python scripts/manage_households.py set-superuser admin@example.com
"""

import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load .env file
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from api.storage import household_storage


def list_households() -> None:
    """List all households."""
    households = household_storage.list_all_households()

    if not households:
        print("No households found.")
        return

    print(f"\n{'ID':<24} {'Name':<30} {'Created By':<30}")
    print("-" * 84)
    for h in households:
        print(f"{h.id:<24} {h.name:<30} {h.created_by:<30}")
    print(f"\nTotal: {len(households)} households")


def create_household(name: str, created_by: str = "cli@system") -> None:
    """Create a new household."""
    household_id = household_storage.create_household(name, created_by)
    print(f"✓ Created household '{name}' with ID: {household_id}")


def show_household(household_id: str) -> None:
    """Show household details."""
    household = household_storage.get_household(household_id)

    if household is None:
        print(f"✗ Household '{household_id}' not found.")
        sys.exit(1)

    print(f"\nHousehold: {household.name}")
    print(f"  ID: {household.id}")
    print(f"  Created by: {household.created_by}")
    print(f"  Created at: {household.created_at}")

    members = household_storage.list_household_members(household_id)
    print(f"\nMembers ({len(members)}):")
    for m in members:
        display = f" ({m.display_name})" if m.display_name else ""
        print(f"  - {m.email}{display} [{m.role}]")


def list_members(household_id: str) -> None:
    """List members of a household."""
    household = household_storage.get_household(household_id)
    if household is None:
        print(f"✗ Household '{household_id}' not found.")
        sys.exit(1)

    members = household_storage.list_household_members(household_id)

    if not members:
        print(f"No members in household '{household.name}'.")
        return

    print(f"\nMembers of '{household.name}':")
    print(f"\n{'Email':<35} {'Role':<10} {'Display Name':<20}")
    print("-" * 65)
    for m in members:
        display = m.display_name or ""
        print(f"{m.email:<35} {m.role:<10} {display:<20}")
    print(f"\nTotal: {len(members)} members")


def add_member(household_id: str, email: str, role: str = "member", display_name: str | None = None) -> None:
    """Add a member to a household."""
    # Validate household exists
    household = household_storage.get_household(household_id)
    if household is None:
        print(f"✗ Household '{household_id}' not found.")
        sys.exit(1)

    # Check if already a member
    existing = household_storage.get_user_membership(email)
    if existing:
        print(f"✗ {email} is already a member of household '{existing.household_id}'.")
        sys.exit(1)

    # Validate role
    if role not in ("admin", "member"):
        print(f"✗ Invalid role '{role}'. Must be 'admin' or 'member'.")
        sys.exit(1)

    household_storage.add_member(
        household_id=household_id, email=email, role=role, display_name=display_name, invited_by="cli@system"
    )
    print(f"✓ Added {email} as {role} to '{household.name}'")


def remove_member(email: str) -> None:
    """Remove a member from their household."""
    membership = household_storage.get_user_membership(email)
    if membership is None:
        print(f"✗ {email} is not a member of any household.")
        sys.exit(1)

    household_storage.remove_member(email)
    print(f"✓ Removed {email} from household '{membership.household_id}'")


def set_superuser(email: str) -> None:
    """Grant superuser access to a user."""
    if household_storage.is_superuser(email):
        print(f"✗ {email} is already a superuser.")
        sys.exit(1)

    household_storage.add_superuser(email)
    print(f"✓ Granted superuser access to {email}")


def remove_superuser(email: str) -> None:
    """Revoke superuser access from a user."""
    if not household_storage.is_superuser(email):
        print(f"✗ {email} is not a superuser.")
        sys.exit(1)

    household_storage.remove_superuser(email)
    print(f"✓ Revoked superuser access from {email}")


def print_usage() -> None:
    """Print usage information."""
    print(__doc__)


def main() -> None:
    """Main entry point for CLI."""
    args = sys.argv[1:]

    if not args:
        print_usage()
        sys.exit(1)

    command = args[0]

    if command == "list":
        list_households()
    elif command == "create":
        if len(args) < 2:
            print("Usage: manage_households.py create <name> [created_by]")
            sys.exit(1)
        name = args[1]
        created_by = args[2] if len(args) > 2 else "cli@system"
        create_household(name, created_by)
    elif command == "show":
        if len(args) < 2:
            print("Usage: manage_households.py show <household_id>")
            sys.exit(1)
        show_household(args[1])
    elif command == "members":
        if len(args) < 2:
            print("Usage: manage_households.py members <household_id>")
            sys.exit(1)
        list_members(args[1])
    elif command == "add-member":
        if len(args) < 3:
            print("Usage: manage_households.py add-member <household_id> <email> [role] [display_name]")
            sys.exit(1)
        household_id = args[1]
        email = args[2]
        role = args[3] if len(args) > 3 else "member"
        display_name = args[4] if len(args) > 4 else None
        add_member(household_id, email, role, display_name)
    elif command == "remove-member":
        if len(args) < 2:
            print("Usage: manage_households.py remove-member <email>")
            sys.exit(1)
        remove_member(args[1])
    elif command == "set-superuser":
        if len(args) < 2:
            print("Usage: manage_households.py set-superuser <email>")
            sys.exit(1)
        set_superuser(args[1])
    elif command == "remove-superuser":
        if len(args) < 2:
            print("Usage: manage_households.py remove-superuser <email>")
            sys.exit(1)
        remove_superuser(args[1])
    elif command in ("--help", "-h", "help"):
        print_usage()
    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
