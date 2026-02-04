"""Database migration: Consolidate with original↔enhanced linking.

Strategy:
- Enhanced recipes in meal-planner keep their IDs
- Original recipes from (default) get suffix "_original" to avoid collision
- Enhanced recipes get enhanced_from pointing to the original
- All recipes assigned to ExampleHousehold with visibility="shared"
"""

from datetime import UTC, datetime
from urllib.parse import urlparse

from google.cloud import firestore

PROJECT_ID = "REDACTED_PROJECT_ID"
EXAMPLE_HOUSEHOLD_ID = "REDACTED_HOUSEHOLD_ID"
TREVISO_ID = "yV3C1rzjYJyOQ06T7B9r"


def normalize_url(url: str) -> str:
    """Normalize URL for comparison."""
    if not url:
        return ""
    parsed = urlparse(url.lower().strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def get_default_db() -> firestore.Client:
    return firestore.Client(project=PROJECT_ID)


def get_mealplanner_db() -> firestore.Client:
    return firestore.Client(project=PROJECT_ID, database="meal-planner")


def analyze():
    """Analyze current state of both databases."""
    default_db = get_default_db()
    mp_db = get_mealplanner_db()

    print("=" * 60)
    print("DATABASE ANALYSIS")
    print("=" * 60)

    # Get all recipes
    default_recipes = [(doc.id, doc.to_dict()) for doc in default_db.collection("recipes").stream()]
    mp_recipes = [(doc.id, doc.to_dict()) for doc in mp_db.collection("recipes").stream()]

    print(f"\n(default) database: {len(default_recipes)} recipes")
    print(f"(meal-planner) database: {len(mp_recipes)} recipes")

    # Find enhanced recipes in meal-planner
    mp_enhanced = [(doc_id, data) for doc_id, data in mp_recipes if data.get("enhanced") or data.get("improved")]
    mp_not_enhanced = [
        (doc_id, data) for doc_id, data in mp_recipes if not (data.get("enhanced") or data.get("improved"))
    ]

    print(f"\nIn meal-planner: {len(mp_enhanced)} enhanced, {len(mp_not_enhanced)} not enhanced")

    # Check ID collisions
    default_ids = {doc_id for doc_id, _ in default_recipes}
    mp_ids = {doc_id for doc_id, _ in mp_recipes}
    collisions = default_ids & mp_ids

    print(f"ID collisions (same ID in both): {len(collisions)}")

    # Check which collisions are enhanced↔original pairs
    pairs = []
    for doc_id in collisions:
        default_data = next(d for i, d in default_recipes if i == doc_id)
        mp_data = next(d for i, d in mp_recipes if i == doc_id)
        default_enhanced = default_data.get("enhanced") or default_data.get("improved")
        mp_enhanced_flag = mp_data.get("enhanced") or mp_data.get("improved")

        if mp_enhanced_flag and not default_enhanced:
            pairs.append((doc_id, "mp=enhanced, default=original"))
        elif default_enhanced and not mp_enhanced_flag:
            pairs.append((doc_id, "default=enhanced, mp=original (unexpected!)"))
        elif mp_enhanced_flag and default_enhanced:
            pairs.append((doc_id, "both enhanced"))
        else:
            pairs.append((doc_id, "neither enhanced"))

    print("\nCollision breakdown:")
    from collections import Counter

    counts = Counter(p[1] for p in pairs)
    for pattern, count in counts.items():
        print(f"  {pattern}: {count}")

    # Recipes only in (default) - no collision
    only_in_default = [(doc_id, data) for doc_id, data in default_recipes if doc_id not in mp_ids]
    print(f"\nRecipes only in (default), no collision: {len(only_in_default)}")

    return {
        "default_recipes": default_recipes,
        "mp_recipes": mp_recipes,
        "mp_enhanced": mp_enhanced,
        "collisions": collisions,
        "only_in_default": only_in_default,
    }


def migrate_and_link(*, dry_run: bool = True):
    """
    Full migration:
    1. Import originals from (default) where enhanced exists in meal-planner
       - Use ID suffix "_original" to avoid collision
    2. Link enhanced recipes to their originals
    3. Import non-colliding recipes from (default) with original ID
    4. Set all to ExampleHousehold + visibility='shared'
    """
    print("\n" + "=" * 60)
    print("MIGRATION: Consolidate databases with linking")
    print("=" * 60)

    analysis = analyze()
    mp_db = get_mealplanner_db()
    default_db = get_default_db()

    # Build lookup for default recipes by ID
    default_by_id = dict(analysis["default_recipes"])

    # Step 1: For each enhanced recipe in meal-planner, import its original
    print(f"\n--- Step 1: Import originals for {len(analysis['mp_enhanced'])} enhanced recipes ---")
    imported_originals = 0

    for doc_id, _enhanced_data in analysis["mp_enhanced"]:
        # Check if original exists in (default) with same ID
        if doc_id not in default_by_id:
            print(f"  ⚠ No original found for: {doc_id}")
            continue

        original_data = default_by_id[doc_id]

        # Skip if original is also enhanced (weird state)
        if original_data.get("enhanced") or original_data.get("improved"):
            print(f"  ⚠ Original also enhanced, skipping: {doc_id}")
            continue

        # Create new ID for original
        original_new_id = f"{doc_id}_original"

        # Check if already imported
        existing = mp_db.collection("recipes").document(original_new_id).get()
        if existing.exists:
            if dry_run:
                pass  # Don't spam
            continue

        # Prepare original recipe data
        original_data["household_id"] = EXAMPLE_HOUSEHOLD_ID
        original_data["visibility"] = "shared"
        original_data["imported_at"] = datetime.now(UTC)
        original_data["imported_from"] = "(default)"
        # Ensure enhanced=False for original
        original_data["enhanced"] = False
        original_data.pop("improved", None)

        if dry_run:
            print(f"  [DRY RUN] Import original: {original_new_id}")
        else:
            mp_db.collection("recipes").document(original_new_id).set(original_data)
            print(f"  ✓ Imported original: {original_new_id}")
        imported_originals += 1

    print(f"  → Imported: {imported_originals}")

    # Step 2: Link enhanced to originals
    print("\n--- Step 2: Link enhanced → original ---")
    linked = 0

    for doc_id, _enhanced_data in analysis["mp_enhanced"]:
        if doc_id not in default_by_id:
            continue

        original_data = default_by_id[doc_id]
        if original_data.get("enhanced") or original_data.get("improved"):
            continue

        original_new_id = f"{doc_id}_original"

        update = {
            "enhanced_from": original_new_id,
            "household_id": EXAMPLE_HOUSEHOLD_ID,
            "visibility": "shared",
            "enhanced": True,  # Ensure flag is set
        }

        if dry_run:
            print(f"  [DRY RUN] Link: {doc_id} → {original_new_id}")
        else:
            mp_db.collection("recipes").document(doc_id).update(update)
            print(f"  ✓ Linked: {doc_id} → {original_new_id}")
        linked += 1

    print(f"  → Linked: {linked}")

    # Step 3: Import non-colliding recipes from (default)
    print(f"\n--- Step 3: Import {len(analysis['only_in_default'])} non-colliding recipes ---")
    imported_new = 0

    for doc_id, data in analysis["only_in_default"]:
        # Check if already exists (shouldn't, but be safe)
        existing = mp_db.collection("recipes").document(doc_id).get()
        if existing.exists:
            continue

        data["household_id"] = EXAMPLE_HOUSEHOLD_ID
        data["visibility"] = "shared"
        data["imported_at"] = datetime.now(UTC)
        data["imported_from"] = "(default)"

        if dry_run:
            if imported_new < 10:  # Limit output
                print(f"  [DRY RUN] Import: {data.get('title', 'Untitled')[:40]}")
        else:
            mp_db.collection("recipes").document(doc_id).set(data)
        imported_new += 1

    if dry_run and imported_new > 10:
        print(f"  ... and {imported_new - 10} more")
    print(f"  → Imported: {imported_new}")

    # Step 4: Update existing meal-planner recipes without household
    print("\n--- Step 4: Set household/visibility on all meal-planner recipes ---")
    updated = 0
    for doc_id, data in analysis["mp_recipes"]:
        if data.get("household_id") == EXAMPLE_HOUSEHOLD_ID:
            continue

        if dry_run:
            pass
        else:
            mp_db.collection("recipes").document(doc_id).update({"household_id": EXAMPLE_HOUSEHOLD_ID, "visibility": "shared"})
        updated += 1

    print(f"  → Updated: {updated}")

    print("\n" + "=" * 60)
    prefix = "[DRY RUN] " if dry_run else ""
    print(f"{prefix}SUMMARY:")
    print(f"  Imported originals (with _original suffix): {imported_originals}")
    print(f"  Linked enhanced → original: {linked}")
    print(f"  Imported new (no collision): {imported_new}")
    print(f"  Updated household/visibility: {updated}")
    print("=" * 60)


if __name__ == "__main__":
    import sys

    dry_run = "--execute" not in sys.argv
    if dry_run:
        print("*** DRY RUN MODE - use --execute to apply changes ***\n")
    migrate_and_link(dry_run=dry_run)
