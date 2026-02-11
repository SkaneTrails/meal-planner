---
applyTo: "**/*.py"
description: "Firestore schema conventions for meal planner"
---

# Firestore Instructions

These conventions apply when working with Firestore data in this project.

## Database Configuration

The app uses a single Firestore database: `meal-planner`.

All recipes (original and AI-enhanced) are stored in the same document. Enhanced recipes have `enhanced=True` and the original scraped data preserved in a nested `original` field.

## Recipe Document Schema

All fields must be at the **top level** (no nested objects), with one documented exception: the `original` snapshot for enhanced recipes.

The `created_at` field is **required** for queries.

```python
{
    # Required fields
    "title": str,                    # Recipe title
    "url": str,                      # Source URL
    "ingredients": list[str],        # List of ingredient strings
    "instructions": list[str],       # List of instruction steps (MUST be list, not string)
    "created_at": datetime,          # Required for order_by queries
    "updated_at": datetime,          # Last modification time

    # Ownership & visibility fields
    "household_id": str | None,      # Owning household (None = legacy/unassigned)
    "visibility": str,               # "household" (private) | "shared" (public)
    "created_by": str | None,        # User ID who created the recipe

    # Optional metadata
    "image_url": str | None,            # Hero image (800x600) for detail screen
    "thumbnail_url": str | None,        # Thumbnail (400x300) for cards/lists
    "servings": int | None,
    "prep_time": int | None,         # Minutes
    "cook_time": int | None,         # Minutes
    "total_time": int | None,        # Minutes
    "cuisine": str | None,           # e.g., "Italian", "Swedish"
    "category": str | None,          # e.g., "Huvudrätt", "Dessert"
    "tags": list[str],               # e.g., ["quick", "vegetarian"]
    "diet_label": str | None,        # "veggie" | "fish" | "meat"
    "meal_label": str | None,        # "breakfast" | "meal" | "dessert" | etc.
    "rating": int | None,            # 1-5 stars

    # AI enhancement fields
    "enhanced": bool,                # True if AI-enhanced
    "enhanced_at": datetime | None,  # When enhancement was performed
    "changes_made": list[str],       # Summary of AI changes
    "show_enhanced": bool,           # False = show original until user approves
    "enhancement_reviewed": bool,    # True after user approves/rejects

    # Original scraped data (nested exception — set once on first enhancement)
    "original": {                    # Only present on enhanced recipes
        "title": str,
        "ingredients": list[str],
        "instructions": list[str],
        "servings": int | None,
        "prep_time": int | None,
        "cook_time": int | None,
        "total_time": int | None,
        "image_url": str | None,
    } | None,
}
```

## Enhancement Data Flow

When a recipe is enhanced, the document structure changes:

1. **Before enhancement**: Top-level fields contain the scraped original data
2. **On enhancement**: Original data is snapshotted into `original` nested field, enhanced data replaces top-level fields, `show_enhanced=False` (pending review)
3. **User reviews**: Modal shows diff, user approves (`show_enhanced=True`) or rejects (`show_enhanced=False`)
4. **App display**: If `enhanced=True AND show_enhanced=True` → use top-level fields; otherwise → use `original`
5. **Interrupted review**: `enhancement_reviewed=False` → modal reappears next view

**CRITICAL**: Enhancement scripts MUST use Firestore `.update()` (merge), NEVER `.set()` (overwrite). See `tools/recipe_manager.py` for the reference implementation.

## Common Schema Mistakes (DO NOT DO)

| ❌ Wrong                                      | ✅ Correct                                    |
| --------------------------------------------- | --------------------------------------------- |
| `instructions: "Step 1. Do X. Step 2. Do Y."` | `instructions: ["Step 1. Do X", "Step 2..."]` |
| `metadata: { cuisine: "Italian" }`            | `cuisine: "Italian"` (top-level)              |
| Missing `created_at`                          | Always include `created_at: datetime.now()`   |
| `.set(data)` on enhancement                   | `.update(data)` to preserve existing fields   |
| `enhanced_from: str` (separate doc ID)        | `original: { ... }` (nested in same doc)      |
