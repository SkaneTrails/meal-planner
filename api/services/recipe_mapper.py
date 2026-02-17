"""Helper utilities for recipe data mapping.

Centralizes the conversion from raw scraped/enhanced data dicts
to RecipeCreate models, eliminating duplicate mapping blocks in router endpoints.
"""

from typing import Any

from api.models.recipe import Recipe, RecipeCreate


def build_recipe_create_from_scraped(scraped_data: dict[str, Any]) -> RecipeCreate:
    """Build a RecipeCreate from scraped recipe data.

    Args:
        scraped_data: Dict from scraping service with recipe fields.

    Returns:
        RecipeCreate model ready for storage.
    """
    return RecipeCreate(
        title=scraped_data["title"],
        url=scraped_data["url"],
        ingredients=scraped_data.get("ingredients", []),
        instructions=scraped_data.get("instructions", []),
        image_url=scraped_data.get("image_url"),
        servings=scraped_data.get("servings"),
        prep_time=scraped_data.get("prep_time"),
        cook_time=scraped_data.get("cook_time"),
        total_time=scraped_data.get("total_time"),
        diet_label=scraped_data.get("diet_label"),
        meal_label=scraped_data.get("meal_label"),
    )


def build_recipe_create_from_enhanced(enhanced_data: dict[str, Any], fallback: Recipe | RecipeCreate) -> RecipeCreate:
    """Build a RecipeCreate from AI-enhanced recipe data.

    Falls back to the original recipe values for any missing fields.

    Args:
        enhanced_data: Dict from enhancement service with improved recipe fields.
        fallback: Original recipe (RecipeCreate or Recipe model) for default values.

    Returns:
        RecipeCreate model with enhanced data merged over fallback values.
    """
    return RecipeCreate(
        title=enhanced_data.get("title", fallback.title),
        url=enhanced_data.get("url", fallback.url),
        ingredients=enhanced_data.get("ingredients", fallback.ingredients),
        instructions=enhanced_data.get("instructions", fallback.instructions),
        image_url=enhanced_data.get("image_url", fallback.image_url),
        servings=enhanced_data.get("servings", fallback.servings),
        prep_time=enhanced_data.get("prep_time", fallback.prep_time),
        cook_time=enhanced_data.get("cook_time", fallback.cook_time),
        total_time=enhanced_data.get("total_time", fallback.total_time),
        diet_label=enhanced_data.get("diet_label", fallback.diet_label),
        meal_label=enhanced_data.get("meal_label", fallback.meal_label),
        cuisine=enhanced_data.get("cuisine"),
        category=enhanced_data.get("category"),
        tags=enhanced_data.get("tags", []),
        tips=enhanced_data.get("tips"),
    )
