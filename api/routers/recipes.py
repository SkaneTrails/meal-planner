"""Recipe API endpoints."""

import logging
import os
import uuid
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from google.cloud import storage

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.recipe import (
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    PaginatedRecipeList,
    Recipe,
    RecipeCreate,
    RecipeParseRequest,
    RecipeScrapeRequest,
    RecipeUpdate,
)
from api.services.image_service import create_thumbnail
from api.services.recipe_mapper import build_recipe_create_from_enhanced, build_recipe_create_from_scraped
from api.storage import recipe_storage
from api.storage.recipe_queries import get_recipes_paginated
from api.storage.recipe_storage import EnhancementMetadata

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["recipes"], dependencies=[Depends(require_auth)])


def _get_scrape_url() -> str:
    """Get scrape Cloud Function URL (read on first use, not import time)."""
    return os.environ["SCRAPE_FUNCTION_URL"]


def _get_gcs_bucket() -> str:
    """Get GCS bucket name (read on first use, not import time)."""
    return os.environ["GCS_BUCKET_NAME"]


MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

_HTTP_422 = 422


def _require_household(user: AuthenticatedUser) -> str:
    """Require user to have a household, return household_id."""
    if not user.household_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to create/edit recipes"
        )
    return user.household_id


def _try_enhance(saved_recipe: Recipe, *, household_id: str, created_by: str) -> Recipe:  # pragma: no cover
    """Attempt AI enhancement on a saved recipe, returning original on failure."""
    from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance, is_enhancement_enabled

    if not is_enhancement_enabled():
        return saved_recipe

    try:
        enhanced_data = do_enhance(saved_recipe.model_dump())
        enhanced_create = build_recipe_create_from_enhanced(enhanced_data, saved_recipe)

        return recipe_storage.save_recipe(
            enhanced_create,
            recipe_id=saved_recipe.id,
            enhancement=EnhancementMetadata(enhanced=True, changes_made=enhanced_data.get("changes_made", [])),
            household_id=household_id,
            created_by=created_by,
        )
    except EnhancementError as e:
        logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)
        return saved_recipe


@router.get("")
async def list_recipes(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    search: Annotated[str | None, Query(description="Search recipes by title")] = None,
    *,
    include_duplicates: Annotated[bool, Query(description="Include duplicate URLs")] = False,
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_LIMIT, description="Max recipes per page")] = DEFAULT_PAGE_LIMIT,
    cursor: Annotated[str | None, Query(description="Cursor (recipe ID) for next page")] = None,
) -> PaginatedRecipeList:
    """Get recipes visible to the user, with cursor-based pagination.

    Superusers see all recipes. Regular users see their household's recipes and shared recipes.
    """
    household_id = None if user.role == "superuser" else user.household_id

    if search:
        recipes = recipe_storage.search_recipes(search, household_id=household_id)
        return PaginatedRecipeList(items=recipes, next_cursor=None, has_more=False)

    recipes, next_cursor = get_recipes_paginated(
        household_id=household_id, limit=limit, cursor=cursor, include_duplicates=include_duplicates
    )
    return PaginatedRecipeList(items=recipes, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.get("/{recipe_id}")
async def get_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """Get a single recipe by ID.

    Superusers can view any recipe. Regular users can view owned or shared recipes.
    """
    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Superusers can see everything
    if user.role != "superuser" and user.household_id is not None:
        is_owned = recipe.household_id == user.household_id
        is_shared = recipe.visibility == "shared"
        if not (is_owned or is_shared):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return recipe


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe: RecipeCreate) -> Recipe:
    """Create a new recipe manually.

    Recipe will be owned by the user's household.
    """
    household_id = _require_household(user)
    return recipe_storage.save_recipe(recipe, household_id=household_id, created_by=user.email)


