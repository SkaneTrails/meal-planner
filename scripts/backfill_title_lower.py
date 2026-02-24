"""Backfill title_lower field on all recipes.

Adds a lowercase copy of the title to enable case-insensitive
Firestore range queries in the future.

Usage:
    uv run python scripts/backfill_title_lower.py --project <project_id>
    uv run python scripts/backfill_title_lower.py --project <project_id> --dry-run
"""

import argparse

from google.cloud import firestore

DATABASE = "meal-planner"
COLLECTION = "recipes"


def backfill(project: str, *, dry_run: bool = False) -> None:
    db = firestore.Client(project=project, database=DATABASE)
    docs = db.collection(COLLECTION).stream()

    updated = 0
    skipped = 0

    for doc in docs:
        data = doc.to_dict()
        title = data.get("title", "")
        existing_lower = data.get("title_lower")

        if existing_lower == title.lower():
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] {doc.id}: '{title}' → title_lower='{title.lower()}'")
        else:
            doc.reference.update({"title_lower": title.lower()})

        updated += 1

    action = "Would update" if dry_run else "Updated"
    print(f"\n{action} {updated} recipes, skipped {skipped} (already correct)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill title_lower field on recipes")
    parser.add_argument("--project", required=True, help="GCP project ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    backfill(args.project, dry_run=args.dry_run)
