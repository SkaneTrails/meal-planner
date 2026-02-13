"""Firestore recipe manager — CRUD, enhancement review, and interactive menu.

Enhancement preserves original data in the same Firestore document:
- Top-level fields = enhanced version (what the app displays)
- original = nested snapshot of scraped data (for "view original" toggle)
- enhanced/enhanced_at/changes_made = enhancement metadata

CRITICAL: update/upload NEVER use .set() — they use .update() to merge
fields without overwriting the rest of the document.

Usage (CLI — bypasses interactive menu):
    uv run python tools/recipe_manager.py --project <project_id> list
    uv run python tools/recipe_manager.py --project <project_id> get <recipe_id>
    uv run python tools/recipe_manager.py --project <project_id> export <recipe_id>
    uv run python tools/recipe_manager.py --project <project_id> delete <recipe_id>
    uv run python tools/recipe_manager.py --project <project_id> update <recipe_id> <json>
    uv run python tools/recipe_manager.py --project <project_id> upload <recipe_id> <file>
    uv run python tools/recipe_manager.py --project <project_id> next
    uv run python tools/recipe_manager.py --project <project_id> enhanced <recipe_id>
    uv run python tools/recipe_manager.py --project <project_id> skip <recipe_id>
    uv run python tools/recipe_manager.py --project <project_id> status
    uv run python tools/recipe_manager.py --project <project_id> reenhance <recipe_id> --household <id>
    uv run python tools/recipe_manager.py --project <project_id> reenhance <recipe_id> --household <id> --apply

Interactive menu (for humans):
    uv run python tools/recipe_manager.py --project <project_id>

Note: --project is required. Reads and writes recipes in the meal-planner database.
"""

import argparse
import json
from collections.abc import Callable
from pathlib import Path

from google.cloud import firestore

PROGRESS_FILE = Path(__file__).parent.parent / "data" / "recipe_review_progress.json"
RECIPES_COLLECTION = "recipes"
DATABASE = "meal-planner"
STEP_PREVIEW_MAX_LEN = 200

_project: str = ""


# ---------------------------------------------------------------------------
# Firestore helpers
# ---------------------------------------------------------------------------


def get_db(project: str) -> firestore.Client:
    """Get Firestore client for the given GCP project."""
    return firestore.Client(project=project, database=DATABASE)


def load_progress() -> dict:
    """Load progress tracking data."""
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {"processed": [], "skipped": []}


def save_progress(progress: dict) -> None:
    """Save progress tracking data."""
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))


REVIEW_FILE = Path("data/enhanced_recipes_review.json")