@router.post("/scrape", status_code=status.HTTP_201_CREATED)
async def scrape_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    request: RecipeScrapeRequest,
    *,
    enhance: Annotated[bool, Query(description="Enhance recipe with AI after scraping")] = False,
) -> Recipe:
    """Scrape a recipe from a URL and save it.

    This endpoint proxies to the scrape Cloud Function for isolation.
    If enhance=true, the recipe will be enhanced with AI after scraping.
    Recipe will be owned by the user's household.
    """
    household_id = _require_household(user)
    url = str(request.url)

    # Check if recipe already exists
    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )

    # Call the scrape function
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(_get_scrape_url(), json={"url": url})

            if response.status_code == _HTTP_422:
                raise HTTPException(status_code=_HTTP_422, detail=f"Failed to scrape recipe from {url}")

            response.raise_for_status()
            scraped_data = response.json()
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Scraping request timed out") from e
    except httpx.HTTPStatusError as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Scraping service error: {e.response.text}"
        ) from e
    except httpx.RequestError as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Scraping service unavailable: {e!s}"
        ) from e

    recipe_create = build_recipe_create_from_scraped(scraped_data)
    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)

    if enhance:  # pragma: no cover
        saved_recipe = _try_enhance(saved_recipe, household_id=household_id, created_by=user.email)

    return saved_recipe


@router.post("/parse", status_code=status.HTTP_201_CREATED)
async def parse_recipe(  # pragma: no cover
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    request: RecipeParseRequest,
    *,
    enhance: Annotated[bool, Query(description="Enhance recipe with AI after parsing")] = False,
) -> Recipe:
    """Parse a recipe from client-provided HTML and save it.

    This endpoint is used for client-side scraping where the mobile app fetches
    the HTML directly (avoiding cloud IP blocking issues) and sends it to the API.
    Recipe will be owned by the user's household.
    """
    household_id = _require_household(user)
    url = str(request.url)
    html = request.html
    logger.info("[parse_recipe] Received request for URL: %s, HTML length: %d", url, len(html))

    # Check if recipe already exists
    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )

    # Call the scrape function with HTML
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(_get_scrape_url(), json={"url": url, "html": html})

            if response.status_code == _HTTP_422:
                raise HTTPException(status_code=_HTTP_422, detail=f"Failed to parse recipe from {url}")

            response.raise_for_status()
            scraped_data = response.json()
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Parsing request timed out") from e
    except httpx.HTTPStatusError as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Parsing service error: {e.response.text}"
        ) from e
    except httpx.RequestError as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Parsing service unavailable: {e!s}"
        ) from e

    recipe_create = build_recipe_create_from_scraped(scraped_data)
    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)

    if enhance:  # pragma: no cover
        saved_recipe = _try_enhance(saved_recipe, household_id=household_id, created_by=user.email)

    return saved_recipe


@router.put("/{recipe_id}")
async def update_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, updates: RecipeUpdate
) -> Recipe:
    """Update an existing recipe.

    Users can only update recipes they own (same household).
    """
    household_id = _require_household(user)
    recipe = recipe_storage.update_recipe(recipe_id, updates, household_id=household_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> None:
    """Delete a recipe.

    Users can only delete recipes they own (same household).
    """
    household_id = _require_household(user)
    if not recipe_storage.delete_recipe(recipe_id, household_id=household_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")


@router.post("/{recipe_id}/image", status_code=status.HTTP_200_OK)
async def upload_recipe_image(  # pragma: no cover
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    file: Annotated[UploadFile, File(description="Image file to upload")],
) -> Recipe:
    """Upload an image for a recipe and update the recipe's image_url.

    Users can only upload images for recipes they own (same household).

    The image is automatically resized to a thumbnail (max 800x600) and
    converted to JPEG for optimal storage and loading performance.
    """
    household_id = _require_household(user)

    # Verify recipe exists and user owns it
    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check ownership (must own the recipe to upload image)
    # Legacy/shared recipes cannot have images uploaded - must copy first
    if recipe.household_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload image for shared/legacy recipe. Please copy the recipe to your household first.",
        )
    if recipe.household_id != household_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image (JPEG, PNG, etc.)")

    # Read and validate file size before processing
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    # Create thumbnail (always JPEG)
    try:
        thumbnail_data, thumbnail_content_type = create_thumbnail(content)
        logger.info(
            "Created thumbnail for recipe %s: %d bytes -> %d bytes", recipe_id, len(content), len(thumbnail_data)
        )
    except Exception as e:
        logger.exception("Failed to create thumbnail for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process image. Please ensure it's a valid image file.",
        ) from e

    # Generate unique filename (always .jpg since we convert to JPEG)
    filename = f"recipes/{recipe_id}/{uuid.uuid4()}.jpg"

    # Upload to GCS
    try:  # pragma: no cover
        storage_client = storage.Client()
        bucket = storage_client.bucket(_get_gcs_bucket())
        blob = bucket.blob(filename)
        blob.upload_from_string(thumbnail_data, content_type=thumbnail_content_type)
        image_url = f"https://storage.googleapis.com/{_get_gcs_bucket()}/{filename}"
        logger.info("Uploaded recipe image to GCS: %s", image_url)

    except Exception as e:  # pragma: no cover
        logger.exception("Failed to upload recipe image for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image. Please try again."
        ) from e

    updated_recipe = recipe_storage.update_recipe(
        recipe_id, RecipeUpdate(image_url=image_url), household_id=household_id
    )

    if updated_recipe is None:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update recipe with new image URL"
        )

    return updated_recipe  # pragma: no cover


