"""Recipe API endpoints."""

import io
import logging
import os
import uuid
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from google.cloud import storage
from PIL import Image

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
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

# Thumbnail settings - optimized for recipe cards
THUMBNAIL_MAX_WIDTH = 800
THUMBNAIL_MAX_HEIGHT = 600
THUMBNAIL_QUALITY = 85  # JPEG quality (1-100)

# HTTP status code for unprocessable content (renamed in HTTP spec)
_HTTP_422 = 422  # Used to avoid deprecated HTTP_422_UNPROCESSABLE_ENTITY constant


def _create_thumbnail(image_data: bytes) -> tuple[bytes, str]:
    """
    Create a thumbnail from image data.

    Returns tuple of (thumbnail_bytes, content_type).
    Always outputs JPEG for smaller file size.
    """
    img = Image.open(io.BytesIO(image_data))

    # Convert to RGB if necessary (handles PNG with transparency, etc.)
    if img.mode in ("RGBA", "P", "LA"):
        # Create white background for transparent images
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Calculate new size maintaining aspect ratio
    width, height = img.size
    ratio = min(THUMBNAIL_MAX_WIDTH / width, THUMBNAIL_MAX_HEIGHT / height)

    if ratio < 1:  # Only resize if image is larger than max dimensions
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Save as JPEG
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=THUMBNAIL_QUALITY, optimize=True)
    output.seek(0)

    return output.getvalue(), "image/jpeg"


def _require_household(user: AuthenticatedUser) -> str:
    """Require user to have a household, return household_id."""
    if not user.household_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to create/edit recipes"
        )
    return user.household_id


@router.get("")
async def list_recipes(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    search: Annotated[str | None, Query(description="Search recipes by title")] = None,
    *,
    include_duplicates: Annotated[bool, Query(description="Include duplicate URLs")] = False,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> list[Recipe]:
    """Get all recipes visible to the user's household.

    Returns recipes owned by the household, shared recipes, and legacy recipes (no household).
    """
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    # Filter by household if user has one, otherwise show all (for superusers without household)
    household_id = user.household_id
    if search:
        return recipe_storage.search_recipes(search, database=database, household_id=household_id)
    return recipe_storage.get_all_recipes(
        include_duplicates=include_duplicates, database=database, household_id=household_id
    )


@router.get("/{recipe_id}")
async def get_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> Recipe:
    """Get a single recipe by ID.

    Users can view recipes they own, shared recipes, or legacy recipes.
    """
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    recipe = recipe_storage.get_recipe(recipe_id, database=database)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check visibility: owned, shared, or legacy
    household_id = user.household_id
    if household_id is not None:
        is_owned = recipe.household_id == household_id
        is_shared = recipe.visibility == "shared"
        is_legacy = recipe.household_id is None
        if not (is_owned or is_shared or is_legacy):
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

    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)

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
                    enhanced=True,
                    enhanced_from=saved_recipe.id,
                    changes_made=enhanced_data.get("changes_made", []),
                    household_id=household_id,
                    created_by=user.email,
                )

            except EnhancementError as e:
                # Log but don't fail - return the unenhanced recipe
                logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)

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

    saved_recipe = recipe_storage.save_recipe(recipe_create, household_id=household_id, created_by=user.email)

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
                    enhanced=True,
                    enhanced_from=saved_recipe.id,
                    changes_made=enhanced_data.get("changes_made", []),
                    household_id=household_id,
                    created_by=user.email,
                )

            except EnhancementError as e:
                # Log but don't fail - return the unenhanced recipe
                logger.warning("Enhancement failed for recipe_id=%s: %s", saved_recipe.id, e)

    return saved_recipe


