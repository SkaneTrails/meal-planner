"""Upload a previously enhanced recipe from JSON to the meal-planner database.

This script is used to re-upload enhanced recipes that were lost or overwritten.
It reads from a JSON file and writes to the meal-planner database with proper
field transformations.

Usage:
    uv run python scripts/upload_enhanced_recipe.py <recipe_id>

Example:
    uv run python scripts/upload_enhanced_recipe.py cPqagQA0l7SaOPo8cKTk
"""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from google.cloud import firestore


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/upload_enhanced_recipe.py <recipe_id>")
        sys.exit(1)

    recipe_id = sys.argv[1]
    json_path = Path(f"data/enhanced_{recipe_id}.json")

    if not json_path.exists():
        print(f"❌ File not found: {json_path}")
        sys.exit(1)

    print(f"📖 Reading from: {json_path}")

    with json_path.open(encoding="utf-8") as f:
        recipe = json.load(f)

    # Transform the data to match Firestore schema
    # Flatten metadata if present
    if "metadata" in recipe:
        metadata = recipe.pop("metadata")
        if "cuisine" in metadata:
            recipe["cuisine"] = metadata["cuisine"]
        if "category" in metadata:
            recipe["category"] = metadata["category"]
        if "tags" in metadata:
            recipe["tags"] = metadata["tags"]

    # Ensure instructions is a list (some JSON files have it as a string)
    if isinstance(recipe.get("instructions"), str):
        # Split by double newlines to get paragraphs, filter empty
        instructions_text = recipe["instructions"]
        # Keep as single timeline string for now - it's a timeline format
        recipe["instructions"] = [instructions_text]

    # Add required fields
    now = datetime.now(tz=UTC)
    recipe["created_at"] = now
    recipe["updated_at"] = now
    recipe["improved"] = True
    recipe["original_id"] = recipe_id

    # Get original recipe URL if not present
    if "url" not in recipe or not recipe["url"]:
        # Fetch from database
        db = firestore.Client(database="meal-planner")
        original_doc = db.collection("recipes").document(recipe_id).get()
        if original_doc.exists:  # type: ignore[union-attr]
            original_data = original_doc.to_dict()  # type: ignore[union-attr]
            if original_data is not None:
                recipe["url"] = original_data.get("url", "")
                recipe["image_url"] = original_data.get("image_url")
                if not recipe.get("servings"):
                    recipe["servings"] = original_data.get("servings")
                print(f"   Retrieved URL from existing recipe: {recipe['url'][:50]}...")

    # Connect to database
    db = firestore.Client(database="meal-planner")
    doc_ref = db.collection("recipes").document(recipe_id)

    # Upload
    doc_ref.set(recipe)

    print(f"✅ Uploaded enhanced recipe: {recipe_id}")
    print(f"   Title: {recipe['title']}")
    print(f"   Ingredients: {len(recipe.get('ingredients', []))} items")
    print(f"   Changes made: {len(recipe.get('changes_made', []))} items")
    if recipe.get("tips"):
        print(f"   Tips: {recipe['tips'][:60]}...")


if __name__ == "__main__":
    main()
