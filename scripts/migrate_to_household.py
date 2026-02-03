"""
One-time migration script to move legacy data to a household.

This script:
1. Copies meal plans from (default) database to meal-planner database
2. Assigns recipes to the household

Usage:
    uv run python scripts/migrate_to_household.py <household_id> --dry-run  # Preview
    uv run python scripts/migrate_to_household.py <household_id>            # Execute
"""

import sys
from datetime import UTC, datetime
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from google.cloud import firestore


def get_default_db() -> firestore.Client:
    """Get Firestore client for the default database."""
    return firestore.Client()


def get_mealplanner_db() -> firestore.Client:
    """Get Firestore client for the meal-planner database."""
    return firestore.Client(database="meal-planner")


def list_legacy_meal_plans() -> list[tuple[str, dict]]:
    """List all meal plans in the default database."""
    db = get_default_db()
    plans = []
    for doc in db.collection("meal_plans").stream():
        plans.append((doc.id, doc.to_dict()))
    return plans


def migrate_meal_plan(source_doc_id: str, target_household_id: str, *, dry_run: bool = False) -> bool:
    """Migrate a meal plan within the default database (rename to household-based ID)."""
    default_db = get_default_db()

    # Read from default database
    source_doc = default_db.collection("meal_plans").document(source_doc_id).get()
    if not source_doc.exists:
        print(f"  ✗ Source document '{source_doc_id}' not found")
        return False

    data = source_doc.to_dict()
    meals = data.get("meals", {})
    notes = data.get("notes", {})

    print(f"  Found {len(meals)} meals and {len(notes)} notes")

    target_doc_id = f"{target_household_id}_meal_plan"

    if dry_run:
        print(f"  [DRY RUN] Would copy to '{target_doc_id}'")
        return True

    # Write to same (default) database with new household-based ID
    default_db.collection("meal_plans").document(target_doc_id).set(
        {"meals": meals, "notes": notes, "migrated_from": source_doc_id, "migrated_at": datetime.now(UTC)}
    )
    print(f"  ✓ Copied to '{target_doc_id}'")
    return True


def list_legacy_recipes() -> list[tuple[str, dict]]:
    """List all recipes without household_id in the meal-planner database."""
    db = get_mealplanner_db()
    recipes = []
    for doc in db.collection("recipes").stream():
        data = doc.to_dict()
        if not data.get("household_id"):
            recipes.append((doc.id, data))
    return recipes


def assign_recipes_to_household(household_id: str, *, dry_run: bool = False, visibility: str = "shared") -> int:
    """Assign all recipes without household_id to a household."""
    db = get_mealplanner_db()
    recipes = list_legacy_recipes()

    if not recipes:
        print("  No recipes without household_id found")
        return 0

    count = 0
    for doc_id, data in recipes:
        title = data.get("title", "Untitled")
        if dry_run:
            print(f"  [DRY RUN] Would assign '{title}' ({doc_id}) as {visibility}")
        else:
            db.collection("recipes").document(doc_id).update({"household_id": household_id, "visibility": visibility})
            print(f"  ✓ Assigned '{title}' ({doc_id}) as {visibility}")
        count += 1

    return count


def main() -> None:
    """Main entry point."""
    args = sys.argv[1:]

    if not args or args[0] in ("--help", "-h"):
        print(__doc__)
        sys.exit(0)

    household_id = args[0]
    dry_run = "--dry-run" in args

    if dry_run:
        print("=== DRY RUN MODE ===\n")

    # Verify household exists
    from api.storage import household_storage

    household = household_storage.get_household(household_id)
    if not household:
        print(f"✗ Household '{household_id}' not found")
        sys.exit(1)

    print(f"Target household: {household.name} ({household_id})\n")

    # Step 1: Migrate the main meal plan (skip test data)
    print("Step 1: Migrate meal plan from (default) database")
    print("-" * 50)
    # Only migrate the real meal plan, not test data
    print("\n  Processing: default_meal_plan")
    migrate_meal_plan("default_meal_plan", household_id, dry_run=dry_run)

    # Step 2: Assign recipes to household with shared visibility
    print("\n\nStep 2: Assign recipes to household (visibility: shared)")
    print("-" * 50)
    count = assign_recipes_to_household(household_id, dry_run=dry_run, visibility="shared")
    print(f"\n  Total: {count} recipes {'would be ' if dry_run else ''}assigned")

    if dry_run:
        print("\n=== DRY RUN COMPLETE ===")
        print("Run without --dry-run to execute the migration.")
    else:
        print("\n=== MIGRATION COMPLETE ===")


if __name__ == "__main__":
    main()