@router.put("/{recipe_id}")
async def update_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    updates: RecipeUpdate,
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> Recipe:
    """Update an existing recipe.

    Users can only update recipes they own (same household).
    """
    household_id = _require_household(user)
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    recipe = recipe_storage.update_recipe(recipe_id, updates, database=database, household_id=household_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> None:
    """Delete a recipe.

    Users can only delete recipes they own (same household).
    """
    household_id = _require_household(user)
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE
    if not recipe_storage.delete_recipe(recipe_id, database=database, household_id=household_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")


@router.post("/{recipe_id}/image", status_code=status.HTTP_200_OK)
async def upload_recipe_image(  # pragma: no cover
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    file: Annotated[UploadFile, File(description="Image file to upload")],
    *,
    enhanced: Annotated[bool, Query(description="Use AI-enhanced recipes database")] = False,
) -> Recipe:
    """Upload an image for a recipe and update the recipe's image_url.

    Users can only upload images for recipes they own (same household).

    The image is automatically resized to a thumbnail (max 800x600) and
    converted to JPEG for optimal storage and loading performance.
    """
    household_id = _require_household(user)
    database = ENHANCED_DATABASE if enhanced else DEFAULT_DATABASE

    # Verify recipe exists and user owns it
    recipe = recipe_storage.get_recipe(recipe_id, database=database)
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
        thumbnail_data, thumbnail_content_type = _create_thumbnail(content)
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
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(filename)
        blob.upload_from_string(thumbnail_data, content_type=thumbnail_content_type)
        blob.make_public()
        image_url = blob.public_url
        logger.info("Uploaded recipe image to GCS: %s", image_url)

    except Exception as e:  # pragma: no cover
        logger.exception("Failed to upload recipe image for recipe_id=%s", recipe_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image. Please try again."
        ) from e

    # Update recipe with new image URL
    from api.models.recipe import RecipeUpdate as RecipeUpdateModel

    updated_recipe = recipe_storage.update_recipe(recipe_id, RecipeUpdateModel(image_url=image_url), database=database)

    if updated_recipe is None:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update recipe with new image URL"
        )

    return updated_recipe  # pragma: no cover


@router.post("/{recipe_id}/copy", status_code=status.HTTP_201_CREATED)
async def copy_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    recipe_id: str,
    *,
    enhanced: Annotated[
        bool | None, Query(description="Source database: True=enhanced, False=default, None=auto-detect")
    ] = None,
) -> Recipe:
    """
    Create a copy of a shared/legacy recipe for your household.

    This allows users to:
    - Make a private copy of a shared recipe to modify
    - Copy recipes before enhancing them (auto-done by enhance endpoint)

    The copy will be owned by the user's household with visibility="household".
    Use enhanced=true/false to select source database explicitly, or omit to auto-detect.
    """
    household_id = _require_household(user)

    # Get the source recipe from specified or auto-detected database
    if enhanced is True:
        source_database = ENHANCED_DATABASE
        recipe = recipe_storage.get_recipe(recipe_id, database=ENHANCED_DATABASE)
    elif enhanced is False:
        source_database = DEFAULT_DATABASE
        recipe = recipe_storage.get_recipe(recipe_id, database=DEFAULT_DATABASE)
    else:
        # Auto-detect: try enhanced DB first, then default
        source_database = ENHANCED_DATABASE
        recipe = recipe_storage.get_recipe(recipe_id, database=ENHANCED_DATABASE)
        if recipe is None:
            source_database = DEFAULT_DATABASE
            recipe = recipe_storage.get_recipe(recipe_id, database=DEFAULT_DATABASE)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check if already owned by this household
    if recipe.household_id == household_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe already belongs to your household")

    # Must be shared or legacy to copy
    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"
    if not is_shared_or_legacy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Create the copy in the same database where the source recipe was found
    copied = recipe_storage.copy_recipe(
        recipe_id,
        to_household_id=household_id,
        copied_by=user.email,
        source_database=source_database,
        target_database=source_database,
    )

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

    # Get the original recipe - try enhanced DB first, then default
    source_database = ENHANCED_DATABASE
    recipe = recipe_storage.get_recipe(recipe_id, database=ENHANCED_DATABASE)
    if recipe is None:
        source_database = DEFAULT_DATABASE
        recipe = recipe_storage.get_recipe(recipe_id, database=DEFAULT_DATABASE)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # Check if this is a shared/legacy recipe that needs to be copied first
    is_owned = recipe.household_id == household_id
    is_shared_or_legacy = recipe.household_id is None or recipe.visibility == "shared"

    if not is_owned and not is_shared_or_legacy:
        # Recipe exists but belongs to another household and is not shared
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    # If shared/legacy and not owned, copy first (from source DB to enhanced DB)
    target_recipe = recipe
    if not is_owned and is_shared_or_legacy:
        copied = recipe_storage.copy_recipe(
            recipe_id, to_household_id=household_id, copied_by=user.email, source_database=source_database
        )
        if copied is None:  # pragma: no cover
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy recipe before enhancement"
            )
        target_recipe = copied

    # Enhance the recipe
    try:  # pragma: no cover
        enhanced_data = do_enhance(target_recipe.model_dump())

        # Save to enhanced database
        from api.models.recipe import RecipeCreate

        enhanced_recipe = RecipeCreate(
            title=enhanced_data.get("title", target_recipe.title),
            url=enhanced_data.get("url", target_recipe.url),
            ingredients=enhanced_data.get("ingredients", target_recipe.ingredients),
            instructions=enhanced_data.get("instructions", target_recipe.instructions),
            image_url=enhanced_data.get("image_url", target_recipe.image_url),
            servings=enhanced_data.get("servings", target_recipe.servings),
            prep_time=enhanced_data.get("prep_time", target_recipe.prep_time),
            cook_time=enhanced_data.get("cook_time", target_recipe.cook_time),
            total_time=enhanced_data.get("total_time", target_recipe.total_time),
            cuisine=enhanced_data.get("cuisine"),
            category=enhanced_data.get("category"),
            tags=enhanced_data.get("tags", []),
            tips=enhanced_data.get("tips"),
        )

        # Save with target recipe ID, with enhancement metadata
        return recipe_storage.save_recipe(
            enhanced_recipe,
            recipe_id=target_recipe.id,
            database=ENHANCED_DATABASE,
            enhanced=True,
            enhanced_from=recipe_id,
            enhanced_at=datetime.now(tz=UTC),
            changes_made=enhanced_data.get("changes_made"),
            household_id=household_id,
            created_by=user.email,
        )

    except EnhancementDisabledError as e:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except EnhancementError as e:  # pragma: no cover
        logger.exception("Failed to enhance recipe_id=%s", recipe_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e