def _update_review_file(recipe_id: str) -> None:
    """Mark a recipe as reviewed in the local review tracking file."""
    if not REVIEW_FILE.exists():
        return
    review_data = json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
    for recipe in review_data.get("recipes", []):
        if recipe["id"] == recipe_id:
            recipe["enhancement_reviewed"] = True
            break
    reviewed = sum(1 for r in review_data.get("recipes", []) if r.get("enhancement_reviewed"))
    review_data["reviewed"] = reviewed
    review_data["pending"] = review_data["total"] - reviewed
    REVIEW_FILE.write_text(json.dumps(review_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"   Review file updated ({reviewed}/{review_data['total']} reviewed)")


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------


def display_recipe(recipe_id: str, data: dict) -> None:
    """Display a recipe in a readable format."""
    print(f"\n{'=' * 80}")
    print(f"RECIPE ID: {recipe_id}")
    print(f"{'=' * 80}")
    print(f"Title: {data.get('title', 'N/A')}")
    print(f"URL: {data.get('url', 'N/A')}")
    print(f"Servings: {data.get('servings', 'N/A')}")
    print(f"Prep Time: {data.get('prep_time', 'N/A')} min")
    print(f"Cook Time: {data.get('cook_time', 'N/A')} min")
    print(f"Total Time: {data.get('total_time', 'N/A')} min")
    print(f"Diet Label: {data.get('diet_label', 'N/A')}")
    print(f"Meal Label: {data.get('meal_label', 'N/A')}")
    print(f"Category: {data.get('category', 'N/A')}")
    print(f"Cuisine: {data.get('cuisine', 'N/A')}")
    print(f"Tags: {data.get('tags', [])}")

    print(f"\n--- INGREDIENTS ({len(data.get('ingredients', []))}) ---")
    for i, ing in enumerate(data.get("ingredients", []), 1):
        print(f"  {i}. {ing}")

    print(f"\n--- INSTRUCTIONS ({len(data.get('instructions', []))}) ---")
    for i, step in enumerate(data.get("instructions", []), 1):
        step_preview = step[:STEP_PREVIEW_MAX_LEN] + "..." if len(step) > STEP_PREVIEW_MAX_LEN else step
        print(f"  {i}. {step_preview}")

    print(f"\nImage: {data.get('image_url', 'N/A')}")
    print(f"{'=' * 80}\n")


def display_recipe_row(recipe_id: str, data: dict) -> None:
    """Display a single recipe as a compact table row."""
    title = (data.get("title") or "Untitled")[:45]
    enhanced = "\u2713" if data.get("enhanced") else " "
    print(f"  {recipe_id:<24s}  [{enhanced}]  {title}")


# ---------------------------------------------------------------------------
# Recipe commands
# ---------------------------------------------------------------------------


def list_recipes(*, limit: int = 0) -> None:
    """List all recipes with ID, enhanced status, and title."""
    db = get_db(_project)
    query = db.collection(RECIPES_COLLECTION).order_by("title")

    print(f"\n{'=' * 80}")
    print(f"  {'ID':<24s}  [E]  {'Title'}")
    print(f"  {'-' * 24}  ---  {'-' * 45}")

    count = 0
    for doc in query.stream():
        data = doc.to_dict()
        if data:
            display_recipe_row(doc.id, data)
            count += 1
            if limit and count >= limit:
                break

    print(f"{'=' * 80}")
    print(f"  Total: {count} recipes\n")


def export_recipe(recipe_id: str, output_path: str | None = None) -> None:
    """Export a recipe to a JSON file."""
    db = get_db(_project)
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]

    if not doc.exists:  # type: ignore[union-attr]
        print(f"\u274c Recipe not found: {recipe_id}")
        return

    data = doc.to_dict()  # type: ignore[union-attr]
    if data is None:
        print(f"\u274c Recipe data is empty: {recipe_id}")
        return

    # Convert Firestore timestamps to ISO strings for JSON serialisation
    for key, value in data.items():
        if hasattr(value, "isoformat"):
            data[key] = value.isoformat()
        if isinstance(value, dict):
            for k, v in value.items():
                if hasattr(v, "isoformat"):
                    value[k] = v.isoformat()

    dest = Path(output_path) if output_path else Path(f"data/export_{recipe_id}.json")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\u2705 Exported to {dest}")


def get_next_recipe() -> None:
    """Get the next unprocessed recipe and display it."""
    db = get_db(_project)
    progress = load_progress()
    processed_ids = set(progress.get("processed", []) + progress.get("skipped", []))

    for doc in db.collection(RECIPES_COLLECTION).order_by("title").stream():
        if doc.id not in processed_ids:
            display_recipe(doc.id, doc.to_dict())
            return

    print("\U0001f389 All recipes have been processed!")


def get_recipe(recipe_id: str) -> None:
    """Get a specific recipe by ID."""
    db = get_db(_project)
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if doc.exists:  # type: ignore[union-attr]
        data = doc.to_dict()  # type: ignore[union-attr]
        if data is not None:
            display_recipe(doc.id, data)  # type: ignore[union-attr]
    else:
        print(f"\u274c Recipe not found: {recipe_id}")


def get_enhanced_recipe(recipe_id: str) -> None:
    """Get the enhanced version of a recipe."""
    db = get_db(_project)
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()  # type: ignore[union-attr]
    if doc.exists:  # type: ignore[union-attr]
        data = doc.to_dict()  # type: ignore[union-attr]
        if data is not None and data.get("enhanced"):
            print("\n\U0001f3af ENHANCED VERSION")
            display_recipe(doc.id, data)  # type: ignore[union-attr]
            if data.get("changes_made"):
                print("\n--- CHANGES MADE ---")
                for change in data["changes_made"]:
                    print(f"  \u2022 {change}")
            if data.get("original"):
                orig = data["original"]
                print(
                    f"\n\U0001f4cb Original preserved: {len(orig.get('ingredients', []))} ingredients, "
                    f"{len(orig.get('instructions', []))} steps"
                )
        elif data is not None:
            print(f"\u26a0\ufe0f Recipe {recipe_id} exists but is not enhanced")
        else:
            print(f"\u274c No enhanced version found: {recipe_id}")
    else:
        print(f"\u274c No enhanced version found: {recipe_id}")


