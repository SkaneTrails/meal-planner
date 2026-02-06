"""Consolidate enhanced recipe pairs into single documents.

Merges {id}_original + {id} into one document where:
- Main fields = enhanced version (what user sees)
- original = nested dict with original scraped data
- Cleans up legacy fields (improved, original_id, enhanced_from)
- Deletes the _original document after merge

Usage:
    uv run python -m scripts.consolidate_recipes show <base_id>    # Preview merge
    uv run python -m scripts.consolidate_recipes apply <base_id>   # Apply merge
    uv run python -m scripts.consolidate_recipes batch              # Apply all pairs
    uv run python -m scripts.consolidate_recipes list               # List all pairs
"""

import sys

from google.cloud.firestore_v1 import DELETE_FIELD

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client

db = get_firestore_client()

DEFAULT_HOUSEHOLD_ID = "IXdzHJ91NZeutylohx1t"

# Fields to preserve in the original snapshot
ORIGINAL_FIELDS = [
    "title",
    "ingredients",
    "instructions",
    "servings",
    "prep_time",
    "cook_time",
    "total_time",
    "image_url",
]

# Legacy fields to remove after consolidation
LEGACY_FIELDS = ["improved", "original_id", "enhanced_from"]


def get_all_pairs() -> list[tuple[str, str]]:
    """Find all _original + enhanced pairs. Returns [(original_doc_id, enhanced_doc_id)]."""
    docs = db.collection(RECIPES_COLLECTION).stream()
    all_ids = set()
    original_ids = {}

    for doc in docs:
        all_ids.add(doc.id)
        if doc.id.endswith("_original"):
            base_id = doc.id.removesuffix("_original")
            original_ids[base_id] = doc.id

    pairs = []
    for base_id, orig_id in sorted(original_ids.items()):
        if base_id in all_ids:
            pairs.append((orig_id, base_id))

    return pairs


def build_merge(enhanced_data: dict, original_data: dict) -> dict:
    """Build the merged document: enhanced as main, original nested."""
    original_snapshot = {}
    for field in ORIGINAL_FIELDS:
        if field in original_data:
            original_snapshot[field] = original_data[field]

    updates = {"original": original_snapshot, "enhanced": True}

    # Ensure household_id is set
    if not enhanced_data.get("household_id"):
        updates["household_id"] = DEFAULT_HOUSEHOLD_ID

    # Remove legacy fields
    for field in LEGACY_FIELDS:
        if field in enhanced_data:
            updates[field] = DELETE_FIELD

    return updates


def show_pair(base_id: str) -> None:
    """Preview what a merge would look like."""
    orig_id = f"{base_id}_original"

    orig_doc = db.collection(RECIPES_COLLECTION).document(orig_id).get()
    enh_doc = db.collection(RECIPES_COLLECTION).document(base_id).get()

    if not orig_doc.exists:  # type: ignore[union-attr]
        print(f"  ❌ Original doc not found: {orig_id}")
        return
    if not enh_doc.exists:  # type: ignore[union-attr]
        print(f"  ❌ Enhanced doc not found: {base_id}")
        return

    orig_data = orig_doc.to_dict()  # type: ignore[union-attr]
    enh_data = enh_doc.to_dict()  # type: ignore[union-attr]
    if orig_data is None or enh_data is None:
        print(f"  ❌ Empty doc data for {base_id}")
        return

    print(f"  ENHANCED DOC: {base_id}")
    print(f"    title:        {enh_data.get('title')}")
    print(f"    ingredients:  {len(enh_data.get('ingredients', []))} items")
    print(f"    instructions: {len(enh_data.get('instructions', []))} steps")
    print(f"    household_id: {enh_data.get('household_id', '(missing)')}")
    print(f"    enhanced:     {enh_data.get('enhanced')}")
    print(f"    improved:     {enh_data.get('improved')}")
    print(f"    original_id:  {enh_data.get('original_id')}")
    print(f"    enhanced_from:{enh_data.get('enhanced_from')}")

    print(f"\n  ORIGINAL DOC: {orig_id}")
    print(f"    title:        {orig_data.get('title')}")
    print(f"    ingredients:  {len(orig_data.get('ingredients', []))} items")
    print(f"    instructions: {len(orig_data.get('instructions', []))} steps")

    # Build merge preview
    updates = build_merge(enh_data, orig_data)
    original_snapshot = updates.pop("original")
    cleanup = [k for k, v in updates.items() if v is DELETE_FIELD]
    sets = {k: v for k, v in updates.items() if v is not DELETE_FIELD}

    print("\n  MERGE RESULT:")
    print(f"    Keep doc:     {base_id}")
    print(f"    Delete doc:   {orig_id}")
    print(f"    Set fields:   {sets}")
    print(f"    Remove fields:{cleanup}")
    print(f"    original.title:        {original_snapshot.get('title')}")
    print(f"    original.ingredients:  {len(original_snapshot.get('ingredients', []))} items")
    print(f"    original.instructions: {len(original_snapshot.get('instructions', []))} steps")
    print(f"    original.servings:     {original_snapshot.get('servings')}")


