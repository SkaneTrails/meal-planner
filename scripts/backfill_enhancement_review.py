#!/usr/bin/env python3
"""Backfill enhancement_reviewed and show_enhanced for existing enhanced recipes.

Sets enhancement_reviewed=True and show_enhanced=True for all recipes that:
- Have enhanced=True (already AI-enhanced)
- Don't already have enhancement_reviewed set

This marks existing enhanced recipes as "already reviewed and approved" so users
don't see review modals for recipes they've been using for months.

Usage:
    python scripts/backfill_enhancement_review.py --dry-run   # Preview changes
    python scripts/backfill_enhancement_review.py             # Apply changes
"""

import argparse
import sys
from datetime import UTC, datetime
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv()

from google.cloud.firestore_v1 import FieldFilter

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


def backfill_enhancement_review(*, dry_run: bool = True) -> None:
    """Backfill enhancement_reviewed and show_enhanced fields."""
    db = get_firestore_client()

    # Query for enhanced recipes that haven't been reviewed
    query = db.collection(RECIPES_COLLECTION).where(filter=FieldFilter("enhanced", "==", True))

    docs = list(query.stream())
    print(f"Found {len(docs)} enhanced recipes")

    updated = 0
    skipped = 0

    for doc in docs:
        data = doc.to_dict()
        if not data:
            continue

        # Skip if already reviewed
        if data.get("enhancement_reviewed"):
            skipped += 1
            continue

        recipe_id = doc.id
        title = data.get("title", "(untitled)")

        if dry_run:
            print(f"  [DRY-RUN] Would update: {recipe_id} - {title}")
        else:
            try:
                doc.reference.update(
                    {"enhancement_reviewed": True, "show_enhanced": True, "updated_at": datetime.now(tz=UTC)}
                )
                print(f"  Updated: {recipe_id} - {title}")
            except Exception as e:
                print(f"  ERROR updating {recipe_id}: {e}")
                continue

        updated += 1

    print()
    print(f"Summary: {updated} recipes {'would be updated' if dry_run else 'updated'}, {skipped} already reviewed")

    if dry_run and updated > 0:
        print("\nRun without --dry-run to apply changes.")


def main() -> None:
    """Parse args and run backfill."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying them")
    args = parser.parse_args()

    backfill_enhancement_review(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
