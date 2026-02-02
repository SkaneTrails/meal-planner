"""Recipe API endpoints."""

import logging
import os
import uuid
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from google.cloud import storage

from api.auth.firebase import require_auth
from api.models.recipe import Recipe, RecipeCreate, RecipeParseRequest, RecipeScrapeRequest, RecipeUpdate
from api.storage import recipe_storage
from api.storage.firestore_client import DEFAULT_DATABASE, ENHANCED_DATABASE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["recipes"], dependencies=[Depends(require_auth)])

# URL for the scrape Cloud Function (local or production)
SCRAPE_FUNCTION_URL = os.getenv("SCRAPE_FUNCTION_URL", "http://localhost:8001")

# Google Cloud Storage bucket for recipe images
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "meal-planner-recipe-images")

# Maximum file size for image uploads (10 MB)
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

# HTTP status code for unprocessable content (renamed in HTTP spec)
_HTTP_422 = 422  # Used to avoid deprecated HTTP_422_UNPROCESSABLE_ENTITY constant


@router.get("")
async def list_recipes(
    search: Annotated[str | None, Query(description="Search recipes by title")] = None,
    *,
    include_duplicates: Annotated[bool, Query(description="Include duplicate URLs")] = False,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> list[Recipe]:
    """Get all recipes, optionally filtered by search query."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    if search:
        return recipe_storage.search_recipes(search, database=database)
    return recipe_storage.get_all_recipes(include_duplicates=include_duplicates, database=database)


@router.get("/{recipe_id}")
async def get_recipe(
    recipe_id: str, *, enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False
) -> Recipe:
    """Get a single recipe by ID."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    recipe = recipe_storage.get_recipe(recipe_id, database=database)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_recipe(recipe: RecipeCreate) -> Recipe:
    """Create a new recipe manually."""
    return recipe_storage.save_recipe(recipe)


@router.post("/scrape", status_code=status.HTTP_201_CREATED)
async def scrape_recipe(
    request: RecipeScrapeRequest,
    *,
    enhance: Annotated[bool, Query(description="Enhance recipe with AI after scraping")] = False,
) -> Recipe:
    """Scrape a recipe from a URL and save it.

    This endpoint proxies to the scrape Cloud Function for isolation.
    If enhance=true, the recipe will be enhanced with AI after scraping.
    """
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
            response = await client.post(SCRAPE_FUNCTION_URL, json={"url": url})

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

    # Create recipe from scraped data
    recipe_create = RecipeCreate(
        title=scraped_data["title"],
        url=scraped_data["url"],
        ingredients=scraped_data.get("ingredients", []),
        instructions=scraped_data.get("instructions", []),
        image_url=scraped_data.get("image_url"),
        servings=scraped_data.get("servings"),
        prep_time=scraped_data.get("prep_time"),
        cook_time=scraped_data.get("cook_time"),
        total_time=scraped_data.get("total_time"),
    )

    saved_recipe = recipe_storage.save_recipe(recipe_create)

    # If enhancement requested, enhance the recipe
    if enhance:  # pragma: no cover
        from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance, is_enhancement_enabled

        if is_enhancement_enabled():
            try:
                enhanced_data = do_enhance(saved_recipe.model_dump())

                # Save enhanced version to enhanced database with same ID
                enhanced_create = RecipeCreate(
                    title=enhanced_data.get("title", saved_recipe.title),
                    url=enhanced_data.get("url", saved_recipe.url),
                    ingredients=enhanced_data.get("ingredients", saved_recipe.ingredients),
                    instructions=enhanced_data.get("instructions", saved_recipe.instructions),
                    image_url=enhanced_data.get("image_url", saved_recipe.image_url),
                    servings=enhanced_data.get("servings", saved_recipe.servings),
                    prep_time=enhanced_data.get("prep_time", saved_recipe.prep_time),
                    cook_time=enhanced_data.get("cook_time", saved_recipe.cook_time),
                    total_time=enhanced_data.get("total_time", saved_recipe.total_time),
                    cuisine=enhanced_data.get("cuisine"),
                    category=enhanced_data.get("category"),
                    tags=enhanced_data.get("tags", []),
                    tips=enhanced_data.get("tips"),
                )

                # Save to enhanced database and return with changes_made
                return recipe_storage.save_recipe(
                    enhanced_create,
                    recipe_id=saved_recipe.id,
                    database=ENHANCED_DATABASE,
                    improved=True,
                    original_id=saved_recipe.id,
                    changes_made=enhanced_data.get("changes_made", []),
                )

            except EnhancementError as e:
                # Log but don't fail - return the unenhanced recipe
                logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)

    return saved_recipe