@router.post("/{recipe_id}/copy", status_code=status.HTTP_201_CREATED)
async def copy_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """
    Create a copy of a shared/legacy recipe for your household.

    This allows users to:
    - Make a private copy of a shared recipe to modify
    - Copy recipes before enhancing them (auto-done by enhance endpoint)

    The copy will be owned by the user's household with visibility="household".
    """
    household_id = _require_household(user)

    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check if already owned by this household
    if recipe.household_id == household_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe already belongs to your household")

    # Must be shared or legacy to copy
    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"
    if not is_shared_or_legacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Create the copy
    copied = recipe_storage.copy_recipe(recipe_id, to_household_id=household_id, copied_by=user.email)

    if copied is None:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy recipe")

    return copied


@router.post("/{recipe_id}/enhance", status_code=status.HTTP_200_OK)
async def enhance_recipe(user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str) -> Recipe:
    """
    Enhance a recipe using AI (Gemini).

    This endpoint improves recipes by:
    - Concretizing vague ingredients (e.g., "1 packet" → "400 g")
    - Optimizing for available kitchen equipment
    - Adapting for dietary preferences (vegetarian alternatives)
    - Replacing HelloFresh spice blends with individual spices

    If the recipe is shared/legacy (not owned by user's household), a copy is created
    first and the copy is enhanced. The original shared recipe remains unchanged.

    **Currently disabled** - Set ENABLE_RECIPE_ENHANCEMENT=true to enable.
    """
    from datetime import UTC, datetime

    household_id = _require_household(user)
    from api.services.recipe_enhancer import (
        EnhancementDisabledError,
        EnhancementError,
        enhance_recipe as do_enhance,
        is_enhancement_enabled,
    )

    # Check if enhancement is enabled
    if not is_enhancement_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recipe enhancement is currently disabled. Set ENABLE_RECIPE_ENHANCEMENT=true to enable.",
        )

    # Get the recipe
    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check if this is a shared/legacy recipe that needs to be copied first
    is_owned = recipe.household_id == household_id
    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"

    if not is_owned and not is_shared_or_legacy:
        # Recipe exists but belongs to another household and is not shared
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # If shared/legacy and not owned, copy first
    target_recipe = recipe
    if not is_owned and is_shared_or_legacy:
        copied = recipe_storage.copy_recipe(recipe_id, to_household_id=household_id, copied_by=user.email)
        if copied is None:  # pragma: no cover
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy recipe before enhancement"
            )
        target_recipe = copied

    try:  # pragma: no cover
        enhanced_data = do_enhance(target_recipe.model_dump())
        enhanced_recipe = build_recipe_create_from_enhanced(enhanced_data, target_recipe)

        return recipe_storage.save_recipe(
            enhanced_recipe,
            recipe_id=target_recipe.id,
            enhancement=EnhancementMetadata(
                enhanced=True, enhanced_at=datetime.now(tz=UTC), changes_made=enhanced_data.get("changes_made") or []
            ),
            household_id=household_id,
            created_by=user.email,
        )

    except EnhancementDisabledError as e:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except EnhancementError as e:  # pragma: no cover
        logger.exception("Failed to enhance recipe_id=%s", recipe_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e
