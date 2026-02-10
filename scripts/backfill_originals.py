"""Backfill 'original' field for enhanced recipes missing it.

For each enhanced recipe without an 'original' snapshot:
1. Re-scrape from the original URL to get unmodified recipe data
2. Store the original data as a nested 'original' field via Firestore .update()

Usage:
    uv run python scripts/backfill_originals.py              # Dry run (preview all)
    uv run python scripts/backfill_originals.py --apply      # Write all to Firestore
    uv run python scripts/backfill_originals.py <id>         # Dry run single recipe
    uv run python scripts/backfill_originals.py <id> --apply # Write single to Firestore
"""

import dataclasses
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from google.cloud import firestore

from functions.scrape_recipe.recipe_scraper import ScrapeError, scrape_recipe

API_BASE = "http://localhost:8000/api/v1"


def get_firestore_client() -> firestore.Client:
    """Get Firestore client for the meal-planner database."""
    return firestore.Client(database="meal-planner")


def _api_fetch(url: str) -> bytes:
    """Fetch from local API with timeout and error handling."""
    try:
        resp = urllib.request.urlopen(url, timeout=30)  # noqa: S310
        return resp.read()
    except urllib.error.HTTPError as exc:
        hint = " (start API with SKIP_AUTH=true?)" if exc.code == 401 else ""
        msg = f"API returned HTTP {exc.code}{hint}: {url}"
        raise SystemExit(msg) from exc
    except urllib.error.URLError as exc:
        msg = f"Cannot connect to API (is it running?): {exc.reason}"
        raise SystemExit(msg) from exc


def get_enhanced_missing_original(recipe_id: str | None = None) -> list[dict]:
    """Fetch enhanced recipes missing 'original' via the local API."""
    if recipe_id:
        data = _api_fetch(f"{API_BASE}/recipes/{recipe_id}")
        recipe = json.loads(data)
        if recipe.get("enhanced") and not recipe.get("original"):
            return [recipe]
        if recipe.get("original"):
            print(f"  ✅ {recipe_id} already has 'original' — nothing to do")
        elif not recipe.get("enhanced"):
            print(f"  [i] {recipe_id} is not enhanced -- skipping")
        return []

    # Fetch all recipes (paginate)
    all_recipes: list[dict] = []
    cursor = None
    while True:
        url = f"{API_BASE}/recipes?limit=100"
        if cursor:
            url += f"&cursor={cursor}"
        raw = _api_fetch(url)
        data = json.loads(raw)
        items = data.get("items", [])
        for r in items:
            if r.get("enhanced") and not r.get("original"):
                all_recipes.append(r)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return all_recipes


def build_original_snapshot(data: dict) -> dict:
    """Build an original snapshot dict from scraped recipe data."""
    return {
        "title": data.get("title", ""),
        "ingredients": data.get("ingredients", []),
        "instructions": data.get("instructions", []),
        "servings": data.get("servings"),
        "prep_time": data.get("prep_time"),
        "cook_time": data.get("cook_time"),
        "total_time": data.get("total_time"),
        "image_url": data.get("image_url"),
    }


def try_scrape_original(url: str) -> dict | None:
    """Re-scrape the original recipe from its URL."""
    if not url or url.startswith("manual-entry"):
        return None

    result = scrape_recipe(url)
    if isinstance(result, ScrapeError):
        print(f"    ⚠️  Scrape failed: {result.message}")
        return None

    return build_original_snapshot(dataclasses.asdict(result))


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    apply = "--apply" in sys.argv
    recipe_id = args[0] if args else None

    print("🔍 Finding enhanced recipes missing 'original' field...\n")
    recipes = get_enhanced_missing_original(recipe_id)

    if not recipes:
        print("✅ Nothing to backfill!")
        return

    print(f"Found {len(recipes)} recipe(s) to backfill\n")
    if not apply:
        print("🔍 DRY RUN — use --apply to write to Firestore\n")

    db = get_firestore_client()
    success = 0
    skipped = 0

    for r in recipes:
        rid = r["id"]
        title = r.get("title", "Unknown")[:50]
        url = r.get("url", "")
        print(f"📖 {rid} — {title}")
        print(f"    URL: {url[:80]}")

        original = try_scrape_original(url)

        if not original:
            print("    ❌ Cannot recover original (manual entry or scrape failed)")
            skipped += 1
            continue

        print(
            f"    ✅ Got original: {original['title'][:40]}, "
            f"{len(original['ingredients'])} ingredients, "
            f"{len(original['instructions'])} instructions"
        )

        if apply:
            db.collection("recipes").document(rid).update(
                {"original": original, "updated_at": firestore.SERVER_TIMESTAMP}
            )
            print("    💾 Saved to Firestore")
        else:
            output = Path(f"data/original_{rid}.json")
            with output.open("w", encoding="utf-8") as f:
                json.dump(original, f, ensure_ascii=False, indent=2)
            print(f"    📄 Preview saved to {output}")

        success += 1
        time.sleep(1)

    print(f"\n{'=' * 60}")
    print(f"✅ Backfilled: {success}")
    print(f"❌ Skipped: {skipped}")
    print(f"📊 Total: {len(recipes)}")
    if not apply and success > 0:
        print("\nRun with --apply to write to Firestore")


if __name__ == "__main__":
    main()
