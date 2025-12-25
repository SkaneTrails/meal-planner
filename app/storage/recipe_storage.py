"""Recipe storage service using Firestore."""

from datetime import UTC, datetime

from google.cloud.firestore_v1 import FieldFilter

from app.models.recipe import Recipe
from app.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client


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
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    if data is None:
        return None

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
    )


def get_all_recipes() -> list[tuple[str, Recipe]]:
    """
    Get all recipes.

    Returns:
        List of tuples containing (document_id, recipe).
    """
    db = get_firestore_client()
    docs = db.collection(RECIPES_COLLECTION).order_by("created_at", direction="DESCENDING").stream()

    recipes = []
    for doc in docs:
        data = doc.to_dict()
        if data is None:
            continue
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
        )
        recipes.append((doc.id, recipe))

    return recipes


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
    doc = doc_ref.get()

    if not doc.exists:
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
        )
        recipes.append((doc.id, recipe))

    return recipes
