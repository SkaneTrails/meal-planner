"""Recipe image upload and ingestion.

Handles uploading custom images and ingesting images from external URLs
during recipe scraping.
"""

import logging
import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from google.cloud import storage

from api.auth.firebase import require_auth
from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser
from api.models.recipe import Recipe, RecipeUpdate
from api.services.image_downloader import download_and_upload_image
from api.services.image_service import create_hero, create_thumbnail
from api.storage import recipe_storage

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


def _get_gcs_bucket() -> str:
    """Get GCS bucket name (read on first use, not import time)."""
    return os.environ["GCS_BUCKET_NAME"]


async def ingest_recipe_image(recipe: Recipe, *, household_id: str) -> Recipe:
    """Download external image, upload hero + thumbnail to GCS, and update the recipe.

    If the recipe has no image_url or it already points to our bucket,
    returns the recipe unchanged. Failures are logged but never block
    recipe creation.
    """
    if not recipe.image_url:
        return recipe

    try:
        bucket_name = _get_gcs_bucket()
    except KeyError:  # pragma: no cover
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
        logger.warning("Failed to update image URLs for recipe %s", recipe.id)  # pragma: no cover

    return recipe


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

    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if recipe.household_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload image for shared/legacy recipe. Please copy the recipe to your household first.",
        )
    if recipe.household_id != household_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image (JPEG, PNG, etc.)")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

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

    image_id = uuid.uuid4()
    hero_filename = f"recipes/{recipe_id}/{image_id}_hero.jpg"
    thumb_filename = f"recipes/{recipe_id}/{image_id}_thumb.jpg"

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