def delete_enhanced_recipe(recipe_id: str, *, force: bool = False) -> None:
    """Delete an entire recipe document from Firestore.

    By default only deletes recipes flagged as enhanced. Use force=True
    to delete any recipe regardless of enhancement status.
    """
    db = get_db(_project)
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)
    doc = doc_ref.get()

    if not doc.exists:  # type: ignore[union-attr]
        print(f"\u274c No enhanced version found: {recipe_id}")
        return

    data = doc.to_dict()  # type: ignore[union-attr]
    if not data or not data.get("enhanced"):
        print(f"\u26a0\ufe0f Recipe {recipe_id} is not enhanced. Use --force to delete anyway.")
        if not force:
            return

    doc_ref.delete()
    print(f"\U0001f5d1\ufe0f Deleted enhanced recipe: {recipe_id}")

    progress = load_progress()
    if recipe_id in progress.get("processed", []):
        progress["processed"].remove(recipe_id)
        save_progress(progress)
        print("   Removed from processed list")


def mark_processed(recipe_id: str) -> None:
    """Mark a recipe as processed."""
    progress = load_progress()
    if recipe_id not in progress["processed"]:
        progress["processed"].append(recipe_id)
        save_progress(progress)
    print(f"\u2705 Marked as processed: {recipe_id}")


def mark_skipped(recipe_id: str) -> None:
    """Mark a recipe as skipped (no changes needed)."""
    progress = load_progress()
    if recipe_id not in progress["skipped"]:
        progress["skipped"].append(recipe_id)
        save_progress(progress)
    print(f"\u23ed\ufe0f Marked as skipped: {recipe_id}")


ORIGINAL_SNAPSHOT_FIELDS = [
    "title",
    "ingredients",
    "instructions",
    "servings",
    "prep_time",
    "cook_time",
    "total_time",
    "image_url",
]


def update_recipe(recipe_id: str, updates: dict) -> None:
    """Enhance a recipe in-place, preserving the original data.

    Enhancement structure (same document):
    - Top-level fields = enhanced version (what the app displays)
    - original = nested snapshot of scraped data (for "view original" toggle)
    - enhanced = True, enhanced_at, changes_made = enhancement metadata

    CRITICAL: Never overwrites the document. Uses Firestore .update() to merge
    fields into the existing document. The original snapshot is set once on first
    enhancement and never modified after.
    """
    from datetime import UTC, datetime

    from google.cloud.firestore_v1 import DELETE_FIELD

    db = get_db(_project)
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)
    doc = doc_ref.get()  # type: ignore[union-attr]

    if not doc.exists:  # type: ignore[union-attr]
        print(f"\u274c Recipe not found: {recipe_id}")
        return

    current_data = doc.to_dict()  # type: ignore[union-attr]
    if current_data is None:
        print(f"\u274c Recipe data is empty: {recipe_id}")
        return

    now = datetime.now(tz=UTC)
    update_payload: dict = {}

    if not current_data.get("enhanced") and "original" not in current_data:
        print("\U0001f195 First enhancement \u2014 snapshotting original data")
        original_snapshot = {}
        for field in ORIGINAL_SNAPSHOT_FIELDS:
            if field in current_data:
                original_snapshot[field] = current_data[field]
        update_payload["original"] = original_snapshot
    else:
        print("\U0001f4dd Updating existing enhanced recipe")

    protected_keys = {"original", "enhanced", "enhanced_at", "updated_at"}
    safe_updates = {k: v for k, v in updates.items() if k not in protected_keys}
    update_payload.update(safe_updates)

    update_payload["enhanced"] = True
    update_payload["enhanced_at"] = now
    update_payload["updated_at"] = now

    for legacy_field in ("improved", "original_id", "enhanced_from"):
        if legacy_field in current_data:
            update_payload[legacy_field] = DELETE_FIELD

    doc_ref.update(update_payload)
    print(f"\u2705 Enhanced recipe: {recipe_id}")
    print(f"   Updated fields: {list(safe_updates.keys())}")
    stripped = set(updates) - set(safe_updates)
    if stripped:
        print(f"   ⚠️ Stripped protected keys: {stripped}")
    if "original" in update_payload:
        print(f"   Original snapshot: {len(update_payload['original'])} fields preserved")

    mark_processed(recipe_id)


