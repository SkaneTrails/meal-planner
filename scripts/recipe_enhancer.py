"""
Recipe Enhancer - Enhance recipes with Gemini AI and save to Firestore.

Usage:
    uv run python scripts/recipe_enhancer.py <recipe_id>           # Enhance and save
    uv run python scripts/recipe_enhancer.py <recipe_id> --dry-run # Preview only
    uv run python scripts/recipe_enhancer.py --list                # List all recipes
    uv run python scripts/recipe_enhancer.py --batch 10            # Batch process 10 recipes
    uv run python scripts/recipe_enhancer.py --batch               # Batch process all unenhanced

Options:
    --dry-run       Preview changes without saving
    --batch [N]     Process N unenhanced recipes (or all if N not specified)
    --include-enhanced  Include already-enhanced recipes in batch mode
    --delay SECONDS Delay between API calls in batch mode (default: 4.0 for free tier)

Setup:
1. Get free API key from https://aistudio.google.com/apikey
2. Add to .env file: GOOGLE_API_KEY=your-key-here
"""

import json
import os
import sys
import time
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load .env file
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

try:
    from google import genai
    from google.genai import types
except ImportError as exc:
    msg = "google-genai is not installed. Install it with: uv add google-genai"
    raise ImportError(msg) from exc

from google.cloud import firestore

from api.services.prompt_loader import DEFAULT_LANGUAGE, load_system_prompt

# Default Gemini model for recipe enhancement
DEFAULT_MODEL = "gemini-2.5-flash"


def get_firestore_client() -> firestore.Client:
    """Get Firestore client for the meal-planner database."""
    return firestore.Client(database="meal-planner")


def get_unenhanced_recipes(limit: int | None = None, *, include_enhanced: bool = False) -> list[tuple[str, dict]]:
    """Get recipes that haven't been enhanced yet.

    Note: Firestore inequality queries exclude documents missing the field,
    so we use client-side filtering to include recipes without 'enhanced' field.
    """
    db = get_firestore_client()
    query = db.collection("recipes")

    if limit and include_enhanced:
        # When including all, we can use server-side limit
        query = query.limit(limit)

    recipes: list[tuple[str, dict]] = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id

        # Client-side filtering: include if enhanced=False or field missing
        if not include_enhanced and data.get("enhanced", False):
            continue

        recipes.append((doc.id, data))

        # Apply limit client-side when filtering
        if limit and not include_enhanced and len(recipes) >= limit:
            break

    return recipes


def list_recipes(limit: int = 20) -> None:
    """List recipes from Firestore."""
    db = get_firestore_client()
    recipes = db.collection("recipes").limit(limit).stream()

    print(f"\n📚 Recipes (first {limit}):")
    print("-" * 60)
    for doc in recipes:
        data = doc.to_dict()
        title = data.get("title", "Untitled")[:50]
        print(f"  {doc.id}: {title}")
    print("-" * 60)


def get_recipe(recipe_id: str) -> dict | None:
    """Fetch a single recipe by ID."""
    db = get_firestore_client()
    doc = db.collection("recipes").document(recipe_id).get()  # type: ignore[union-attr]

    if doc.exists:  # type: ignore[union-attr]
        data = doc.to_dict()  # type: ignore[union-attr]
        if data is not None:
            data["id"] = doc.id  # type: ignore[union-attr]
            return data
    return None


def enhance_recipe(recipe: dict, *, language: str = DEFAULT_LANGUAGE) -> dict | None:
    """Enhance recipe using Gemini AI."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not set in .env file")
        return None

    client = genai.Client(api_key=api_key)
    system_prompt = load_system_prompt(language)

    recipe_text = f"""
Enhance this recipe according to the rules:

**Title**: {recipe.get("title", "Unknown")}

**Ingredients**:
{chr(10).join(f"- {ing}" for ing in recipe.get("ingredients", []))}

**Instructions**:
{recipe.get("instructions", "No instructions")}