def apply_pair(base_id: str, *, dry_run: bool = False) -> bool:
    """Apply the merge for a single pair. Returns True on success."""
    orig_id = f"{base_id}_original"

    orig_doc = db.collection(RECIPES_COLLECTION).document(orig_id).get()
    enh_doc = db.collection(RECIPES_COLLECTION).document(base_id).get()

    if not orig_doc.exists or not enh_doc.exists:  # type: ignore[union-attr]
        print(f"  ❌ Missing doc(s) for {base_id}")
        return False

    orig_data = orig_doc.to_dict()  # type: ignore[union-attr]
    enh_data = enh_doc.to_dict()  # type: ignore[union-attr]
    if orig_data is None or enh_data is None:
        print(f"  ❌ Empty doc data for {base_id}")
        return False
    updates = build_merge(enh_data, orig_data)

    title = enh_data.get("title", "?")

    if dry_run:
        print(f"  [DRY RUN] Would merge {orig_id} → {base_id} ({title})")
        return True

    try:
        # Apply update to enhanced doc
        db.collection(RECIPES_COLLECTION).document(base_id).update(updates)
        # Delete original doc
        db.collection(RECIPES_COLLECTION).document(orig_id).delete()
        print(f"  ✅ Merged {orig_id} → {base_id} ({title})")
        return True
    except Exception as e:
        print(f"  ⚠️  SKIPPED {base_id} ({title}): {e}")
        return False


def verify_pair(base_id: str) -> None:
    """Verify a merged document looks correct."""
    doc = db.collection(RECIPES_COLLECTION).document(base_id).get()
    if not doc.exists:  # type: ignore[union-attr]
        print(f"  ❌ Doc not found: {base_id}")
        return

    data = doc.to_dict()  # type: ignore[union-attr]
    if data is None:
        print(f"  ❌ Empty doc data: {base_id}")
        return
    original = data.get("original")

    print(f"  DOC: {base_id}")
    print(f"    title:         {data.get('title')}")
    print(f"    enhanced:      {data.get('enhanced')}")
    print(f"    household_id:  {data.get('household_id')}")
    print(f"    improved:      {data.get('improved', '(removed)')}")
    print(f"    original_id:   {data.get('original_id', '(removed)')}")
    print(f"    enhanced_from: {data.get('enhanced_from', '(removed)')}")

    if original:
        print(f"    original.title:        {original.get('title')}")
        print(f"    original.ingredients:  {len(original.get('ingredients', []))} items")
        print(f"    original.instructions: {len(original.get('instructions', []))} steps")
    else:
        print("    original: ❌ MISSING")

    orig_id = f"{base_id}_original"
    orig_exists = db.collection(RECIPES_COLLECTION).document(orig_id).get().exists  # type: ignore[union-attr]
    print(f"    {orig_id}: {'❌ still exists!' if orig_exists else '✅ deleted'}")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == "list":
        pairs = get_all_pairs()
        print(f"Found {len(pairs)} pairs:\n")
        for i, (orig_id, enh_id) in enumerate(pairs, 1):
            orig_data = db.collection(RECIPES_COLLECTION).document(orig_id).get().to_dict()  # type: ignore[union-attr]
            title = orig_data.get("title", "?") if orig_data else "?"
            print(f"  {i:3}. {enh_id} — {title}")

    elif command == "show":
        if len(sys.argv) < 3:
            print("Usage: show <base_id>")
            return
        base_id = sys.argv[2]
        show_pair(base_id)

    elif command == "apply":
        if len(sys.argv) < 3:
            print("Usage: apply <base_id>")
            return
        base_id = sys.argv[2]
        print(f"\n=== Applying merge for {base_id} ===")
        show_pair(base_id)
        print()
        apply_pair(base_id)
        print()
        verify_pair(base_id)

    elif command == "verify":
        if len(sys.argv) < 3:
            print("Usage: verify <base_id>")
            return
        verify_pair(sys.argv[2])

    elif command == "batch":
        pairs = get_all_pairs()
        print(f"Found {len(pairs)} pairs to consolidate.\n")
        success = 0
        skipped = []
        for orig_id, enh_id in pairs:
            if apply_pair(enh_id):
                success += 1
            else:
                skipped.append((orig_id, enh_id))
        print(f"\nDone: {success}/{len(pairs)} merged successfully.")
        if skipped:
            print(f"\n⚠️  SKIPPED {len(skipped)} pairs:")
            for _orig_id, enh_id in skipped:
                data = db.collection(RECIPES_COLLECTION).document(enh_id).get().to_dict()  # type: ignore[union-attr]
                title = data.get("title", "?") if data else "?"
                print(f"  - {enh_id} ({title})")

    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
