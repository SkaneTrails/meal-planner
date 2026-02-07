"""Upload a previously enhanced recipe from JSON to the meal-planner database.

Delegates to recipe_reviewer.upload_from_file which handles:
- Snapshotting original data into nested `original` field
- Merging enhanced data at top level via .update() (never .set())
- Cleaning up legacy fields (improved, original_id, enhanced_from)

Usage:
    uv run python scripts/upload_enhanced_recipe.py <recipe_id>

Example:
    uv run python scripts/upload_enhanced_recipe.py cPqagQA0l7SaOPo8cKTk
"""

import sys
from pathlib import Path

from scripts.recipe_reviewer import upload_from_file


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/upload_enhanced_recipe.py <recipe_id>")
        sys.exit(1)

    recipe_id = sys.argv[1]
    json_path = Path(f"data/enhanced_{recipe_id}.json")

    if not json_path.exists():
        print(f"❌ File not found: {json_path}")
        sys.exit(1)

    upload_from_file(recipe_id, str(json_path))


if __name__ == "__main__":
    main()
