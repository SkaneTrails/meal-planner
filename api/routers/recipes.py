"""Recipe API endpoints — CRUD operations.

Scraping/parsing, enhancement, and image endpoints are in their
respective sub-modules and merged into this router at import time.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe import (
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    PaginatedRecipeList,
    Recipe,
    RecipeCreate,
    RecipeUpdate,
)
from api.routers.recipe_enhancement import HouseholdConfig  # re-export for tests
from api.routers.recipe_images import ingest_recipe_image
from api.storage import recipe_storage
from api.storage.recipe_queries import count_recipes, get_recipes_paginated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["recipes"], dependencies=[Depends(require_auth)])

# Include sub-module routers so /recipes/* stays unchanged.
# Imported AFTER creating `router` to avoid circular imports.
from api.routers.recipe_enhancement import router as _enhancement_router  # noqa: E402
from api.routers.recipe_images import router as _images_router  # noqa: E402
from api.routers.recipe_notes import router as _notes_router  # noqa: E402
from api.routers.recipe_scraping import router as _scraping_router  # noqa: E402

router.include_router(_scraping_router)
router.include_router(_enhancement_router)
router.include_router(_images_router)
router.include_router(_notes_router)

# Re-export HouseholdConfig so existing test imports keep working
__all__ = ["HouseholdConfig", "router"]


@router.get("")
async def list_recipes(  # noqa: PLR0913
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    search: Annotated[str | None, Query(description="Search recipes by title")] = None,
    *,
    include_duplicates: Annotated[bool, Query(description="Include duplicate URLs")] = False,
    show_hidden: Annotated[bool, Query(description="Include hidden (thumbs-down) recipes")] = False,
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_LIMIT, description="Max recipes per page")] = DEFAULT_PAGE_LIMIT,
    cursor: Annotated[str | None, Query(description="Cursor (recipe ID) for next page")] = None,
) -> PaginatedRecipeList:
    """Get recipes visible to the user, with cursor-based pagination.

    Superusers see all recipes. Regular users see their household's recipes and shared recipes.
    Hidden recipes (thumbs-down) are excluded by default unless show_hidden=true.
    """
    household_id = None if user.role == "superuser" else user.household_id

    if search:
        recipes = recipe_storage.search_recipes(search, household_id=household_id, show_hidden=show_hidden)
        return PaginatedRecipeList(items=recipes, total_count=len(recipes), next_cursor=None, has_more=False)

    total = count_recipes(household_id=household_id, show_hidden=show_hidden) if cursor is None else None
    recipes, next_cursor = get_recipes_paginated(
        household_id=household_id,
        limit=limit,
        cursor=cursor,
        include_duplicates=include_duplicates,
        show_hidden=show_hidden,
    )
    return PaginatedRecipeList(
        items=recipes, total_count=total, next_cursor=next_cursor, has_more=next_cursor is not None
    )


@router.get("/{recipe_id}")
async def get_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """Get a single recipe by ID.

    Superusers can view any recipe. Regular users can view owned or shared recipes.
    """
    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if user.role != "superuser" and user.household_id is not None:
        is_owned = recipe.household_id == user.household_id
        is_shared = recipe.visibility == "shared"
        if not (is_owned or is_shared):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return recipe


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe: RecipeCreate) -> Recipe:
    """Create a new recipe manually or from a preview.

    Recipe will be owned by the user's household. If the recipe has an
    external image_url, the image is automatically downloaded, resized,
    and stored in GCS.
    """
    household_id = require_household(user)
    saved = recipe_storage.save_recipe(recipe, household_id=household_id, created_by=user.email)
    return await ingest_recipe_image(saved, household_id=household_id)


@router.put("/{recipe_id}")
async def update_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, updates: RecipeUpdate
) -> Recipe:
    """Update an existing recipe.

    Users can only update recipes they own (same household).
    """
    household_id = require_household(user)
    recipe = recipe_storage.update_recipe(recipe_id, updates, household_id=household_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> None:
    """Delete a recipe.

    Users can only delete recipes they own (same household).
    """
    household_id = require_household(user)
    if not recipe_storage.delete_recipe(recipe_id, household_id=household_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")


@router.post("/{recipe_id}/copy", status_code=status.HTTP_201_CREATED)
async def copy_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """Create a copy of a shared/legacy recipe for your household.

    This allows users to:
    - Make a private copy of a shared recipe to modify
    - Copy recipes before enhancing them (auto-done by enhance endpoint)

    The copy will be owned by the user's household with visibility="household".
    """
    household_id = require_household(user)

    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if recipe.household_id == household_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe already belongs to your household")

    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"
    if not is_shared_or_legacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    copied = recipe_storage.copy_recipe(recipe_id, to_household_id=household_id, copied_by=user.email)

    if copied is None:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy recipe")

    return copied