@router.post("/parse", status_code=status.HTTP_201_CREATED)
async def parse_recipe(  # pragma: no cover
    request: RecipeParseRequest,
    *,
    enhance: Annotated[bool, Query(description="Enhance recipe with AI after parsing")] = False,
) -> Recipe:
    """Parse a recipe from client-provided HTML and save it.

    This endpoint is used for client-side scraping where the mobile app fetches
    the HTML directly (avoiding cloud IP blocking issues) and sends it to the API.
    """
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
            response = await client.post(SCRAPE_FUNCTION_URL, json={"url": url, "html": html})

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

    # Create recipe from parsed data
    recipe_create = RecipeCreate(
        title=scraped_data["title"],
        url=scraped_data["url"],
        ingredients=scraped_data.get("ingredients", []),
        instructions=scraped_data.get("instructions", []),
        image_url=scraped_data.get("image_url"),
        servings=scraped_data.get("servings"),
        prep_time=scraped_data.get("prep_time"),
        cook_time=scraped_data.get("cook_time"),
        total_time=scraped_data.get("total_time"),
    )

    saved_recipe = recipe_storage.save_recipe(recipe_create)

    # If enhancement requested, enhance the recipe
    if enhance:  # pragma: no cover
        from api.services.recipe_enhancer import EnhancementError, enhance_recipe as do_enhance, is_enhancement_enabled

        if is_enhancement_enabled():
            try:
                enhanced_data = do_enhance(saved_recipe.model_dump())

                # Save enhanced version to enhanced database with same ID
                enhanced_create = RecipeCreate(
                    title=enhanced_data.get("title", saved_recipe.title),
                    url=enhanced_data.get("url", saved_recipe.url),
                    ingredients=enhanced_data.get("ingredients", saved_recipe.ingredients),
                    instructions=enhanced_data.get("instructions", saved_recipe.instructions),
                    image_url=enhanced_data.get("image_url", saved_recipe.image_url),
                    servings=enhanced_data.get("servings", saved_recipe.servings),
                    prep_time=enhanced_data.get("prep_time", saved_recipe.prep_time),
                    cook_time=enhanced_data.get("cook_time", saved_recipe.cook_time),
                    total_time=enhanced_data.get("total_time", saved_recipe.total_time),
                    cuisine=enhanced_data.get("cuisine"),
                    category=enhanced_data.get("category"),
                    tags=enhanced_data.get("tags", []),
                    tips=enhanced_data.get("tips"),
                )

                # Save to enhanced database and return with changes_made
                return recipe_storage.save_recipe(
                    enhanced_create,
                    recipe_id=saved_recipe.id,
                    database=ENHANCED_DATABASE,
                    improved=True,
                    original_id=saved_recipe.id,
                    changes_made=enhanced_data.get("changes_made", []),
                )

            except EnhancementError as e:
                # Log but don't fail - return the unenhanced recipe
                logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)

    return saved_recipe


@router.put("/{recipe_id}")
async def update_recipe(
    recipe_id: str,
    updates: RecipeUpdate,
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> Recipe:
    """Update an existing recipe."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    recipe = recipe_storage.update_recipe(recipe_id, updates, database=database)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str, *, enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False
) -> None:
    """Delete a recipe."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    if not recipe_storage.delete_recipe(recipe_id, database=database):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")


@router.post("/{recipe_id}/image", status_code=status.HTTP_200_OK)
async def upload_recipe_image(  # pragma: no cover
    recipe_id: str,
    file: Annotated[UploadFile, File(description="Image file to upload")],
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> Recipe:
    """Upload an image for a recipe and update the recipe's image_url."""
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE

    # Verify recipe exists
    recipe = recipe_storage.get_recipe(recipe_id, database=database)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image (JPEG, PNG, etc.)")

    # Generate unique filename
    ext = content_type.split("/")[-1] if "/" in content_type else "jpg"
    if ext == "jpeg":
        ext = "jpg"
    filename = f"recipes/{recipe_id}/{uuid.uuid4()}.{ext}"

    # Read and validate file size before trying to upload
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    try:  # pragma: no cover
        # Upload to Google Cloud Storage
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=content_type)

        # Make publicly accessible
        blob.make_public()

        # Get public URL
        image_url = blob.public_url

    except Exception as e:  # pragma: no cover
        logger.exception("Failed to upload recipe image for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image. Please try again."
        ) from e

    # Update recipe with new image URL (outside try block - separate concern)
    from api.models.recipe import RecipeUpdate as RecipeUpdateModel

    updated_recipe = recipe_storage.update_recipe(recipe_id, RecipeUpdateModel(image_url=image_url), database=database)

    if updated_recipe is None:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update recipe with new image URL"
        )

    return updated_recipe  # pragma: no cover


@router.post("/{recipe_id}/enhance", status_code=status.HTTP_200_OK)
async def enhance_recipe(recipe_id: str) -> Recipe:
    """
    Enhance a recipe using AI (Gemini).

    This endpoint improves recipes by:
    - Concretizing vague ingredients (e.g., "1 packet" → "400 g")
    - Optimizing for available kitchen equipment
    - Adapting for dietary preferences (vegetarian alternatives)
    - Replacing HelloFresh spice blends with individual spices

    **Currently disabled** - Set ENABLE_RECIPE_ENHANCEMENT=true to enable.
    """
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

    # Get the original recipe
    recipe = recipe_storage.get_recipe(recipe_id, database=DEFAULT_DATABASE)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Enhance the recipe
    try:  # pragma: no cover
        enhanced_data = do_enhance(recipe.model_dump())

        # Save to enhanced database
        from api.models.recipe import RecipeCreate

        enhanced_recipe = RecipeCreate(
            title=enhanced_data.get("title", recipe.title),
            url=enhanced_data.get("url", recipe.url),
            ingredients=enhanced_data.get("ingredients", recipe.ingredients),
            instructions=enhanced_data.get("instructions", recipe.instructions),
            image_url=enhanced_data.get("image_url", recipe.image_url),
            servings=enhanced_data.get("servings", recipe.servings),
            prep_time=enhanced_data.get("prep_time", recipe.prep_time),
            cook_time=enhanced_data.get("cook_time", recipe.cook_time),
            total_time=enhanced_data.get("total_time", recipe.total_time),
            cuisine=enhanced_data.get("cuisine"),
            category=enhanced_data.get("category"),
            tags=enhanced_data.get("tags", []),
            tips=enhanced_data.get("tips"),
        )

        # Save with same ID to enhanced database
        return recipe_storage.save_recipe(enhanced_recipe, recipe_id=recipe_id, database=ENHANCED_DATABASE)

    except EnhancementDisabledError as e:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except EnhancementError as e:  # pragma: no cover
        logger.exception("Failed to enhance recipe_id=%s", recipe_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e
