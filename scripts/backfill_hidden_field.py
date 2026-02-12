"""Backfill hidden field on recipes that are missing it.

Firestore WHERE hidden==false only matches documents where the field
explicitly exists. Recipes created before the hidden field was added
to save_recipe() are missing it and therefore invisible in default
list views.

Usage:
    uv run python scripts/backfill_hidden_field.py [--dry-run]
"""

import argparse
import sys

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


def backfill(*, dry_run: bool = False) -> None:
    """Set hidden=False on every recipe that is missing the field."""
    db = get_firestore_client()
    docs = db.collection(RECIPES_COLLECTION).stream()

    updated = 0
    skipped = 0

    for doc in docs:
        data = doc.to_dict()

        if "hidden" in data:
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] {doc.id}: would set hidden=False")
        else:
            doc.reference.update({"hidden": False})

        updated += 1

    action = "Would update" if dry_run else "Updated"
    print(f"\n{action} {updated} recipes, skipped {skipped} (already have hidden field).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill hidden field on recipes missing it")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing to Firestore")
    args = parser.parse_args()

    print("Backfilling hidden field on recipes...")
    if args.dry_run:
        print("(DRY RUN — no changes will be written)\n")

    backfill(dry_run=args.dry_run)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
