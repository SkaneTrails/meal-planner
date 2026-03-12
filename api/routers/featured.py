"""Featured recipe categories endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.featured import FeaturedCategoriesResponse
from api.services.featured_categories import build_featured_categories
from api.storage.recipe_queries import get_all_recipes

router = APIRouter(prefix="/recipes/featured", tags=["featured"], dependencies=[Depends(require_auth)])


@router.get("")
async def get_featured_categories(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
) -> FeaturedCategoriesResponse:
    """Return up to 3 featured recipe categories for the current context.

    Categories are selected based on the current season and time of day,
    then populated with recipes from the user's visible library that
    match each category's tag requirements.
    """
    household_id = None if user.role == "superuser" else user.household_id
    recipes = get_all_recipes(household_id=household_id)
    return build_featured_categories(recipes)
