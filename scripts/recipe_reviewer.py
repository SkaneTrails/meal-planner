"""Helper script for LLM-assisted recipe review and improvement.

Enhancement preserves original data in the same Firestore document:
- Top-level fields = enhanced version (what the app displays)
- original = nested snapshot of scraped data (for "view original" toggle)
- enhanced/enhanced_at/changes_made = enhancement metadata

CRITICAL: update/upload NEVER use .set() — they use .update() to merge
fields without overwriting the rest of the document.

Usage:
    # Get the next unprocessed recipe:
    uv run python scripts/recipe_reviewer.py next

    # Get a specific recipe by ID:
    uv run python scripts/recipe_reviewer.py get <recipe_id>

    # Get the enhanced version of a recipe:
    uv run python scripts/recipe_reviewer.py enhanced <recipe_id>

    # Delete a bad enhanced recipe and unmark from processed:
    uv run python scripts/recipe_reviewer.py delete <recipe_id>

    # Mark a recipe as processed (without changes):
    uv run python scripts/recipe_reviewer.py skip <recipe_id>

    # Enhance a recipe (preserves original in nested field):
    uv run python scripts/recipe_reviewer.py update <recipe_id> <json_updates>

    # Upload enhancement from a local JSON file:
    uv run python scripts/recipe_reviewer.py upload <recipe_id> <file_path>

    # Show progress:
    uv run python scripts/recipe_reviewer.py status

Note: Reads and writes recipes in the meal-planner database.
"""

import json
import sys
from pathlib import Path

from google.cloud import firestore

# Local tracking file
PROGRESS_FILE = Path(__file__).parent.parent / "data" / "recipe_review_progress.json"
RECIPES_COLLECTION = "recipes"

# Database configuration
DATABASE = "meal-planner"


def get_db() -> firestore.Client:
    """Get Firestore client."""
    return firestore.Client(database=DATABASE)


def load_progress() -> dict:
    """Load progress tracking data."""
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {"processed": [], "skipped": []}


def save_progress(progress: dict) -> None:
    """Save progress tracking data."""
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))


def get_next_recipe() -> None:
    """Get the next unprocessed recipe and display it."""
    db = get_db()
    progress = load_progress()
    processed_ids = set(progress.get("processed", []) + progress.get("skipped", []))

    # Stream all recipes and find first unprocessed
    for doc in db.collection(RECIPES_COLLECTION).order_by("title").stream():
        if doc.id not in processed_ids:
            display_recipe(doc.id, doc.to_dict())
            return

    print("🎉 All recipes have been processed!")


def get_recipe(recipe_id: str) -> None:
    """Get a specific recipe by ID."""
    db = get_db()
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if doc.exists:  # type: ignore[union-attr]
        data = doc.to_dict()  # type: ignore[union-attr]
        if data is not None:
            display_recipe(doc.id, data)  # type: ignore[union-attr]
    else:
        print(f"❌ Recipe not found: {recipe_id}")


def get_enhanced_recipe(recipe_id: str) -> None:
    """Get the enhanced version of a recipe."""
    db = get_db()
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if doc.exists:  # type: ignore[union-attr]
        data = doc.to_dict()  # type: ignore[union-attr]
        if data is not None and data.get("enhanced"):
            print("\n\U0001f3af ENHANCED VERSION")
            display_recipe(doc.id, data)  # type: ignore[union-attr]
            if data.get("changes_made"):
                print("\n--- CHANGES MADE ---")
                for change in data["changes_made"]:
                    print(f"  • {change}")
            if data.get("original"):
                orig = data["original"]
                print(
                    f"\n📋 Original preserved: {len(orig.get('ingredients', []))} ingredients, "
                    f"{len(orig.get('instructions', []))} steps"
                )
        elif data is not None:
            print(f"\u26a0\ufe0f Recipe {recipe_id} exists but is not enhanced")
        else:
            print(f"\u274c No enhanced version found: {recipe_id}")
    else:
        print(f"❌ No enhanced version found: {recipe_id}")