def _load_household_config(household_id: str) -> dict:
    """Load household settings (equipment, language, dietary) from Firestore."""
    db = get_db(_project)
    config_ref = db.collection("households").document(household_id).collection("settings").document("config")
    doc = config_ref.get()
    if not doc.exists:
        print(f"\u274c Household config not found: {household_id}")
        return {}
    return doc.to_dict() or {}


def reenhance_recipe(recipe_id: str, household_id: str, *, output_path: str | None = None, apply: bool = False) -> None:
    """Re-enhance a recipe from its original data using current prompts.

    Reads the `original` snapshot from Firestore, loads household config
    (equipment + language), calls Gemini, and displays the result.
    Dry-run by default — use --apply to write back to Firestore.
    """
    from api.services.recipe_enhancer import enhance_recipe

    db = get_db(_project)
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()

    if not doc.exists:
        print(f"\u274c Recipe not found: {recipe_id}")
        return

    data = doc.to_dict()
    if not data:
        print(f"\u274c Recipe data is empty: {recipe_id}")
        return

    original = data.get("original")
    if not original:
        print(f"\u274c No original snapshot found for: {recipe_id}")
        print("   Cannot re-enhance without original data.")
        return

    config = _load_household_config(household_id)
    if not config:
        return

    equipment = config.get("equipment", [])
    language = config.get("language", "sv")
    target_servings = config.get("target_servings", 4)
    people_count = config.get("people_count", 2)

    print(f"\n\U0001f504 Re-enhancing: {original.get('title', recipe_id)}")
    print(f"   Household: {household_id}")
    print(f"   Language: {language}")
    print(f"   Equipment: {len(equipment)} items")
    print(f"   Servings: {target_servings} ({people_count} people)")
    print(f"   Mode: {'APPLY' if apply else 'DRY RUN'}")

    def _print_recipe_section(label: str, recipe_data: dict) -> None:
        ings = recipe_data.get("ingredients", [])
        steps = recipe_data.get("instructions", [])
        print(f"\n{'=' * 80}")
        print(f"{label}: {recipe_data.get('title', '?')}")
        print(f"Servings: {recipe_data.get('servings', '?')}")
        print(f"{'=' * 80}")
        print(f"\n--- INGREDIENTS ({len(ings)}) ---")
        for i, ing in enumerate(ings, 1):
            print(f"  {i}. {ing}")
        print(f"\n--- INSTRUCTIONS ({len(steps)}) ---")
        for i, step in enumerate(steps, 1):
            print(f"  {i}. {step}")
        if recipe_data.get("tips"):
            print(f"\n--- TIPS ---\n  {recipe_data['tips']}")

    _print_recipe_section("ORIGINAL", original)

    current_ings = data.get("ingredients", [])
    current_steps = data.get("instructions", [])
    if current_ings != original.get("ingredients", []):
        current_view = {
            "title": data.get("title"),
            "servings": data.get("servings"),
            "ingredients": current_ings,
            "instructions": current_steps,
            "tips": data.get("tips"),
        }
        _print_recipe_section("CURRENT ENHANCED", current_view)
    else:
        print("\n(No previous enhancement — current equals original)")

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).parent.parent / ".env")

    enhanced = enhance_recipe(
        original, language=language, equipment=equipment, target_servings=target_servings, people_count=people_count
    )

    _print_recipe_section("RE-ENHANCED", enhanced)

    if enhanced.get("changes_made"):
        print(f"\n--- CHANGES ({len(enhanced['changes_made'])}) ---")
        for change in enhanced["changes_made"]:
            print(f"  \u2022 {change}")

    dest = Path(output_path) if output_path else Path(f"data/reenhanced_{recipe_id[:8]}.json")
    dest.parent.mkdir(parents=True, exist_ok=True)

    for key, value in enhanced.items():
        if hasattr(value, "isoformat"):
            enhanced[key] = value.isoformat()

    dest.write_text(json.dumps(enhanced, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n\U0001f4be Saved to {dest}")

    if apply:
        for legacy in ("improved", "original_id", "enhanced_from"):
            enhanced.pop(legacy, None)
        update_recipe(recipe_id, enhanced)

        doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)
        doc_ref.update({"enhancement_reviewed": True, "show_enhanced": True})
        print("\u2705 Marked as reviewed and approved")

        _update_review_file(recipe_id)

        print(f"\u2705 Applied to Firestore: {recipe_id}")
    else:
        print("\n   Dry run — use --apply to write to Firestore")


def upload_from_file(recipe_id: str, file_path: str) -> None:
    """Upload an enhanced recipe from a JSON file, preserving the original.

    Uses the same snapshot-and-update pattern as update_recipe:
    original data is preserved in the `original` nested field.
    """
    path = Path(file_path)
    if not path.exists():
        print(f"\u274c File not found: {file_path}")
        return

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"\u274c Invalid JSON in {file_path}: {e}")
        return

    for legacy_field in ("improved", "original_id", "enhanced_from"):
        data.pop(legacy_field, None)

    update_recipe(recipe_id, data)


