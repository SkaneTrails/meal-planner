"""Create a new recipe in the meal-planner database from a JSON file."""

import json
from datetime import UTC, datetime
from pathlib import Path

from google.cloud import firestore


def main() -> None:
    db = firestore.Client(database="meal-planner")

    with Path("data/temp_update.json").open(encoding="utf-8") as f:
        recipe = json.load(f)

    recipe["created_at"] = datetime.now(tz=UTC)
    recipe["updated_at"] = datetime.now(tz=UTC)

    doc_ref = db.collection("recipes").document()
    doc_ref.set(recipe)

    print(f"✅ Created new recipe: {doc_ref.id}")
    print(f"   Title: {recipe['title']}")


if __name__ == "__main__":
    main()
