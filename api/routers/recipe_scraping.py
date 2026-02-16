"""Recipe scraping and parsing endpoints.

Handles importing recipes from URLs via scraping or client-provided HTML.
Both /scrape and /parse share a common pipeline for dedup, save, image
ingestion, and optional AI enhancement.
"""

import logging
from dataclasses import dataclass
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe import (
    Recipe,
    RecipeCreate,
    RecipeParseRequest,
    RecipePreview,
    RecipePreviewRequest,
    RecipeScrapeRequest,
    SavePreviewRequest,
)
from api.routers.recipe_enhancement import _get_household_config, _try_enhance, _try_enhance_preview
from api.routers.recipe_images import ingest_recipe_image
from api.services.html_fetcher import FetchError, FetchResult, fetch_html
from api.services.recipe_mapper import build_recipe_create_from_scraped
from api.storage import recipe_storage
from api.storage.recipe_storage import EnhancementMetadata

logger = logging.getLogger(__name__)

router = APIRouter()

_HTTP_422 = 422


def _get_scrape_url() -> str:
    """Get scrape Cloud Function URL (read on first use, not import time)."""
    import os

    return os.environ["SCRAPE_FUNCTION_URL"]


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
    except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError) as e:  # pragma: no cover
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

        logger.warning(
            "Cloud Function parse failed after API fetch for %s, trying full scrape", effective_url
        )  # pragma: no cover

    return await _cloud_function_scrape(url)


def _check_duplicate_url(url: str) -> None:
    """Raise 409 if a recipe with this URL already exists."""
    existing = recipe_storage.find_recipe_by_url(url)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Recipe from this URL already exists", "recipe_id": existing.id},
        )


async def _parse_html_or_raise(url: str, html: str) -> dict:
    """Parse HTML via the Cloud Function and raise on failure.

    Returns scraped data dict on success, raises HTTPException on
    parse errors or None responses.
    """
    parse_result = await _send_html_to_cloud_function(url, html)

    if isinstance(parse_result, _ParseError):
        raise HTTPException(
            status_code=_HTTP_422, detail={"message": parse_result.message, "reason": parse_result.reason}
        )

    if parse_result is None:
        raise HTTPException(status_code=_HTTP_422, detail=f"Failed to parse recipe from {url}")

    return parse_result


async def _save_and_process_recipe(scraped_data: dict, *, household_id: str, created_by: str, enhance: bool) -> Recipe:
    """Shared pipeline: build RecipeCreate, save, ingest image, optionally enhance.

    Used by both /scrape and /parse endpoints to eliminate duplication.
    """
    recipe_create = build_recipe_create_from_scraped(scraped_data)
    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=created_by)
    saved_recipe = await ingest_recipe_image(saved_recipe, household_id=household_id)

    if enhance:  # pragma: no cover
        config = _get_household_config(household_id)
        saved_recipe = _try_enhance(saved_recipe, household_id=household_id, created_by=created_by, config=config)

    return saved_recipe


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

    _check_duplicate_url(url)
    scraped_data = await _scrape_with_fallback(url)

    return await _save_and_process_recipe(
        scraped_data, household_id=household_id, created_by=user.email, enhance=enhance
    )


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

    _check_duplicate_url(url)
    scraped_data = await _parse_html_or_raise(url, html)

    return await _save_and_process_recipe(
        scraped_data, household_id=household_id, created_by=user.email, enhance=enhance
    )


@router.post("/preview", status_code=status.HTTP_200_OK)
async def preview_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    request: RecipePreviewRequest,
    *,
    enhance: Annotated[bool, Query(description="Include AI-enhanced version")] = False,
) -> RecipePreview:
    """Preview a scraped recipe without saving it.

    Parses the recipe from client-provided HTML (or server-side scraping if
    no HTML is provided) and returns a preview. Optionally includes an
    AI-enhanced version for comparison.
    The client can then POST to /recipes to save the chosen version.
    """
    household_id = require_household(user)
    url = str(request.url)

    _check_duplicate_url(url)

    if request.html is not None:
        logger.info("[preview_recipe] Received HTML for URL: %s, HTML length: %d", url, len(request.html))
        scraped_data = await _parse_html_or_raise(url, request.html)
    else:
        logger.info("[preview_recipe] No HTML provided, scraping server-side for URL: %s", url)
        scraped_data = await _scrape_with_fallback(url)

    original_create = build_recipe_create_from_scraped(scraped_data)
    image_url = original_create.image_url

    enhanced_create = None
    changes_made: list[str] = []

    if enhance:  # pragma: no cover
        config = _get_household_config(household_id)
        enhanced_data = _try_enhance_preview(original_create, config=config)
        if enhanced_data is not None:
            enhanced_create = enhanced_data["recipe"]
            changes_made = enhanced_data.get("changes_made", [])

    return RecipePreview(
        original=original_create, enhanced=enhanced_create, changes_made=changes_made, image_url=image_url
    )


@router.post("/save-preview", status_code=status.HTTP_201_CREATED)
async def save_preview(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], request: SavePreviewRequest
) -> Recipe:
    """Save a recipe from a previously previewed result.

    The client picks a version (original or enhanced) and can override
    diet_label and meal_label before saving. Image ingestion runs
    automatically after save.
    """
    household_id = require_household(user)
    preview = request.preview
    chose_enhanced = request.version == "enhanced" and preview.enhanced is not None

    recipe_to_save: RecipeCreate = (
        preview.enhanced if chose_enhanced and preview.enhanced is not None else preview.original
    )

    if request.diet_label is not None:
        recipe_to_save = recipe_to_save.model_copy(update={"diet_label": request.diet_label})
    if request.meal_label is not None:
        recipe_to_save = recipe_to_save.model_copy(update={"meal_label": request.meal_label})

    enhancement = EnhancementMetadata()
    if chose_enhanced:
        enhancement = EnhancementMetadata(
            enhanced=True, show_enhanced=True, enhancement_reviewed=True, changes_made=preview.changes_made
        )

    saved = recipe_storage.save_recipe(
        recipe_to_save, enhancement=enhancement, household_id=household_id, created_by=user.email
    )
    return await ingest_recipe_image(saved, household_id=household_id)
