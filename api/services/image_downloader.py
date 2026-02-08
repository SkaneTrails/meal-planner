"""Download external recipe images, process them, and upload to GCS.

Handles the full pipeline: fetch remote image → create thumbnail → upload to
cloud storage. Used during recipe scraping/parsing to replace external image
links with owned copies in our GCS bucket.
"""

import logging
import uuid

import httpx
from google.cloud import storage
from PIL import UnidentifiedImageError

from api.services.image_service import create_thumbnail

logger = logging.getLogger(__name__)

DOWNLOAD_TIMEOUT_SECONDS = 15
MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def is_gcs_url(url: str, bucket_name: str) -> bool:
    """Check whether a URL already points to our GCS bucket."""
    return url.startswith(f"https://storage.googleapis.com/{bucket_name}/")


async def download_and_upload_image(image_url: str, recipe_id: str, bucket_name: str) -> str | None:
    """Download an external image, create a thumbnail, and upload to GCS.

    Args:
        image_url: The external URL of the image to download.
        recipe_id: Recipe ID, used in the GCS path.
        bucket_name: GCS bucket name to upload to.

    Returns:
        The public GCS URL of the uploaded thumbnail, or None if any step fails.
    """
    if is_gcs_url(image_url, bucket_name):
        return image_url

    image_data = await _download_image(image_url)
    if image_data is None:
        return None

    thumbnail_data = _process_image(image_data, recipe_id)
    if thumbnail_data is None:
        return None

    return _upload_to_gcs(thumbnail_data, recipe_id, bucket_name)


async def _download_image(url: str) -> bytes | None:
    """Download image bytes from a URL.

    Returns:
        Raw image bytes, or None on failure.
    """
    try:
        async with httpx.AsyncClient(
            timeout=DOWNLOAD_TIMEOUT_SECONDS, follow_redirects=True, max_redirects=5
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_length = len(response.content)
            if content_length > MAX_DOWNLOAD_BYTES:
                logger.warning("Image too large (%d bytes) from %s", content_length, url)
                return None

            return response.content

    except httpx.TimeoutException:
        logger.warning("Timeout downloading image from %s", url)
        return None
    except httpx.HTTPStatusError as e:
        logger.warning("HTTP %d downloading image from %s", e.response.status_code, url)
        return None
    except httpx.RequestError as e:
        logger.warning("Request error downloading image from %s: %s", url, e)
        return None


def _process_image(image_data: bytes, recipe_id: str) -> bytes | None:
    """Create a thumbnail from raw image data.

    Returns:
        JPEG thumbnail bytes, or None if processing fails.
    """
    try:
        thumbnail_data, _ = create_thumbnail(image_data)
        logger.info(
            "Created thumbnail for recipe %s: %d bytes -> %d bytes", recipe_id, len(image_data), len(thumbnail_data)
        )
        return thumbnail_data
    except UnidentifiedImageError:
        logger.warning("Invalid image data for recipe %s", recipe_id)
        return None
    except Exception:
        logger.exception("Failed to process image for recipe %s", recipe_id)
        return None


def _upload_to_gcs(thumbnail_data: bytes, recipe_id: str, bucket_name: str) -> str | None:
    """Upload thumbnail to GCS and return the public URL.

    Returns:
        Public GCS URL, or None on failure.
    """
    filename = f"recipes/{recipe_id}/{uuid.uuid4()}.jpg"
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        blob.upload_from_string(thumbnail_data, content_type="image/jpeg")

        gcs_url = f"https://storage.googleapis.com/{bucket_name}/{filename}"
        logger.info("Uploaded recipe image to GCS: %s", gcs_url)
        return gcs_url

    except Exception:
        logger.exception("Failed to upload image to GCS for recipe %s", recipe_id)
        return None