def show_status() -> None:
    """Show review progress."""
    db = get_db(_project)
    progress = load_progress()

    total = sum(1 for _ in db.collection(RECIPES_COLLECTION).stream())
    processed = len(progress.get("processed", []))
    skipped = len(progress.get("skipped", []))
    remaining = total - processed - skipped

    print("\n\U0001f4ca Recipe Review Progress")
    print(f"   Database: {DATABASE}")
    print(f"   Total recipes:       {total}")
    print(f"   \u2705 Processed:        {processed}")
    print(f"   \u23ed\ufe0f Skipped:          {skipped}")
    print(f"   \U0001f4dd Remaining:        {remaining}")
    pct = ((processed + skipped) / total * 100) if total else 0.0
    print(f"   Progress:            {pct:.1f}%\n")


# ---------------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------------


def _prompt(label: str, *, required: bool = True) -> str:
    """Prompt for user input, repeating until non-empty if required."""
    while True:
        value = input(f"  {label}: ").strip()
        if value or not required:
            return value
        print("  (required)")


def _confirm(label: str) -> bool:
    return input(f"  {label} [y/N]: ").strip().lower() in ("y", "yes")


def _menu_list() -> None:
    limit_str = _prompt("Max results (empty=all)", required=False)
    limit = int(limit_str) if limit_str.isdigit() else 0
    list_recipes(limit=limit)


def _menu_export() -> None:
    recipe_id = _prompt("Recipe ID")
    output = _prompt("Output path (empty=default)", required=False) or None
    export_recipe(recipe_id, output)


def _menu_delete() -> None:
    recipe_id = _prompt("Recipe ID")
    force = _confirm("Force delete even if not enhanced?")
    delete_enhanced_recipe(recipe_id, force=force)


def _menu_id_action(fn: Callable[[str], None]) -> None:
    recipe_id = _prompt("Recipe ID")
    fn(recipe_id)


MENU_ITEMS = [
    ("1", "List recipes", _menu_list),
    ("2", "Get recipe by ID", lambda: _menu_id_action(get_recipe)),
    ("3", "Get enhanced version", lambda: _menu_id_action(get_enhanced_recipe)),
    ("4", "Export recipe to JSON", _menu_export),
    ("5", "Delete recipe", _menu_delete),
    ("6", "Review status", show_status),
    ("7", "Next unprocessed recipe", get_next_recipe),
    ("8", "Mark recipe as skipped", lambda: _menu_id_action(mark_skipped)),
    ("9", "Mark recipe as done", lambda: _menu_id_action(mark_processed)),
]