def delete_enhanced_recipe(recipe_id: str) -> None:
    """Delete a bad enhanced recipe and remove from processed list."""
    db = get_db()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)
    doc = doc_ref.get()

    if not doc.exists:  # type: ignore[union-attr]
        print(f"❌ No enhanced version found: {recipe_id}")
        return

    data = doc.to_dict()  # type: ignore[union-attr]
    if not data or not data.get("enhanced"):
        print(f"\u26a0\ufe0f Recipe {recipe_id} is not enhanced. Use --force to delete anyway.")
        if "--force" not in sys.argv:
            return

    doc_ref.delete()
    print(f"\U0001f5d1\ufe0f Deleted enhanced recipe: {recipe_id}")

    # Remove from processed list
    progress = load_progress()
    if recipe_id in progress.get("processed", []):
        progress["processed"].remove(recipe_id)
        save_progress(progress)
        print("   Removed from processed list")


def display_recipe(recipe_id: str, data: dict) -> None:
    """Display a recipe in a readable format."""
    print(f"\n{'=' * 80}")
    print(f"RECIPE ID: {recipe_id}")
    print(f"{'=' * 80}")
    print(f"Title: {data.get('title', 'N/A')}")
    print(f"URL: {data.get('url', 'N/A')}")
    print(f"Servings: {data.get('servings', 'N/A')}")
    print(f"Prep Time: {data.get('prep_time', 'N/A')} min")
    print(f"Cook Time: {data.get('cook_time', 'N/A')} min")
    print(f"Total Time: {data.get('total_time', 'N/A')} min")
    print(f"Diet Label: {data.get('diet_label', 'N/A')}")
    print(f"Meal Label: {data.get('meal_label', 'N/A')}")
    print(f"Category: {data.get('category', 'N/A')}")
    print(f"Cuisine: {data.get('cuisine', 'N/A')}")
    print(f"Tags: {data.get('tags', [])}")

    print(f"\n--- INGREDIENTS ({len(data.get('ingredients', []))}) ---")
    for i, ing in enumerate(data.get("ingredients", []), 1):
        print(f"  {i}. {ing}")

    print(f"\n--- INSTRUCTIONS ({len(data.get('instructions', []))}) ---")
    for i, step in enumerate(data.get("instructions", []), 1):
        # Truncate long instructions for readability
        step_preview = step[:200] + "..." if len(step) > 200 else step
        print(f"  {i}. {step_preview}")

    print(f"\nImage: {data.get('image_url', 'N/A')}")
    print(f"{'=' * 80}\n")


def mark_processed(recipe_id: str) -> None:
    """Mark a recipe as processed."""
    progress = load_progress()
    if recipe_id not in progress["processed"]:
        progress["processed"].append(recipe_id)
        save_progress(progress)
    print(f"✅ Marked as processed: {recipe_id}")


def mark_skipped(recipe_id: str) -> None:
    """Mark a recipe as skipped (no changes needed)."""
    progress = load_progress()
    if recipe_id not in progress["skipped"]:
        progress["skipped"].append(recipe_id)
        save_progress(progress)
    print(f"⏭️ Marked as skipped: {recipe_id}")


# Fields to snapshot from the original before enhancing
ORIGINAL_SNAPSHOT_FIELDS = [
    "title",
    "ingredients",
    "instructions",
    "servings",
    "prep_time",
    "cook_time",
    "total_time",
    "image_url",
]


