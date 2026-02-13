"""Recipe API endpoints."""

import logging
import os
import uuid
from dataclasses import dataclass
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from google.cloud import storage

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe import (
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
    EnhancementReviewAction,
    EnhancementReviewRequest,
    PaginatedRecipeList,
    Recipe,
    RecipeCreate,
    RecipeParseRequest,
    RecipePreview,
    RecipeScrapeRequest,
    RecipeUpdate,
)
from api.services.html_fetcher import FetchError, FetchResult, fetch_html
from api.services.image_downloader import download_and_upload_image
from api.services.image_service import create_hero, create_thumbnail
from api.services.prompt_loader import DEFAULT_LANGUAGE
from api.services.recipe_mapper import build_recipe_create_from_enhanced, build_recipe_create_from_scraped
from api.storage import recipe_storage
from api.storage.recipe_queries import count_recipes, get_recipes_paginated
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


def _get_household_config(household_id: str) -> tuple[str, list[str]]:
    """Read the household's language and equipment settings.

    Returns:
        Tuple of (language, equipment_keys).
    """
    from api.storage.household_storage import get_household_settings

    settings = get_household_settings(household_id) or {}
    language = settings.get("language", DEFAULT_LANGUAGE)
    equipment_raw = settings.get("equipment", [])
    equipment = equipment_raw if isinstance(equipment_raw, list) else []
    return language, equipment


def _try_enhance(
    saved_recipe: Recipe,
    *,
    household_id: str,
    created_by: str,
    language: str = DEFAULT_LANGUAGE,
    equipment: list[str] | None = None,
) -> Recipe:  # pragma: no cover
    """Attempt AI enhancement on a saved recipe, returning original on failure."""
    from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance

    try:
        enhanced_data = do_enhance(saved_recipe.model_dump(), language=language, equipment=equipment)
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
    except Exception:
        logger.exception("Unexpected error during enhancement for recipe_id=%s", saved_recipe.id)
        return saved_recipe


async def _ingest_recipe_image(recipe: Recipe, *, household_id: str) -> Recipe:
    """Download external image, upload hero + thumbnail to GCS, and update the recipe.

    If the recipe has no image_url or it already points to our bucket,
    returns the recipe unchanged. Failures are logged but never block
    recipe creation.
    """
    if not recipe.image_url:
        return recipe

    try:
        bucket_name = _get_gcs_bucket()
    except KeyError:
        logger.warning("GCS_BUCKET_NAME not configured — skipping image ingestion for recipe %s", recipe.id)
        return recipe
    result = await download_and_upload_image(recipe.image_url, recipe.id, bucket_name)

    if result is not None:
        updated = recipe_storage.update_recipe(
            recipe.id,
            RecipeUpdate(image_url=result.hero_url, thumbnail_url=result.thumbnail_url),
            household_id=household_id,
        )
        if updated:
            return updated
        logger.warning("Failed to update image URLs for recipe %s", recipe.id)

    return recipe


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
    household_id = require_household(user)
    return recipe_storage.save_recipe(recipe, household_id=household_id, created_by=user.email)


@router.post("/preview", status_code=status.HTTP_200_OK)
async def preview_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    request: RecipeParseRequest,
    *,
    enhance: Annotated[bool, Query(description="Include AI-enhanced version")] = False,
) -> RecipePreview:
    """Preview a scraped recipe without saving it.

    Parses the recipe from client-provided HTML and returns a preview.
    Optionally includes an AI-enhanced version for comparison.
    The client can then POST to /recipes to save the chosen version.
    """
    household_id = require_household(user)
    url = str(request.url)
    html = request.html
    logger.info("[preview_recipe] Received request for URL: %s, HTML length: %d", url, len(html))

    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )

    parse_result = await _send_html_to_cloud_function(url, html)

    if isinstance(parse_result, _ParseError):
        raise HTTPException(
            status_code=_HTTP_422, detail={"message": parse_result.message, "reason": parse_result.reason}
        )

    if parse_result is None:
        raise HTTPException(status_code=_HTTP_422, detail=f"Failed to parse recipe from {url}")

    scraped_data = parse_result
    original_create = build_recipe_create_from_scraped(scraped_data)
    image_url = original_create.image_url

    enhanced_create = None
    changes_made: list[str] = []

    if enhance:
        language, equipment = _get_household_config(household_id)
        enhanced_data = _try_enhance_preview(original_create, language=language, equipment=equipment)
        if enhanced_data is not None:
            enhanced_create = enhanced_data["recipe"]
            changes_made = enhanced_data.get("changes_made", [])

    return RecipePreview(
        original=original_create, enhanced=enhanced_create, changes_made=changes_made, image_url=image_url
    )


