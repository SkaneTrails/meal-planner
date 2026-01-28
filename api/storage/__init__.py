"""Storage layer for the API."""

from api.storage.firestore_client import (
    GROCERY_LISTS_COLLECTION,
    MEAL_PLANS_COLLECTION,
    RECIPES_COLLECTION,
    get_firestore_client,
)
from api.storage.meal_plan_storage import (
    delete_meal,
    load_day_notes,
    load_meal_plan,
    save_meal_plan,
    update_day_note,
    update_meal,
)
from api.storage.recipe_storage import (
    delete_recipe,
    find_recipe_by_url,
    get_all_recipes,
    get_recipe,
    normalize_url,
    save_recipe,
    search_recipes,
    update_recipe,
)

__all__ = [
    "GROCERY_LISTS_COLLECTION",
    "MEAL_PLANS_COLLECTION",
    "RECIPES_COLLECTION",
    "delete_meal",
    "delete_recipe",
    "find_recipe_by_url",
    "get_all_recipes",
    "get_firestore_client",
    "get_recipe",
    "load_day_notes",
    "load_meal_plan",
    "normalize_url",
    "save_meal_plan",
    "save_recipe",
    "search_recipes",
    "update_day_note",
    "update_meal",
    "update_recipe",
]
