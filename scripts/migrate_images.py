"""One-time migration: download external recipe images to GCS bucket.

Finds all recipes with image_url pointing outside our GCS bucket,
downloads each image, creates hero + thumbnail, uploads both to GCS,
and updates the Firestore document with both URLs.

Usage:
    # Dry run — shows what would be migrated:
    uv run python scripts/migrate_images.py --dry-run

    # Run the migration:
    uv run python scripts/migrate_images.py

    # Limit to N recipes (for testing):
    uv run python scripts/migrate_images.py --limit 5
"""

import argparse
import asyncio
import logging
import os
import sys

from google.cloud import firestore

sys.path.insert(0, str(__file__).rsplit("scripts", 1)[0])

from api.services.image_downloader import download_and_upload_image, is_gcs_url

DATABASE = "meal-planner"
RECIPES_COLLECTION = "recipes"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def get_bucket_name() -> str:
    """Get GCS bucket name from environment."""
    bucket = os.environ.get("GCS_BUCKET_NAME", "")
    if not bucket:
        logger.error("GCS_BUCKET_NAME environment variable is required")
        sys.exit(1)
    return bucket


def get_external_image_recipes(db: firestore.Client, bucket_name: str, limit: int | None) -> list[dict]:
    """Fetch recipes that have external (non-GCS) image URLs."""
    query = db.collection(RECIPES_COLLECTION).where("image_url", "!=", None)
    docs = query.stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        image_url = data.get("image_url", "")
        if image_url and not is_gcs_url(image_url, bucket_name):
            results.append({"id": doc.id, "title": data.get("title", ""), "image_url": image_url})
            if limit and len(results) >= limit:
                break

    return results


async def migrate_image(db: firestore.Client, recipe: dict, bucket_name: str) -> bool:
    """Download, process, and upload a single recipe image (hero + thumbnail).

    Returns True on success, False on failure.
    """
    recipe_id = recipe["id"]
    image_url = recipe["image_url"]

    result = await download_and_upload_image(image_url, recipe_id, bucket_name)
    if result is None:
        logger.warning("FAILED: %s (%s) — could not download/process image", recipe_id, recipe["title"])
        return False

    db.collection(RECIPES_COLLECTION).document(recipe_id).update(
        {"image_url": result.hero_url, "thumbnail_url": result.thumbnail_url}
    )
    logger.info("OK: %s (%s) → hero=%s, thumb=%s", recipe_id, recipe["title"], result.hero_url, result.thumbnail_url)
    return True


async def run_migration(*, dry_run: bool, limit: int | None) -> None:
    """Run the image migration."""
    bucket_name = get_bucket_name()
    db = firestore.Client(database=DATABASE)

    logger.info("Scanning recipes with external image URLs...")
    recipes = get_external_image_recipes(db, bucket_name, limit)
    logger.info("Found %d recipes with external images", len(recipes))

    if not recipes:
        logger.info("Nothing to migrate")
        return

    if dry_run:
        logger.info("DRY RUN — would migrate these recipes:")
        for r in recipes:
            logger.info("  %s: %s — %s", r["id"], r["title"], r["image_url"])
        return

    success = 0
    failed = 0
    for recipe in recipes:
        ok = await migrate_image(db, recipe, bucket_name)
        if ok:
            success += 1
        else:
            failed += 1

    logger.info("Migration complete: %d succeeded, %d failed out of %d total", success, failed, len(recipes))


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Migrate external recipe images to GCS bucket")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be migrated without making changes")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of recipes to migrate")
    args = parser.parse_args()

    asyncio.run(run_migration(dry_run=args.dry_run, limit=args.limit))


if __name__ == "__main__":
    main()
