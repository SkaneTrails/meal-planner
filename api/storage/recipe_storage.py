"""Recipe storage service using Firestore."""

import contextlib
from datetime import UTC, datetime
from typing import cast
from urllib.parse import urlparse

from google.cloud.firestore_v1 import DocumentSnapshot, FieldFilter

from api.models.recipe import DietLabel, MealLabel, Recipe, RecipeCreate, RecipeUpdate
from api.storage.firestore_client import DEFAULT_DATABASE, RECIPES_COLLECTION, get_firestore_client


def normalize_url(url: str) -> str:
    """Normalize a URL for comparison (remove trailing slashes, fragments, etc.)."""
    if not url:
        return ""
    parsed = urlparse(url.lower().strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _doc_to_recipe(doc_id: str, data: dict) -> Recipe:
    """Convert Firestore document data to Recipe model."""
    diet_label = None
    if data.get("diet_label"):
        with contextlib.suppress(ValueError):
            diet_label = DietLabel(data["diet_label"])

    meal_label = None
    if data.get("meal_label"):
        with contextlib.suppress(ValueError):
            meal_label = MealLabel(data["meal_label"])

    # Handle enhancement fields (support both old and new field names)
    enhanced = data.get("enhanced", data.get("improved", False))
    enhanced_from = data.get("enhanced_from", data.get("original_id"))
    enhanced_at = data.get("enhanced_at")

    return Recipe(
        id=doc_id,
        title=data.get("title", ""),
        url=data.get("url", ""),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions", []),
        image_url=data.get("image_url"),
        servings=data.get("servings"),
        prep_time=data.get("prep_time"),
        cook_time=data.get("cook_time"),
        total_time=data.get("total_time"),
        cuisine=data.get("cuisine"),
        category=data.get("category"),
        tags=data.get("tags", []),
        diet_label=diet_label,
        meal_label=meal_label,
        rating=data.get("rating"),
        # AI enhancement fields (new names)
        enhanced=enhanced,
        enhanced_from=enhanced_from,
        enhanced_at=enhanced_at,
        # Legacy field for backwards compatibility
        improved=enhanced,
        tips=data.get("tips"),
        changes_made=data.get("changes_made"),
        # Household fields
        household_id=data.get("household_id"),
        # Legacy recipes (no household_id) default to shared visibility
        visibility=data.get("visibility", "shared" if data.get("household_id") is None else "household"),
        created_by=data.get("created_by"),
    )


def find_recipe_by_url(url: str) -> Recipe | None:
    """
    Find a recipe by its URL.

    Args:
        url: The recipe URL to search for.

    Returns:
        Recipe if found, None otherwise.
    """
    if not url:
        return None

    db = get_firestore_client()
    normalized = normalize_url(url)

    # Search for exact URL match
    docs = db.collection(RECIPES_COLLECTION).where(filter=FieldFilter("url", "==", url)).limit(1).stream()

    for doc in docs:
        data = doc.to_dict()
        return _doc_to_recipe(doc.id, data)

    # Also check normalized URLs (in case stored URL differs slightly)
    all_recipes = get_all_recipes()  # pragma: no cover
    for recipe in all_recipes:  # pragma: no cover
        if normalize_url(recipe.url) == normalized:  # pragma: no cover
            return recipe  # pragma: no cover

    return None


def get_all_recipes(
    *, include_duplicates: bool = False, database: str = DEFAULT_DATABASE, household_id: str | None = None
) -> list[Recipe]:
    """
    Get all recipes visible to a household.

    Args:
        include_duplicates: If False (default), deduplicate by URL.
        database: The database to read from (default or meal-planner for AI-enhanced).
        household_id: If provided, filter to recipes owned by this household OR shared/legacy recipes.
                      If None, return all recipes (for superusers or backward compatibility).

    Returns:
        List of recipes.
    """
    db = get_firestore_client(database)
    docs = db.collection(RECIPES_COLLECTION).order_by("created_at", direction="DESCENDING").stream()

    recipes = []
    for doc in docs:
        data = doc.to_dict()
        recipe = _doc_to_recipe(doc.id, data)

        # Apply household filtering if specified
        if household_id is not None:
            # Include recipe if:
            # 1. It belongs to this household, OR
            # 2. It has visibility="shared", OR
            # 3. It's a legacy recipe (no household_id) - treat as shared
            recipe_household = recipe.household_id
            is_owned = recipe_household == household_id
            is_shared = recipe.visibility == "shared"
            is_legacy = recipe_household is None

            if not (is_owned or is_shared or is_legacy):
                continue

        recipes.append(recipe)

    if include_duplicates:
        return recipes

    # Deduplicate by normalized URL (keep first occurrence, which is most recent)
    seen_urls: set[str] = set()
    unique_recipes = []

    for recipe in recipes:
        normalized = normalize_url(recipe.url) if recipe.url else f"__no_url_{recipe.id}"
        if normalized not in seen_urls:
            seen_urls.add(normalized)
            unique_recipes.append(recipe)

    return unique_recipes


def save_recipe(  # noqa: PLR0913
    recipe: RecipeCreate,
    *,
    recipe_id: str | None = None,
    database: str = DEFAULT_DATABASE,
    enhanced: bool = False,
    enhanced_from: str | None = None,
    enhanced_at: datetime | None = None,
    changes_made: list[str] | None = None,
    household_id: str | None = None,
    created_by: str | None = None,
) -> Recipe:
    """
    Save a new recipe to Firestore.

    Args:
        recipe: The recipe to save.
        recipe_id: Optional ID to use (for saving enhanced versions with same ID).
        database: The database to save to (default or meal-planner for AI-enhanced).
        enhanced: Whether this recipe has been AI-enhanced.
        enhanced_from: Original recipe ID if this is an enhanced copy.
        enhanced_at: When the recipe was enhanced.
        changes_made: List of changes made by AI enhancement.
        household_id: The household that owns this recipe.
        created_by: Email of the user who created the recipe.

    Returns:
        The saved recipe with its document ID.
    """
    db = get_firestore_client(database)
    doc_ref = (
        db.collection(RECIPES_COLLECTION).document(recipe_id)
        if recipe_id
        else db.collection(RECIPES_COLLECTION).document()
    )

    now = datetime.now(tz=UTC)
    data = {
        "title": recipe.title,
        "url": recipe.url,
        "ingredients": recipe.ingredients,
        "instructions": recipe.instructions,
        "image_url": recipe.image_url,
        "servings": recipe.servings,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "total_time": recipe.total_time,
        "cuisine": recipe.cuisine,
        "category": recipe.category,
        "tags": recipe.tags,
        "tips": recipe.tips,
        "diet_label": recipe.diet_label.value if recipe.diet_label else None,
        "meal_label": recipe.meal_label.value if recipe.meal_label else None,
        "created_at": now,
        "updated_at": now,
        # Household fields
        "household_id": household_id,
        "visibility": recipe.visibility if hasattr(recipe, "visibility") else "household",
        "created_by": created_by,
    }

    # Add enhancement fields if present
    if enhanced:
        data["enhanced"] = enhanced
        data["improved"] = enhanced  # Legacy field for backwards compatibility
    if enhanced_from:
        data["enhanced_from"] = enhanced_from
        data["original_id"] = enhanced_from  # Legacy field for backwards compatibility
    if enhanced_at:
        data["enhanced_at"] = enhanced_at
    if changes_made:
        data["changes_made"] = changes_made

    doc_ref.set(data)

    # Type cast visibility to match Recipe model's Literal type
    visibility_value = data["visibility"]
    if visibility_value not in ("household", "shared"):
        visibility_value = "household"

    return Recipe(
        id=doc_ref.id,
        enhanced=enhanced,
        enhanced_from=enhanced_from,
        enhanced_at=enhanced_at,
        improved=enhanced,
        changes_made=changes_made,
        household_id=household_id,
        visibility=visibility_value,  # type: ignore[arg-type]
        created_by=created_by,
        **recipe.model_dump(exclude={"household_id", "visibility", "created_by"}),
    )


def update_recipe(
    recipe_id: str, updates: RecipeUpdate, database: str = DEFAULT_DATABASE, *, household_id: str | None = None
) -> Recipe | None:
    """
    Update an existing recipe in Firestore.

    Args:
        recipe_id: The Firestore document ID.
        updates: The fields to update.
        database: The database to update in (default or meal-planner for AI-enhanced).
        household_id: If provided, verify the recipe belongs to this household before updating.

    Returns:
        The updated recipe, or None if not found or not authorized.
    """
    db = get_firestore_client(database)
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return None

    data = doc.to_dict()

    # Verify household ownership if specified
    # Legacy/shared recipes (household_id=None) are read-only - must copy first
    if household_id is not None:
        recipe_household = data.get("household_id") if data else None
        # Only allow update if recipe is owned by this household
        if recipe_household != household_id:
            return None

    # Only update fields that are set
    update_data = {"updated_at": datetime.now(tz=UTC)}
    for field, value in updates.model_dump(exclude_unset=True).items():
        if field in ("diet_label", "meal_label") and value is not None:
            update_data[field] = value.value if hasattr(value, "value") else value
        else:
            update_data[field] = value

    doc_ref.update(update_data)

    # Return the updated recipe
    return get_recipe(recipe_id, database=database)


def get_recipe(recipe_id: str, database: str = DEFAULT_DATABASE) -> Recipe | None:
    """
    Get a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.
        database: The database to read from (default or meal-planner for AI-enhanced).

    Returns:
        The recipe if found, None otherwise.
    """
    db = get_firestore_client(database)
    doc = cast("DocumentSnapshot", db.collection(RECIPES_COLLECTION).document(recipe_id).get())

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data is None:
        return None

    return _doc_to_recipe(doc.id, data)


def delete_recipe(recipe_id: str, database: str = DEFAULT_DATABASE, *, household_id: str | None = None) -> bool:
    """
    Delete a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.
        database: The database to delete from (default or meal-planner for AI-enhanced).
        household_id: If provided, verify the recipe belongs to this household before deleting.

    Returns:
        True if deleted, False if not found or not authorized.
    """
    db = get_firestore_client(database)
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
        return False

    data = doc.to_dict()

    # Verify household ownership if specified
    # Legacy/shared recipes (household_id=None) are read-only - cannot be deleted
    if household_id is not None and data:
        recipe_household = data.get("household_id")
        # Only allow delete if recipe is owned by this household
        if recipe_household != household_id:
            return False

    doc_ref.delete()
    return True


def search_recipes(query: str, database: str = DEFAULT_DATABASE, *, household_id: str | None = None) -> list[Recipe]:
    """
    Search recipes by title (case-sensitive prefix match).

    Note: Firestore range queries are case-sensitive. For case-insensitive
    search, consider storing a normalized title field.

    Args:
        query: The search query.
        database: The database to search in.
        household_id: If provided, filter to recipes owned by this household OR shared/legacy.

    Returns:
        List of matching recipes.
    """
    db = get_firestore_client(database)
    docs = (
        db.collection(RECIPES_COLLECTION)
        .where(filter=FieldFilter("title", ">=", query))
        .where(filter=FieldFilter("title", "<=", query + "\uf8ff"))
        .stream()
    )

    recipes = []
    for doc in docs:
        data = doc.to_dict()
        recipe = _doc_to_recipe(doc.id, data)

        # Apply household filtering if specified
        if household_id is not None:
            recipe_household = recipe.household_id
            is_owned = recipe_household == household_id
            is_shared = recipe.visibility == "shared"
            is_legacy = recipe_household is None

            if not (is_owned or is_shared or is_legacy):
                continue

        recipes.append(recipe)

    return recipes


def copy_recipe(
    recipe_id: str, *, to_household_id: str, copied_by: str, database: str = DEFAULT_DATABASE
) -> Recipe | None:
    """
    Create a copy of a recipe for a different household.

    This is used when:
    - A user wants to copy a shared recipe to their household
    - Before enhancing a shared recipe (creates household-owned copy first)

    Args:
        recipe_id: The recipe to copy.
        to_household_id: The household that will own the copy.
        copied_by: Email of the user creating the copy.
        database: The database to read from and write to.

    Returns:
        The new copied recipe, or None if source recipe not found.
    """
    # Get the source recipe
    source = get_recipe(recipe_id, database=database)
    if source is None:
        return None

    # Create a RecipeCreate from the source
    from api.models.recipe import RecipeCreate

    recipe_data = RecipeCreate(
        title=source.title,
        url=source.url,
        ingredients=source.ingredients,
        instructions=source.instructions,
        image_url=source.image_url,
        servings=source.servings,
        prep_time=source.prep_time,
        cook_time=source.cook_time,
        total_time=source.total_time,
        cuisine=source.cuisine,
        category=source.category,
        tags=source.tags,
        tips=source.tips,
        diet_label=source.diet_label,
        meal_label=source.meal_label,
        visibility="household",  # Copies are private by default
    )

    # Save as a new recipe owned by the target household
    return save_recipe(recipe_data, database=database, household_id=to_household_id, created_by=copied_by)
