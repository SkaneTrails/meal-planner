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
    all_recipes = get_all_recipes()
    for recipe in all_recipes:
        if normalize_url(recipe.url) == normalized:
            return recipe

    return None


def get_all_recipes(*, include_duplicates: bool = False, database: str = DEFAULT_DATABASE) -> list[Recipe]:
    """
    Get all recipes.

    Args:
        include_duplicates: If False (default), deduplicate by URL.
        database: The database to read from (default or meal-planner for AI-enhanced).

    Returns:
        List of recipes.
    """
    db = get_firestore_client(database)
    docs = db.collection(RECIPES_COLLECTION).order_by("created_at", direction="DESCENDING").stream()

    recipes = []
    for doc in docs:
        data = doc.to_dict()
        recipes.append(_doc_to_recipe(doc.id, data))

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


def save_recipe(recipe: RecipeCreate) -> Recipe:
    """
    Save a new recipe to Firestore.

    Args:
        recipe: The recipe to save.

    Returns:
        The saved recipe with its document ID.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document()

    now = datetime.now(tz=UTC)
    doc_ref.set(
        {
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
            "diet_label": recipe.diet_label.value if recipe.diet_label else None,
            "meal_label": recipe.meal_label.value if recipe.meal_label else None,
            "created_at": now,
            "updated_at": now,
        }
    )

    return Recipe(id=doc_ref.id, **recipe.model_dump())


def update_recipe(recipe_id: str, updates: RecipeUpdate, database: str = DEFAULT_DATABASE) -> Recipe | None:
    """
    Update an existing recipe in Firestore.

    Args:
        recipe_id: The Firestore document ID.
        updates: The fields to update.
        database: The database to update in (default or meal-planner for AI-enhanced).

    Returns:
        The updated recipe, or None if not found.
    """
    db = get_firestore_client(database)
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    doc = cast("DocumentSnapshot", doc_ref.get())
    if not doc.exists:
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


def delete_recipe(recipe_id: str) -> bool:
    """
    Delete a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.

    Returns:
        True if deleted, False if not found.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document(recipe_id)

    if not cast("DocumentSnapshot", doc_ref.get()).exists:
        return False

    doc_ref.delete()
    return True


def search_recipes(query: str, database: str = DEFAULT_DATABASE) -> list[Recipe]:
    """
    Search recipes by title (case-sensitive prefix match).

    Note: Firestore range queries are case-sensitive. For case-insensitive
    search, consider storing a normalized title field.

    Args:
        query: The search query.
        database: The database to search in.

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
        recipes.append(_doc_to_recipe(doc.id, data))

    return recipes
