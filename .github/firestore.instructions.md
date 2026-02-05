# Firestore Instructions

These conventions apply when working with Firestore data in this project.

## Database Configuration

The app uses two Firestore databases:

| Database       | Purpose                  |
| -------------- | ------------------------ |
| `(default)`    | Original scraped recipes |
| `meal-planner` | AI-enhanced recipes      |

Both databases use the same schema. The `?enhanced=true` API parameter switches between them.

## Recipe Document Schema

All fields must be at the **top level** (no nested objects). The `created_at` field is **required** for queries.

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
    "image_url": str | None,
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
    "enhanced_from": str | None,     # Recipe ID this was enhanced from
    "enhanced_at": datetime | None,  # When enhancement was performed
    "changes_made": list[str],       # Summary of AI changes
    "tips": str | None,              # Cooking tips from AI
}
```

## Common Schema Mistakes (DO NOT DO)

| ❌ Wrong                                      | ✅ Correct                                    |
| --------------------------------------------- | --------------------------------------------- |
| `instructions: "Step 1. Do X. Step 2. Do Y."` | `instructions: ["Step 1. Do X", "Step 2..."]` |
| `metadata: { cuisine: "Italian" }`            | `cuisine: "Italian"` (top-level)              |
| Missing `created_at`                          | Always include `created_at: datetime.now()`   |
