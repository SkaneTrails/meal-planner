"""Helper script for LLM-assisted recipe review and improvement.

Usage:
    # Get the next unprocessed recipe:
    uv run python scripts/recipe_reviewer.py next

    # Get a specific recipe by ID:
    uv run python scripts/recipe_reviewer.py get <recipe_id>

    # Mark a recipe as processed (without changes):
    uv run python scripts/recipe_reviewer.py skip <recipe_id>

    # Update a recipe field:
    uv run python scripts/recipe_reviewer.py update <recipe_id> <json_updates>

    # Upload from a local JSON file:
    uv run python scripts/recipe_reviewer.py upload <recipe_id> <file_path>

    # Show progress:
    uv run python scripts/recipe_reviewer.py status

Note: Reads from (default) database, writes improved recipes to meal-planner database.
"""

import json
import sys
from pathlib import Path

from google.cloud import firestore

# Local tracking file
PROGRESS_FILE = Path(__file__).parent.parent / "data" / "recipe_review_progress.json"
RECIPES_COLLECTION = "recipes"

# Database configuration
SOURCE_DATABASE = "(default)"  # Read original recipes from here
TARGET_DATABASE = "meal-planner"  # Write improved recipes here


def get_source_db() -> firestore.Client:
    """Get Firestore client for source (original) recipes."""
    return firestore.Client(database=SOURCE_DATABASE)


def get_target_db() -> firestore.Client:
    """Get Firestore client for target (improved) recipes."""
    return firestore.Client(database=TARGET_DATABASE)


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
    db = get_source_db()
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
    db = get_source_db()
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if doc.exists:
        data = doc.to_dict()
        if data is not None:
            display_recipe(doc.id, data)
    else:
        print(f"❌ Recipe not found: {recipe_id}")


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


def update_recipe(recipe_id: str, updates: dict) -> None:
    """Update/create a recipe in the target database with improvements."""
    from datetime import UTC, datetime

    source_db = get_source_db()
    target_db = get_target_db()

    # Get original recipe from source
    source_doc = source_db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if not source_doc.exists:
        print(f"❌ Recipe not found in source: {recipe_id}")
        return

    # Merge original data with updates
    original_data = source_doc.to_dict()
    if original_data is None:
        print(f"❌ Recipe data is empty: {recipe_id}")
        return

    now = datetime.now(tz=UTC)
    improved_data = {**original_data, **updates}
    improved_data["original_id"] = recipe_id  # Track source recipe ID
    improved_data["improved"] = True
    # Ensure timestamps exist (required for Firestore order_by queries)
    if "created_at" not in improved_data:
        improved_data["created_at"] = now
    improved_data["updated_at"] = now

    # Save to target database with same ID
    target_db.collection(RECIPES_COLLECTION).document(recipe_id).set(improved_data)
    print(f"✅ Saved improved recipe to meal-planner database: {recipe_id}")
    print(f"   Updated fields: {list(updates.keys())}")

    # Mark as processed
    mark_processed(recipe_id)


def upload_from_file(recipe_id: str, file_path: str) -> None:
    """Upload an enhanced recipe from a local JSON file to the target database."""
    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        return

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path}: {e}")
        return

    target_db = get_target_db()

    # Ensure tracking fields
    data["original_id"] = recipe_id
    data["improved"] = True

    # Save to target database
    target_db.collection(RECIPES_COLLECTION).document(recipe_id).set(data)
    print(f"✅ Uploaded {path.name} to meal-planner database: {recipe_id}")

    # Mark as processed
    mark_processed(recipe_id)


def show_status() -> None:
    """Show review progress."""
    source_db = get_source_db()
    target_db = get_target_db()
    progress = load_progress()

    total = sum(1 for _ in source_db.collection(RECIPES_COLLECTION).stream())
    processed = len(progress.get("processed", []))
    skipped = len(progress.get("skipped", []))
    remaining = total - processed - skipped

    # Count recipes in target database
    target_count = sum(1 for _ in target_db.collection(RECIPES_COLLECTION).stream())

    print("\n📊 Recipe Review Progress")
    print(f"   Source database: {SOURCE_DATABASE}")
    print(f"   Target database: {TARGET_DATABASE}")
    print(f"   Total recipes:       {total}")
    print(f"   ✅ Processed:        {processed}")
    print(f"   ⏭️ Skipped:          {skipped}")
    print(f"   📝 Remaining:        {remaining}")
    print(f"   🎯 In target DB:     {target_count}")
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