def _try_enhance_preview(
    recipe_create: RecipeCreate, *, language: str = DEFAULT_LANGUAGE, equipment: list[str] | None = None
) -> dict | None:
    """Attempt AI enhancement for preview mode, returning None on failure."""
    from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance

    try:
        recipe_dict = recipe_create.model_dump()
        enhanced_data = do_enhance(recipe_dict, language=language, equipment=equipment)
        enhanced_create = build_recipe_create_from_enhanced(enhanced_data, recipe_create)
        return {"recipe": enhanced_create, "changes_made": enhanced_data.get("changes_made", [])}
    except EnhancementError as e:
        logger.warning("Enhancement preview failed: %s", e)
        return None
    except Exception:
        logger.exception("Unexpected error during enhancement preview")
        return None


@router.post("/scrape", status_code=status.HTTP_201_CREATED)
async def scrape_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    request: RecipeScrapeRequest,
    *,
    enhance: Annotated[bool, Query(description="Enhance recipe with AI after scraping")] = False,
) -> Recipe:
    """Scrape a recipe from a URL and save it.

    Uses a two-tier strategy to handle sites that block cloud IPs:
    1. API fetches HTML server-side, sends to Cloud Function for parsing
    2. Falls back to Cloud Function server-side scraping if API fetch fails

    If enhance=true, the recipe will be enhanced with AI after scraping.
    Recipe will be owned by the user's household.
    """
    household_id = require_household(user)
    url = str(request.url)

    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )

    scraped_data = await _scrape_with_fallback(url)

    recipe_create = build_recipe_create_from_scraped(scraped_data)
    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)
    saved_recipe = await _ingest_recipe_image(saved_recipe, household_id=household_id)

    if enhance:  # pragma: no cover
        language, equipment = _get_household_config(household_id)
        saved_recipe = _try_enhance(
            saved_recipe, household_id=household_id, created_by=user.email, language=language, equipment=equipment
        )

    return saved_recipe


async def _scrape_with_fallback(url: str) -> dict:
    """Try API-side HTML fetch + parse, falling back to Cloud Function scrape.

    Returns scraped recipe data dict on success, raises HTTPException on failure.
    """
    fetch_result = await fetch_html(url)

    if isinstance(fetch_result, FetchError) and fetch_result.reason == "security":
        raise HTTPException(status_code=_HTTP_422, detail={"message": fetch_result.message, "reason": "security"})

    if isinstance(fetch_result, FetchResult):
        effective_url = fetch_result.final_url
        logger.info("API-side fetch succeeded for %s, sending to Cloud Function for parsing", effective_url)
        parse_result = await _send_html_to_cloud_function(effective_url, fetch_result.html)

        if isinstance(parse_result, dict):
            return parse_result

        if isinstance(parse_result, _ParseError) and parse_result.reason in {"not_supported", "blocked"}:
            raise HTTPException(
                status_code=_HTTP_422, detail={"message": parse_result.message, "reason": parse_result.reason}
            )

        logger.warning("Cloud Function parse failed after API fetch for %s, trying full scrape", effective_url)

    return await _cloud_function_scrape(url)


@dataclass
class _ParseError:
    """Cloud Function parse error with reason detail."""

    reason: str
    message: str


async def _send_html_to_cloud_function(url: str, html: str) -> dict | _ParseError | None:
    """Send pre-fetched HTML to Cloud Function for parsing.

    Returns parsed recipe dict on success, _ParseError with reason on
    structured failure, or None on unexpected/network errors.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(_get_scrape_url(), json={"url": url, "html": html})

            if response.status_code == _HTTP_422:
                error_data = (
                    response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                )
                return _ParseError(
                    reason=error_data.get("reason", "parse_failed"),
                    message=error_data.get("error", f"Failed to parse recipe from {url}"),
                )

            response.raise_for_status()
            return response.json()
    except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError) as e:
        logger.warning("Cloud Function parse call failed for %s: %s", url, e)
        return None


async def _cloud_function_scrape(url: str) -> dict:
    """Delegate full scraping to the Cloud Function (last resort).

    Returns scraped data dict on success, raises HTTPException on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(_get_scrape_url(), json={"url": url})

            if response.status_code in {_HTTP_422, 403}:
                error_data = (
                    response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                )
                reason = error_data.get("reason", "parse_failed")
                error_msg = error_data.get("error", f"Failed to scrape recipe from {url}")

                if reason in {"blocked", "not_supported"}:
                    raise HTTPException(status_code=_HTTP_422, detail={"message": error_msg, "reason": reason})
                raise HTTPException(status_code=_HTTP_422, detail=error_msg)

            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Scraping request timed out") from e
    except httpx.HTTPStatusError as e:  # pragma: no cover
        logger.exception("Scraping service error for %s", url)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Scraping service returned an error") from e
    except httpx.RequestError as e:  # pragma: no cover
        logger.exception("Scraping service unavailable for %s", url)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Scraping service unavailable"
        ) from e