def interactive_menu() -> None:
    """Launch an interactive terminal menu for human users."""
    print("\n\U0001f4cb Recipe Manager \u2014 Interactive Menu")
    print(f"   Project: {_project}  |  Database: {DATABASE}")

    handlers = {key: fn for key, _, fn in MENU_ITEMS}

    while True:
        print(f"\n{'=' * 45}")
        for key, label, _ in MENU_ITEMS:
            print(f"  {key}) {label}")
        print("  0) Quit")
        print(f"{'=' * 45}")

        choice = input("\n  Choose [0-9]: ").strip()

        if choice == "0":
            print("\n\U0001f44b Bye!")
            break

        handler = handlers.get(choice)
        if handler:
            handler()
        else:
            print("  Invalid choice, try again.")


# ---------------------------------------------------------------------------
# CLI parser
# ---------------------------------------------------------------------------


def _non_negative_int(value: str) -> int:
    """Argparse type validator for non-negative integers."""
    n = int(value)
    if n < 0:
        msg = f"must be non-negative, got {n}"
        raise argparse.ArgumentTypeError(msg)
    return n


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Firestore recipe manager — CRUD, enhancement review, and interactive menu"
    )
    parser.add_argument("--project", required=True, help="GCP project ID (required)")

    sub = parser.add_subparsers(dest="command")

    sub.add_parser("next", help="Get the next unprocessed recipe")
    sub.add_parser("status", help="Show review progress")

    p_list = sub.add_parser("list", help="List all recipes")
    p_list.add_argument("--limit", type=_non_negative_int, default=0, help="Max recipes to show (0=all)")

    for name in ("get", "enhanced", "skip", "done"):
        p = sub.add_parser(name)
        p.add_argument("recipe_id")

    p_export = sub.add_parser("export", help="Export recipe to JSON file")
    p_export.add_argument("recipe_id")
    p_export.add_argument("--output", default=None, help="Output file path")

    p_delete = sub.add_parser("delete", help="Delete a recipe document from Firestore")
    p_delete.add_argument("recipe_id")
    p_delete.add_argument("--force", action="store_true", help="Delete even if not enhanced")

    p_update = sub.add_parser("update", help="Update recipe with JSON")
    p_update.add_argument("recipe_id")
    p_update.add_argument("json_updates", nargs="+", help="JSON string with updates")

    p_upload = sub.add_parser("upload", help="Upload enhancement from JSON file")
    p_upload.add_argument("recipe_id")
    p_upload.add_argument("file_path")

    p_reenhance = sub.add_parser("reenhance", help="Re-enhance recipe from original data via Gemini")
    p_reenhance.add_argument("recipe_id")
    p_reenhance.add_argument("--household", required=True, help="Household ID for equipment/language config")
    p_reenhance.add_argument("--output", default=None, help="Output file path (default: data/reenhanced_<id>.json)")
    p_reenhance.add_argument("--apply", action="store_true", help="Write result to Firestore (default: dry run)")

    return parser


def _set_project(project: str) -> None:
    global _project  # noqa: PLW0603
    _project = project


def _dispatch(args: argparse.Namespace) -> None:
    """Dispatch CLI subcommand to the appropriate handler."""
    simple_commands: dict[str, Callable[[], None]] = {"next": get_next_recipe, "status": show_status}
    id_commands: dict[str, Callable[[str], None]] = {
        "get": get_recipe,
        "enhanced": get_enhanced_recipe,
        "skip": mark_skipped,
        "done": mark_processed,
    }

    if args.command in simple_commands:
        simple_commands[args.command]()
    elif args.command in id_commands:
        id_commands[args.command](args.recipe_id)
    elif args.command == "list":
        list_recipes(limit=args.limit)
    elif args.command == "export":
        export_recipe(args.recipe_id, args.output)
    elif args.command == "delete":
        delete_enhanced_recipe(args.recipe_id, force=args.force)
    elif args.command == "update":
        updates_json = " ".join(args.json_updates)
        try:
            updates = json.loads(updates_json)
            update_recipe(args.recipe_id, updates)
        except json.JSONDecodeError:
            print(f"\u274c Invalid JSON: {updates_json}")
    elif args.command == "upload":
        upload_from_file(args.recipe_id, args.file_path)
    elif args.command == "reenhance":
        reenhance_recipe(args.recipe_id, args.household, output_path=args.output, apply=args.apply)


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    _set_project(args.project)

    if not args.command:
        interactive_menu()
        return

    _dispatch(args)


if __name__ == "__main__":
    main()
