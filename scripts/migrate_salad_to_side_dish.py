"""Migrate meal_label from 'salad' to 'side_dish' on existing recipes.

The 'salad' meal label has been renamed to 'side_dish'. This script
updates all Firestore recipes that still have meal_label='salad'.

Usage:
    uv run python scripts/migrate_salad_to_side_dish.py [--dry-run]
"""

import argparse
import sys

from google.cloud.firestore_v1.base_query import FieldFilter

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


def migrate(*, dry_run: bool = False) -> None:
    db = get_firestore_client()
    docs = db.collection(RECIPES_COLLECTION).where(filter=FieldFilter("meal_label", "==", "salad")).stream()

    updated = 0

    for doc in docs:
        title = doc.to_dict().get("title", "(untitled)")

        if dry_run:
            print(f"  [DRY RUN] {doc.id} ({title}): would change salad → side_dish")
        else:
            doc.reference.update({"meal_label": "side_dish"})
            print(f"  {doc.id} ({title}): salad → side_dish")

        updated += 1

    if updated == 0:
        print("No recipes with meal_label='salad' found.")
    else:
        action = "Would update" if dry_run else "Updated"
        print(f"\n{action} {updated} recipe(s).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate meal_label from 'salad' to 'side_dish'")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing to Firestore")
    args = parser.parse_args()

    print("Migrating meal_label: salad → side_dish...")
    if args.dry_run:
        print("(DRY RUN — no changes will be written)\n")

    migrate(dry_run=args.dry_run)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