@router.post("/parse", status_code=status.HTTP_201_CREATED)
async def parse_recipe(
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
    household_id = require_household(user)
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

    parse_result = await _send_html_to_cloud_function(url, html)

    if isinstance(parse_result, _ParseError):
        raise HTTPException(
            status_code=_HTTP_422, detail={"message": parse_result.message, "reason": parse_result.reason}
        )

    if parse_result is None:
        raise HTTPException(status_code=_HTTP_422, detail=f"Failed to parse recipe from {url}")

    scraped_data = parse_result

    recipe_create = build_recipe_create_from_scraped(scraped_data)
    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)
    saved_recipe = await _ingest_recipe_image(saved_recipe, household_id=household_id)

    if enhance:  # pragma: no cover
        language, equipment = _get_household_config(household_id)
        saved_recipe = _try_enhance(
            saved_recipe, household_id=household_id, created_by=user.email, language=language, equipment=equipment
        )

    return saved_recipe


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


@router.post("/{recipe_id}/image", status_code=status.HTTP_200_OK)
async def upload_recipe_image(  # pragma: no cover
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    file: Annotated[UploadFile, File(description="Image file to upload")],
) -> Recipe:
    """Upload an image for a recipe and update the recipe's image_url and thumbnail_url.

    Users can only upload images for recipes they own (same household).

    The image is automatically resized to two sizes:
    - Hero (max 800x600) for the recipe detail screen
    - Thumbnail (max 400x300) for cards and lists

    Both are converted to JPEG for optimal storage and loading performance.
    """
    household_id = require_household(user)

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

    # Create hero and thumbnail (always JPEG)
    try:
        hero_data, hero_content_type = create_hero(content)
        thumbnail_data, _ = create_thumbnail(content)
        logger.info(
            "Created images for recipe %s: %d bytes -> hero %d bytes, thumb %d bytes",
            recipe_id,
            len(content),
            len(hero_data),
            len(thumbnail_data),
        )
    except Exception as e:
        logger.exception("Failed to create images for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process image. Please ensure it's a valid image file.",
        ) from e

    # Generate unique filenames (always .jpg since we convert to JPEG)
    image_id = uuid.uuid4()
    hero_filename = f"recipes/{recipe_id}/{image_id}_hero.jpg"
    thumb_filename = f"recipes/{recipe_id}/{image_id}_thumb.jpg"

    # Upload both sizes to GCS
    try:  # pragma: no cover
        storage_client = storage.Client()
        bucket = storage_client.bucket(_get_gcs_bucket())

        hero_blob = bucket.blob(hero_filename)
        hero_blob.upload_from_string(hero_data, content_type=hero_content_type)

        thumb_blob = bucket.blob(thumb_filename)
        thumb_blob.upload_from_string(thumbnail_data, content_type="image/jpeg")

        image_url = f"https://storage.googleapis.com/{_get_gcs_bucket()}/{hero_filename}"
        thumbnail_url = f"https://storage.googleapis.com/{_get_gcs_bucket()}/{thumb_filename}"
        logger.info("Uploaded recipe images to GCS: hero=%s, thumb=%s", image_url, thumbnail_url)

    except Exception as e:  # pragma: no cover
        logger.exception("Failed to upload recipe images for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image. Please try again."
        ) from e

    updated_recipe = recipe_storage.update_recipe(
        recipe_id, RecipeUpdate(image_url=image_url, thumbnail_url=thumbnail_url), household_id=household_id
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
    household_id = require_household(user)

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
    """
    from datetime import UTC, datetime

    household_id = require_household(user)
    from api.services.recipe_enhancer import EnhancementConfigError, EnhancementError, enhance_recipe as do_enhance

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

    language, equipment = _get_household_config(household_id)

    try:  # pragma: no cover
        enhanced_data = do_enhance(target_recipe.model_dump(), language=language, equipment=equipment)
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

    except EnhancementConfigError as e:  # pragma: no cover
        logger.warning("Enhancement unavailable for recipe_id=%s: %s", recipe_id, e)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    except EnhancementError as e:  # pragma: no cover
        logger.exception("Failed to enhance recipe_id=%s", recipe_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Enhancement failed") from e

    except Exception as e:  # pragma: no cover
        logger.exception("Unexpected error enhancing recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Enhancement failed due to an unexpected error"
        ) from e


@router.post("/{recipe_id}/enhancement/review", status_code=status.HTTP_200_OK)
async def review_enhancement(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, request: EnhancementReviewRequest
) -> Recipe:
    """
    Review an AI-enhanced recipe - approve or reject the enhancement.

    - **approve**: Accept the enhancement, show enhanced version going forward
    - **reject**: Keep original, enhanced data preserved for potential future use

    Only works for enhanced recipes that belong to the user's household.
    """
    household_id = require_household(user)

    approve = request.action == EnhancementReviewAction.APPROVE
    result = recipe_storage.review_enhancement(recipe_id, approve=approve, household_id=household_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found, not enhanced, or not owned by your household",
        )

    return result
