"""Upload a previously enhanced recipe from JSON to the meal-planner database.

Delegates to recipe_manager.upload_from_file which handles:
- Snapshotting original data into nested `original` field
- Merging enhanced data at top level via .update() (never .set())
- Cleaning up legacy fields (improved, original_id, enhanced_from)

Usage:
    uv run python scripts/upload_enhanced_recipe.py --project <project_id> <recipe_id>

Example:
    uv run python scripts/upload_enhanced_recipe.py --project hikes-482104 cPqagQA0l7SaOPo8cKTk
"""

import argparse
from pathlib import Path

from tools.recipe_manager import _set_project, upload_from_file


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload an enhanced recipe from JSON")
    parser.add_argument("--project", required=True, help="GCP project ID")
    parser.add_argument("recipe_id", help="Firestore recipe document ID")
    args = parser.parse_args()

    json_path = Path(f"data/enhanced_{args.recipe_id}.json")

    if not json_path.exists():
        print(f"❌ File not found: {json_path}")
        raise SystemExit(1)

    _set_project(args.project)
    upload_from_file(args.recipe_id, str(json_path))


if __name__ == "__main__":
    main()
