"""Backfill hidden and favorited fields on all recipe documents.

Firestore equality filters (e.g. hidden == False) only match documents
that actually have the field. This script adds the default values to
every recipe that is missing them.

Usage:
    uv run python scripts/backfill_visibility_fields.py --project hikes-482104
    uv run python scripts/backfill_visibility_fields.py --project hikes-482104 --dry-run
"""

import argparse

from google.cloud import firestore

DATABASE = "meal-planner"
RECIPES_COLLECTION = "recipes"

FIELDS_TO_BACKFILL = {"hidden": False, "favorited": False}


def backfill(project: str, *, dry_run: bool = False) -> None:
    db = firestore.Client(project=project, database=DATABASE)
    docs = db.collection(RECIPES_COLLECTION).stream()

    updated = 0
    skipped = 0
    total = 0

    for doc in docs:
        total += 1
        data = doc.to_dict() or {}

        missing = {k: v for k, v in FIELDS_TO_BACKFILL.items() if k not in data}

        if not missing:
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] {doc.id}: would set {missing}")
            updated += 1
        else:
            try:
                doc.reference.update(missing)
                print(f"  Updated {doc.id}: set {missing}")
                updated += 1
            except Exception as e:
                print(f"  ERROR {doc.id}: {e}")

    print(f"\nDone. Total: {total}, Updated: {updated}, Skipped: {skipped}")

    if dry_run and updated > 0:
        print(f"\nRe-run without --dry-run to apply {updated} updates.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill hidden/favorited fields on recipes")
    parser.add_argument("--project", required=True, help="GCP project ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    print(f"Backfilling {FIELDS_TO_BACKFILL} on all recipes in {args.project}/{DATABASE}...")
    if args.dry_run:
        print("(DRY RUN — no changes will be written)\n")

    backfill(args.project, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
