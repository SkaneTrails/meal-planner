"""
Database consolidation script: Merge (default) and meal-planner databases.

This script:
1. Copies all recipes from (default) to meal-planner database
2. Handles duplicates by URL (keeps meal-planner version if enhanced)
3. Assigns unowned recipes to specified household or marks as shared
4. Lists recipes that need household assignment

Usage:
    uv run python scripts/consolidate_databases.py --list              # List what would be migrated
    uv run python scripts/consolidate_databases.py --migrate --dry-run # Preview migration
    uv run python scripts/consolidate_databases.py --migrate           # Execute migration
    uv run python scripts/consolidate_databases.py --assign-household <household_id> --dry-run
    uv run python scripts/consolidate_databases.py --cleanup --dry-run # Preview cleanup
"""

import argparse
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from google.cloud import firestore


def normalize_url(url: str) -> str:
    """Normalize URL for comparison."""
    if not url:
        return ""
    parsed = urlparse(url.lower().strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def get_default_db() -> firestore.Client:
    """Get Firestore client for the default database."""
    return firestore.Client()


def get_mealplanner_db() -> firestore.Client:
    """Get Firestore client for the meal-planner database."""
    return firestore.Client(database="meal-planner")


def list_all_recipes(db: firestore.Client) -> list[tuple[str, dict]]:
    """List all recipes in a database."""
    recipes = []
    for doc in db.collection("recipes").stream():
        recipes.append((doc.id, doc.to_dict()))
    return recipes


def analyze_databases():
    """Analyze both databases and show what needs to be migrated."""
    default_db = get_default_db()
    mp_db = get_mealplanner_db()

    print("=" * 60)
    print("DATABASE ANALYSIS")
    print("=" * 60)

    # Get all recipes from both databases
    default_recipes = list_all_recipes(default_db)
    mp_recipes = list_all_recipes(mp_db)

    print(f"\n(default) database: {len(default_recipes)} recipes")
    print(f"(meal-planner) database: {len(mp_recipes)} recipes")

    # Build URL index for meal-planner
    mp_by_url: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for doc_id, data in mp_recipes:
        url = normalize_url(data.get("url", ""))
        mp_by_url[url].append((doc_id, data))

    # Categorize default recipes
    already_in_mp = []
    to_migrate = []
    no_url = []

    for doc_id, data in default_recipes:
        url = normalize_url(data.get("url", ""))
        if not url:
            no_url.append((doc_id, data))
        elif url in mp_by_url:
            already_in_mp.append((doc_id, data, mp_by_url[url]))
        else:
            to_migrate.append((doc_id, data))

    print(f"\nRecipes in (default) already in meal-planner: {len(already_in_mp)}")
    print(f"Recipes to migrate: {len(to_migrate)}")
    print(f"Recipes without URL: {len(no_url)}")

    # Show recipes needing household assignment
    mp_unowned = [(doc_id, data) for doc_id, data in mp_recipes if not data.get("household_id")]
    print(f"\nRecipes in meal-planner without household: {len(mp_unowned)}")

    # Show enhanced vs non-enhanced
    mp_enhanced = [(doc_id, data) for doc_id, data in mp_recipes if data.get("enhanced") or data.get("improved")]
    print(f"Enhanced recipes in meal-planner: {len(mp_enhanced)}")

    return {
        "default_recipes": default_recipes,
        "mp_recipes": mp_recipes,
        "to_migrate": to_migrate,
        "already_in_mp": already_in_mp,
        "mp_unowned": mp_unowned,
    }


def migrate_recipes(*, dry_run: bool = False) -> None:
    """Migrate recipes from (default) to meal-planner."""
    print("\n" + "=" * 60)
    print("MIGRATING RECIPES FROM (default) TO (meal-planner)")
    print("=" * 60)

    analysis = analyze_databases()
    to_migrate = analysis["to_migrate"]

    if not to_migrate:
        print("\nNo recipes to migrate!")
        return

    mp_db = get_mealplanner_db()
    migrated = 0
    failed = 0

    for doc_id, data in to_migrate:
        title = data.get("title", "Untitled")

        if dry_run:
            print(f"  [DRY RUN] Would migrate: {title[:50]}")
            migrated += 1
            continue

        try:
            # Add migration metadata
            data["migrated_from_default"] = True
            data["migrated_at"] = datetime.now(UTC)
            data["visibility"] = data.get("visibility", "shared")  # Default to shared for legacy

            # Keep same document ID
            mp_db.collection("recipes").document(doc_id).set(data)
            print(f"  ✓ Migrated: {title[:50]}")
            migrated += 1
        except Exception as e:
            print(f"  ✗ Failed: {title[:50]} - {e}")
            failed += 1

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Migrated: {migrated}, Failed: {failed}")


def assign_household(household_id: str, *, dry_run: bool = False) -> None:
    """Assign all unowned recipes to a household."""
    print("\n" + "=" * 60)
    print(f"ASSIGNING UNOWNED RECIPES TO HOUSEHOLD: {household_id}")
    print("=" * 60)

    mp_db = get_mealplanner_db()

    # Find unowned recipes
    unowned = []
    for doc in mp_db.collection("recipes").stream():
        data = doc.to_dict()
        if not data.get("household_id"):
            unowned.append((doc.id, data))

    print(f"\nFound {len(unowned)} recipes without household assignment")

    if not unowned:
        return

    assigned = 0
    for doc_id, data in unowned:
        title = data.get("title", "Untitled")

        if dry_run:
            print(f"  [DRY RUN] Would assign: {title[:50]}")
            assigned += 1
            continue

        try:
            mp_db.collection("recipes").document(doc_id).update(
                {
                    "household_id": household_id,
                    "visibility": "shared",  # Keep visible to all
                    "assigned_at": datetime.now(UTC),
                }
            )
            print(f"  ✓ Assigned: {title[:50]}")
            assigned += 1
        except Exception as e:
            print(f"  ✗ Failed: {title[:50]} - {e}")

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Assigned: {assigned}")


def cleanup_default_db(*, dry_run: bool = False) -> None:
    """Delete all recipes from (default) database after migration."""
    print("\n" + "=" * 60)
    print("CLEANUP: Removing recipes from (default) database")
    print("=" * 60)

    default_db = get_default_db()
    mp_db = get_mealplanner_db()

    # Verify all recipes are in meal-planner first
    default_recipes = list_all_recipes(default_db)
    mp_recipes = list_all_recipes(mp_db)

    mp_ids = {doc_id for doc_id, _ in mp_recipes}
    mp_urls = {normalize_url(data.get("url", "")) for _, data in mp_recipes}

    not_migrated = []
    for doc_id, data in default_recipes:
        url = normalize_url(data.get("url", ""))
        if doc_id not in mp_ids and url not in mp_urls:
            not_migrated.append((doc_id, data))

    if not_migrated:
        print(f"\n⚠️  WARNING: {len(not_migrated)} recipes are NOT in meal-planner!")
        for doc_id, data in not_migrated[:10]:
            print(f"    - {data.get('title', 'Untitled')[:50]} (ID: {doc_id})")
        if len(not_migrated) > 10:
            print(f"    ... and {len(not_migrated) - 10} more")
        print("\nRun --migrate first to move these recipes.")
        return

    print(f"\nAll {len(default_recipes)} recipes from (default) are in meal-planner")

    deleted = 0
    for doc_id, data in default_recipes:
        title = data.get("title", "Untitled")

        if dry_run:
            print(f"  [DRY RUN] Would delete: {title[:50]}")
            deleted += 1
            continue

        try:
            default_db.collection("recipes").document(doc_id).delete()
            print(f"  ✓ Deleted: {title[:50]}")
            deleted += 1
        except Exception as e:
            print(f"  ✗ Failed to delete: {title[:50]} - {e}")

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Deleted: {deleted}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Consolidate (default) and meal-planner databases")
    parser.add_argument("--list", action="store_true", help="List what would be migrated")
    parser.add_argument("--migrate", action="store_true", help="Migrate recipes from (default) to meal-planner")
    parser.add_argument("--assign-household", metavar="ID", help="Assign unowned recipes to a household")
    parser.add_argument("--cleanup", action="store_true", help="Delete recipes from (default) after migration")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without making them")

    args = parser.parse_args()

    if not any([args.list, args.migrate, args.assign_household, args.cleanup]):
        parser.print_help()
        return

    if args.list:
        analyze_databases()

    if args.migrate:
        migrate_recipes(dry_run=args.dry_run)

    if args.assign_household:
        assign_household(args.assign_household, dry_run=args.dry_run)

    if args.cleanup:
        cleanup_default_db(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
