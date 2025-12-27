"""Recipe storage service using Firestore."""

import contextlib
from datetime import UTC, datetime
from typing import cast
from urllib.parse import urlparse

from google.cloud.firestore_v1 import DocumentSnapshot, FieldFilter

from app.models.recipe import DietLabel, MealLabel, Recipe
from app.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


def normalize_url(url: str) -> str:
    """Normalize a URL for comparison (remove trailing slashes, fragments, etc.)."""
    if not url:
        return ""
    parsed = urlparse(url.lower().strip())
    # Reconstruct without fragment, normalize path
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def find_recipe_by_url(url: str) -> tuple[str, Recipe] | None:
    """
    Find a recipe by its URL.

    Args:
        url: The recipe URL to search for.

    Returns:
        Tuple of (document_id, recipe) if found, None otherwise.
    """
    if not url:
        return None

    db = get_firestore_client()
    normalized = normalize_url(url)

    # Search for exact URL match
    docs = db.collection(RECIPES_COLLECTION).where(filter=FieldFilter("url", "==", url)).limit(1).stream()

    for doc in docs:
        data = doc.to_dict()
        diet_label = None
        if data.get("diet_label"):
            with contextlib.suppress(ValueError):
                diet_label = DietLabel(data["diet_label"])

        meal_label = None
        if data.get("meal_label"):
            with contextlib.suppress(ValueError):
                meal_label = MealLabel(data["meal_label"])

        recipe = Recipe(
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
        return (doc.id, recipe)

    # Also check normalized URLs (in case stored URL differs slightly)
    all_recipes = get_all_recipes_raw()
    for doc_id, recipe in all_recipes:
        if normalize_url(recipe.url) == normalized:
            return (doc_id, recipe)

    return None


def get_all_recipes_raw() -> list[tuple[str, Recipe]]:
    """
    Get all recipes without deduplication.

    Returns:
        List of tuples containing (document_id, recipe).
    """
    db = get_firestore_client()
    docs = db.collection(RECIPES_COLLECTION).order_by("created_at", direction="DESCENDING").stream()

    recipes = []
    for doc in docs:
        data = doc.to_dict()

        diet_label = None
        if data.get("diet_label"):
            with contextlib.suppress(ValueError):
                diet_label = DietLabel(data["diet_label"])

        meal_label = None
        if data.get("meal_label"):
            with contextlib.suppress(ValueError):
                meal_label = MealLabel(data["meal_label"])

        recipe = Recipe(
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
        recipes.append((doc.id, recipe))

    return recipes


def save_recipe(recipe: Recipe) -> str:
    """
    Save a recipe to Firestore.

    Args:
        recipe: The recipe to save.

    Returns:
        The document ID of the saved recipe.
    """
    db = get_firestore_client()
    doc_ref = db.collection(RECIPES_COLLECTION).document()

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
            "created_at": datetime.now(tz=UTC),
            "updated_at": datetime.now(tz=UTC),
        }
    )

    return doc_ref.id


def get_recipe(recipe_id: str) -> Recipe | None:
    """
    Get a recipe by ID.

    Args:
        recipe_id: The Firestore document ID.

    Returns:
        The recipe if found, None otherwise.
    """
    db = get_firestore_client()
    doc = cast("DocumentSnapshot", db.collection(RECIPES_COLLECTION).document(recipe_id).get())

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data is None:
        return None

    # Parse enum values
    diet_label = None
    if data.get("diet_label"):
        with contextlib.suppress(ValueError):
            diet_label = DietLabel(data["diet_label"])

    meal_label = None
    if data.get("meal_label"):
        with contextlib.suppress(ValueError):
            meal_label = MealLabel(data["meal_label"])

    return Recipe(
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


def get_all_recipes() -> list[tuple[str, Recipe]]:
    """
    Get all recipes, deduplicated by URL.

    If multiple recipes have the same URL, only the most recent one is kept.

    Returns:
        List of tuples containing (document_id, recipe).
    """
    all_recipes = get_all_recipes_raw()

    # Deduplicate by normalized URL (keep first occurrence, which is most recent due to ordering)
    seen_urls: set[str] = set()
    unique_recipes = []

    for doc_id, recipe in all_recipes:
        normalized = normalize_url(recipe.url) if recipe.url else f"__no_url_{doc_id}"
        if normalized not in seen_urls:
            seen_urls.add(normalized)
            unique_recipes.append((doc_id, recipe))

    return unique_recipes


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


def search_recipes(query: str) -> list[tuple[str, Recipe]]:
    """
    Search recipes by title (case-insensitive prefix match).

    Args:
        query: The search query.

    Returns:
        List of matching (document_id, recipe) tuples.
    """
    db = get_firestore_client()
    # Firestore doesn't support full-text search, so we do a simple prefix match
    # For better search, consider Algolia or Elasticsearch
    docs = (
        db.collection(RECIPES_COLLECTION)
        .where(filter=FieldFilter("title", ">=", query))
        .where(filter=FieldFilter("title", "<=", query + "\uf8ff"))
        .stream()
    )

    recipes = []
    for doc in docs:
        data = doc.to_dict()

        # Parse enum values
        diet_label = None
        if data.get("diet_label"):
            with contextlib.suppress(ValueError):
                diet_label = DietLabel(data["diet_label"])

        meal_label = None
        if data.get("meal_label"):
            with contextlib.suppress(ValueError):
                meal_label = MealLabel(data["meal_label"])

        recipe = Recipe(
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
        recipes.append((doc.id, recipe))

    return recipes