**Tips** (if any):
{recipe.get("tips", "No tips")}
"""

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=recipe_text,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt, response_mime_type="application/json", temperature=0.1
            ),
        )
    except TimeoutError as e:
        print(f"❌ Gemini API request timed out: {e}")
        return None
    except Exception as e:
        status = getattr(e, "status", None)
        message = str(e)
        if status == 429 or "429" in message:
            print(
                "❌ Gemini API rate limit exceeded (HTTP 429). "
                "Consider reducing batch size or increasing the --delay between calls."
            )
        else:
            print(f"❌ Gemini API error while generating content: {e}")
        return None

    if not hasattr(response, "text") or response.text is None:
        print("❌ Gemini API returned an invalid response (missing text content).")
        return None

    try:
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse Gemini API JSON response: {e}")
        print(f"Raw response text: {getattr(response, 'text', '')!r}")
        return None


def save_recipe(recipe_id: str, enhanced: dict) -> bool:
    """Save enhanced recipe back to Firestore, replacing the original."""
    from datetime import UTC, datetime

    db = get_firestore_client()
    now = datetime.now(tz=UTC)

    # Get metadata from the enhanced recipe (may be nested or top-level)
    metadata = enhanced.get("metadata", {})

    # Prepare the document data - all fields at top level, no nesting
    doc_data = {
        "title": enhanced.get("title"),
        "ingredients": enhanced.get("ingredients", []),
        "instructions": enhanced.get("instructions", []),  # Must be list, not string
        "tips": enhanced.get("tips", ""),
        "cuisine": metadata.get("cuisine") or enhanced.get("cuisine", ""),
        "category": metadata.get("category") or enhanced.get("category", ""),
        "tags": metadata.get("tags") or enhanced.get("tags", []),
        "changes_made": enhanced.get("changes_made", []),
        # Required timestamps
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.collection("recipes").document(recipe_id).set(doc_data, merge=True)
        return True
    except Exception as e:
        print(f"❌ Firestore error: {e}")
        return False


def display_diff(original: dict, enhanced: dict) -> None:
    """Display changes between original and enhanced recipe."""
    print("\n" + "=" * 60)
    print("📋 ORIGINAL → ENHANCED")
    print("=" * 60)

    # Title
    print("\n📌 Title:")
    print(f"   Before: {original.get('title', 'N/A')}")
    print(f"   After:  {enhanced.get('title', 'N/A')}")

    # Ingredients comparison
    orig_ings = set(original.get("ingredients", []))
    new_ings = set(enhanced.get("ingredients", []))

    removed = orig_ings - new_ings
    added = new_ings - orig_ings

    if removed or added:
        print("\n🥗 Ingredients:")
        for ing in sorted(removed):
            print(f"   - {ing}")
        for ing in sorted(added):
            print(f"   + {ing}")

    # Changes made
    print("\n✏️  Changes Made:")
    for change in enhanced.get("changes_made", []):
        print(f"   • {change}")

    # Metadata
    meta = enhanced.get("metadata", {})
    print("\n🏷️  Metadata:")
    print(f"   Cuisine:  {meta.get('cuisine', 'N/A')}")
    print(f"   Category: {meta.get('category', 'N/A')}")
    print(f"   Tags:     {', '.join(meta.get('tags', []))}")

    print("\n" + "=" * 60)


def process_batch(
    limit: int | None, *, include_enhanced: bool, delay: float, dry_run: bool, language: str = DEFAULT_LANGUAGE
) -> None:
    """Process multiple recipes in batch mode."""
    print("\n🔄 Batch Processing Mode")
    print("-" * 60)

    # Get recipes to process
    recipes = get_unenhanced_recipes(limit, include_enhanced=include_enhanced)

    if not recipes:
        print("✅ No recipes to process!")
        return

    total = len(recipes)
    print(f"📚 Found {total} recipes to process")
    if delay > 0:
        print(f"⏱️  Delay between requests: {delay}s")
    if dry_run:
        print("🔍 DRY RUN - No changes will be saved")
    print("-" * 60)

    # Stats
    success = 0
    failed = 0
    skipped = 0

    for i, (recipe_id, recipe) in enumerate(recipes):
        progress = f"[{i + 1}/{total}]"
        title = recipe.get("title", "Unknown")[:40]

        print(f"\n{progress} {title}")
        print(f"         ID: {recipe_id}")

        # Enhance
        try:
            enhanced = enhance_recipe(recipe, language=language)

            if not enhanced:
                print("         ❌ Enhancement failed")
                failed += 1
                continue

            # Show brief changes
            changes = enhanced.get("changes_made", [])
            if changes:
                print(f"         ✏️  {len(changes)} changes")

            if dry_run:
                print("         🔍 Would save (dry-run)")
                success += 1
            elif save_recipe(recipe_id, enhanced):
                print("         ✅ Saved")
                success += 1
            else:
                print("         ❌ Save failed")
                failed += 1

        except Exception as e:
            print(f"         ❌ Error: {e}")
            failed += 1

        # Rate limiting
        if i < total - 1 and delay > 0:
            time.sleep(delay)

    # Summary
    print("\n" + "=" * 60)
    print("📊 BATCH SUMMARY")
    print("=" * 60)
    print(f"   ✅ Success: {success}")
    print(f"   ❌ Failed:  {failed}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   📚 Total:   {total}")
    if dry_run:
        print("\n   🔍 This was a DRY RUN - no changes were saved")
    print("=" * 60)


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        return

    arg = sys.argv[1]
    dry_run = "--dry-run" in sys.argv
    include_enhanced = "--include-enhanced" in sys.argv

    # Parse delay (default 4.0s for free tier: 15 req/min)
    delay = 4.0
    if "--delay" in sys.argv:
        delay_idx = sys.argv.index("--delay")
        if delay_idx + 1 < len(sys.argv):
            try:
                delay = float(sys.argv[delay_idx + 1])
            except ValueError:
                invalid_value = sys.argv[delay_idx + 1]
                print(f"⚠️  Invalid value for --delay: {invalid_value!r}. Using default delay of {delay} seconds.")
    # Parse language (default: sv)
    language = DEFAULT_LANGUAGE
    if "--language" in sys.argv:
        lang_idx = sys.argv.index("--language")
        if lang_idx + 1 < len(sys.argv):
            language = sys.argv[lang_idx + 1]
    # List command
    if arg == "--list":
        limit = 50
        if len(sys.argv) > 2 and sys.argv[2].isdigit():
            limit = int(sys.argv[2])
        list_recipes(limit)
        return

    # Batch command
    if arg == "--batch":
        limit = None
        # Check for optional limit
        for a in sys.argv[2:]:
            if a.isdigit():
                limit = int(a)
                break
        process_batch(limit, include_enhanced=include_enhanced, delay=delay, dry_run=dry_run, language=language)
        return

    # Get recipe by ID
    recipe_id = arg
    print(f"\n📖 Loading recipe: {recipe_id}")

    original = get_recipe(recipe_id)
    if not original:
        print(f"❌ Recipe not found: {recipe_id}")
        return

    print(f"   Title: {original.get('title', 'Unknown')}")

    # Check if already enhanced
    if original.get("enhanced"):
        print("⚠️  This recipe has already been enhanced.")
        response = input("   Continue anyway? [y/N]: ")
        if response.lower() != "y":
            return

    # Enhance with Gemini
    print(f"\n🤖 Enhancing with Gemini 2.5 Flash (language={language})...")
    enhanced = enhance_recipe(original, language=language)

    if not enhanced:
        return

    # Display diff
    display_diff(original, enhanced)

    if dry_run:
        print("\n🔍 DRY RUN - No changes saved")
        # Save to file for inspection
        output_file = Path(f"data/enhanced_{recipe_id}.json")
        with output_file.open("w", encoding="utf-8") as f:
            json.dump(enhanced, f, ensure_ascii=False, indent=2)
        print(f"   Preview saved to: {output_file}")
        return

    # Confirm save
    response = input("\n💾 Save changes to Firestore? [y/N]: ")
    if response.lower() != "y":
        print("   Cancelled.")
        return

    # Save
    if save_recipe(recipe_id, enhanced):
        print(f"✅ Recipe saved: {recipe_id}")
    else:
        print("❌ Failed to save recipe")


if __name__ == "__main__":
    main()