def update_recipe(recipe_id: str, updates: dict) -> None:
    """Enhance a recipe in-place, preserving the original data.

    Enhancement structure (same document):
    - Top-level fields = enhanced version (what the app displays)
    - original = nested snapshot of scraped data (for "view original" toggle)
    - enhanced = True, enhanced_at, changes_made = enhancement metadata

    CRITICAL: Never overwrites the document. Uses Firestore .update() to merge
    fields into the existing document. The original snapshot is set once on first
    enhancement and never modified after.
    """
    from datetime import UTC, datetime

    from google.cloud.firestore_v1 import DELETE_FIELD

    db = get_db()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)
    doc = doc_ref.get()  # type: ignore[union-attr]

    if not doc.exists:  # type: ignore[union-attr]
        print(f"❌ Recipe not found: {recipe_id}")
        return

    current_data = doc.to_dict()  # type: ignore[union-attr]
    if current_data is None:
        print(f"❌ Recipe data is empty: {recipe_id}")
        return

    now = datetime.now(tz=UTC)
    update_payload: dict = {}

    # First enhancement: snapshot original before overwriting top-level fields
    if not current_data.get("enhanced") and "original" not in current_data:
        print("🆕 First enhancement — snapshotting original data")
        original_snapshot = {}
        for field in ORIGINAL_SNAPSHOT_FIELDS:
            if field in current_data:
                original_snapshot[field] = current_data[field]
        update_payload["original"] = original_snapshot
    else:
        print("📝 Updating existing enhanced recipe")

    # Apply enhanced fields at top level
    update_payload.update(updates)

    # Set enhancement metadata
    update_payload["enhanced"] = True
    update_payload["enhanced_at"] = now
    update_payload["updated_at"] = now

    # Clean up legacy fields from old enhancement system
    for legacy_field in ("improved", "original_id", "enhanced_from"):
        if legacy_field in current_data:
            update_payload[legacy_field] = DELETE_FIELD

    # Merge into existing document (never overwrites unrelated fields)
    doc_ref.update(update_payload)
    print(f"✅ Enhanced recipe: {recipe_id}")
    print(f"   Updated fields: {list(updates.keys())}")
    if "original" in update_payload:
        print(f"   Original snapshot: {len(update_payload['original'])} fields preserved")

    # Mark as processed
    mark_processed(recipe_id)


def upload_from_file(recipe_id: str, file_path: str) -> None:
    """Upload an enhanced recipe from a JSON file, preserving the original.

    Uses the same snapshot-and-update pattern as update_recipe:
    original data is preserved in the `original` nested field.
    """
    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        return

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path}: {e}")
        return

    # Remove legacy fields if present in the JSON file
    for legacy_field in ("improved", "original_id", "enhanced_from"):
        data.pop(legacy_field, None)

    # Delegate to update_recipe which handles snapshotting and merging
    update_recipe(recipe_id, data)


def show_status() -> None:
    """Show review progress."""
    db = get_db()
    progress = load_progress()

    total = sum(1 for _ in db.collection(RECIPES_COLLECTION).stream())
    processed = len(progress.get("processed", []))
    skipped = len(progress.get("skipped", []))
    remaining = total - processed - skipped

    print("\n📊 Recipe Review Progress")
    print(f"   Database: {DATABASE}")
    print(f"   Total recipes:       {total}")
    print(f"   ✅ Processed:        {processed}")
    print(f"   ⏭️ Skipped:          {skipped}")
    print(f"   📝 Remaining:        {remaining}")
    print(f"   Progress:            {((processed + skipped) / total * 100):.1f}%\n")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == "next":
        get_next_recipe()
    elif command == "get" and len(sys.argv) >= 3:
        get_recipe(sys.argv[2])
    elif command == "enhanced" and len(sys.argv) >= 3:
        get_enhanced_recipe(sys.argv[2])
    elif command == "delete" and len(sys.argv) >= 3:
        delete_enhanced_recipe(sys.argv[2])
    elif command == "skip" and len(sys.argv) >= 3:
        mark_skipped(sys.argv[2])
    elif command == "done" and len(sys.argv) >= 3:
        mark_processed(sys.argv[2])
    elif command == "status":
        show_status()
    elif command == "update" and len(sys.argv) >= 4:
        # For complex updates, we'll handle this via Python dict
        recipe_id = sys.argv[2]
        # Parse remaining args as JSON
        updates_json = " ".join(sys.argv[3:])
        try:
            updates = json.loads(updates_json)
            update_recipe(recipe_id, updates)
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON: {updates_json}")
    elif command == "upload" and len(sys.argv) >= 4:
        # Upload from a JSON file
        recipe_id = sys.argv[2]
        file_path = sys.argv[3]
        upload_from_file(recipe_id, file_path)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
