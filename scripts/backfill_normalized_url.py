"""Backfill normalized_url field on all existing recipes.

One-time migration script. After running, all recipes will have a
``normalized_url`` field that allows efficient Firestore queries
instead of loading the entire collection for URL deduplication.

Usage:
    uv run python scripts/backfill_normalized_url.py [--dry-run]
"""

import argparse
import sys

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client
from api.storage.recipe_storage import normalize_url


def backfill(*, dry_run: bool = False) -> None:
    """Add normalized_url to every recipe that is missing it."""
    db = get_firestore_client()
    docs = db.collection(RECIPES_COLLECTION).stream()

    updated = 0
    skipped = 0

    for doc in docs:
        data = doc.to_dict()
        url = data.get("url", "")
        existing_normalized = data.get("normalized_url")
        computed = normalize_url(url)

        if existing_normalized == computed:
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] {doc.id}: {url!r} -> {computed!r}")
        else:
            doc.reference.update({"normalized_url": computed})

        updated += 1

    action = "Would update" if dry_run else "Updated"
    print(f"\n{action} {updated} recipes, skipped {skipped} (already correct).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill normalized_url on all recipes")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing to Firestore")
    args = parser.parse_args()

    try:
        backfill(dry_run=args.dry_run)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
