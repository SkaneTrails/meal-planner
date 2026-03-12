"""Featured recipe categories service.

Selects and populates dynamic recipe categories based on the user's
recipe library, current season, and time of day. Returns up to 3
non-empty categories with at most 8 recipes each.
"""

from __future__ import annotations

import random
from datetime import datetime
from typing import TYPE_CHECKING

from api.models.featured import CategoryDefinition, FeaturedCategoriesResponse, FeaturedCategory

if TYPE_CHECKING:
    from api.models.recipe import Recipe

RECIPES_PER_CATEGORY = 8
CATEGORIES_TO_SHOW = 3

_MORNING_START = 5
_AFTERNOON_START = 12
_EVENING_START = 17

CATEGORY_DEFINITIONS: list[CategoryDefinition] = [
    CategoryDefinition(key="cozy-winter", any_tags=["comfort-food", "hearty"], seasons=["winter"]),
    CategoryDefinition(key="hearty-soups", any_tags=["soup", "stew"], seasons=["winter", "autumn"]),
    CategoryDefinition(
        key="quick-breakfast", required_tags=["breakfast"], any_tags=["quick", "easy"], times=["morning"]
    ),
    CategoryDefinition(key="summer-salads", required_tags=["salad"], seasons=["summer"]),
    CategoryDefinition(key="weeknight-dinners", any_tags=["weeknight", "easy"], times=["evening"]),
    CategoryDefinition(key="grilled-favorites", any_tags=["grilled", "bbq"], seasons=["summer"]),
    CategoryDefinition(key="light-and-fresh", any_tags=["light", "refreshing", "fresh"], seasons=["summer", "spring"]),
    CategoryDefinition(key="comfort-classics", required_tags=["comfort-food"], seasons=["autumn", "winter"]),
    CategoryDefinition(key="one-pot-wonders", any_tags=["one-pot", "one-pan"]),
    CategoryDefinition(key="meal-prep", any_tags=["meal-prep", "batch-cooking", "freezer-friendly"]),
    CategoryDefinition(key="high-protein", required_tags=["high-protein"]),
    CategoryDefinition(key="family-favorites", any_tags=["kid-friendly", "crowd-pleaser"]),
    CategoryDefinition(
        key="asian-inspired", any_tags=["japanese", "thai", "chinese", "korean", "vietnamese", "indian"]
    ),
    CategoryDefinition(key="mediterranean", any_tags=["mediterranean", "greek", "italian"]),
    CategoryDefinition(key="pasta-night", required_tags=["pasta"], times=["evening"]),
    CategoryDefinition(
        key="autumn-harvest", any_tags=["pumpkin", "sweet-potato", "beetroot", "root-vegetables"], seasons=["autumn"]
    ),
    CategoryDefinition(key="spring-fresh", any_tags=["spring", "fresh", "light"], seasons=["spring"]),
]


def get_season(month: int) -> str:
    """Derive the season from a month number (1-12)."""
    if month in {12, 1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "spring"
    if month in {6, 7, 8}:
        return "summer"
    return "autumn"


def get_time_of_day(hour: int) -> str:
    """Map an hour (0-23) to a time-of-day bucket."""
    if _MORNING_START <= hour < _AFTERNOON_START:
        return "morning"
    if _AFTERNOON_START <= hour < _EVENING_START:
        return "afternoon"
    return "evening"


def _is_eligible(definition: CategoryDefinition, *, season: str, time_of_day: str) -> bool:
    """Check whether a category definition matches the current context."""
    if definition.seasons and season not in definition.seasons:
        return False
    return not (definition.times and time_of_day not in definition.times)


def _recipe_matches(recipe: Recipe, definition: CategoryDefinition) -> bool:
    """Check whether a recipe's tags satisfy the category's tag rules."""
    tags = set(recipe.tags)
    if definition.required_tags and not all(t in tags for t in definition.required_tags):
        return False
    return not (definition.any_tags and not any(t in tags for t in definition.any_tags))


def _select_recipes(recipes: list[Recipe], definition: CategoryDefinition) -> list[Recipe]:
    """Return up to RECIPES_PER_CATEGORY matching recipes, shuffled."""
    matching = [r for r in recipes if _recipe_matches(r, definition)]
    if len(matching) > RECIPES_PER_CATEGORY:
        matching = random.sample(matching, RECIPES_PER_CATEGORY)
    return matching


def build_featured_categories(recipes: list[Recipe], *, now: datetime | None = None) -> FeaturedCategoriesResponse:
    """Build the featured categories response from a list of visible recipes.

    Algorithm:
        1. Determine season and time-of-day from ``now``.
        2. Filter category definitions eligible for the current context.
        3. Shuffle eligible definitions for variety.
        4. For each candidate, collect matching recipes.
        5. Keep categories that have at least 1 match, up to 3 total.

    Args:
        recipes: All recipes visible to the requesting user.
        now: Override for testing; defaults to ``datetime.now()``.

    Returns:
        A response containing up to 3 featured categories.
    """
    if now is None:
        now = datetime.now()  # noqa: DTZ005 — local time is intentional for season/time logic

    season = get_season(now.month)
    time_of_day = get_time_of_day(now.hour)

    eligible = [d for d in CATEGORY_DEFINITIONS if _is_eligible(d, season=season, time_of_day=time_of_day)]
    random.shuffle(eligible)

    categories: list[FeaturedCategory] = []
    for definition in eligible:
        if len(categories) >= CATEGORIES_TO_SHOW:
            break
        selected = _select_recipes(recipes, definition)
        if selected:
            categories.append(FeaturedCategory(key=definition.key, recipes=selected))

    return FeaturedCategoriesResponse(categories=categories, season=season, time_of_day=time_of_day)
