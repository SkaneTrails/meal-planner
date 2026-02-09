"""Download external recipe images, process them, and upload to GCS.

Handles the full pipeline: fetch remote image → create hero + thumbnail →
upload both to cloud storage. Used during recipe scraping/parsing to replace
external image links with owned copies in our GCS bucket.
"""

import logging
import uuid
from dataclasses import dataclass

import httpx
from google.cloud import storage
from PIL import UnidentifiedImageError

from api.services.image_service import create_hero_and_thumbnail
from api.services.url_safety import is_safe_url

logger = logging.getLogger(__name__)

DOWNLOAD_TIMEOUT_SECONDS = 15
MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


@dataclass
class ImageResult:
    """URLs for the two image sizes stored in GCS."""

    hero_url: str
    thumbnail_url: str


def is_gcs_url(url: str, bucket_name: str) -> bool:
    """Check whether a URL already points to our GCS bucket."""
    return url.startswith(f"https://storage.googleapis.com/{bucket_name}/")


async def download_and_upload_image(image_url: str, recipe_id: str, bucket_name: str) -> ImageResult | None:
    """Download an external image, create hero + thumbnail, and upload both to GCS.

    Args:
        image_url: The external URL of the image to download.
        recipe_id: Recipe ID, used in the GCS path.
        bucket_name: GCS bucket name to upload to.

    Returns:
        ImageResult with hero_url and thumbnail_url, or None if any step fails.
    """
    if is_gcs_url(image_url, bucket_name):
        return None

    image_data = await _download_image(image_url)
    if image_data is None:
        return None

    processed = _process_image(image_data, recipe_id)
    if processed is None:
        return None

    hero_data, thumbnail_data = processed
    return _upload_both_to_gcs(hero_data, thumbnail_data, recipe_id, bucket_name)


async def _download_image(url: str) -> bytes | None:
    """Download image bytes from a URL.

    Returns:
        Raw image bytes, or None on failure.
    """
    if not is_safe_url(url):
        logger.warning("Blocked unsafe URL: %s", url)
        return None

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
    except (httpx.RequestError, Exception) as e:
        logger.warning("Error downloading image from %s: %s", url, e)
        return None


def _process_image(image_data: bytes, recipe_id: str) -> tuple[bytes, bytes] | None:
    """Create hero and thumbnail from raw image data.

    Decodes the image once and resizes twice to avoid redundant decoding.

    Returns:
        Tuple of (hero_bytes, thumbnail_bytes), or None if processing fails.
    """
    try:
        hero_data, thumbnail_data = create_hero_and_thumbnail(image_data)
        logger.info(
            "Created images for recipe %s: %d bytes -> hero %d bytes, thumb %d bytes",
            recipe_id,
            len(image_data),
            len(hero_data),
            len(thumbnail_data),
        )
        return hero_data, thumbnail_data
    except UnidentifiedImageError:
        logger.warning("Invalid image data for recipe %s", recipe_id)
        return None
    except Exception:
        logger.exception("Failed to process image for recipe %s", recipe_id)
        return None


def _upload_both_to_gcs(
    hero_data: bytes, thumbnail_data: bytes, recipe_id: str, bucket_name: str
) -> ImageResult | None:
    """Upload hero and thumbnail to GCS and return both public URLs.

    Returns:
        ImageResult with both URLs, or None on failure.
    """
    image_id = uuid.uuid4()
    hero_filename = f"recipes/{recipe_id}/{image_id}_hero.jpg"
    thumb_filename = f"recipes/{recipe_id}/{image_id}_thumb.jpg"

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        hero_blob = bucket.blob(hero_filename)
        hero_blob.upload_from_string(hero_data, content_type="image/jpeg")

        thumb_blob = bucket.blob(thumb_filename)
        thumb_blob.upload_from_string(thumbnail_data, content_type="image/jpeg")

        hero_url = f"https://storage.googleapis.com/{bucket_name}/{hero_filename}"
        thumb_url = f"https://storage.googleapis.com/{bucket_name}/{thumb_filename}"
        logger.info("Uploaded recipe images to GCS: hero=%s, thumb=%s", hero_url, thumb_url)
        return ImageResult(hero_url=hero_url, thumbnail_url=thumb_url)

    except Exception:
        logger.exception("Failed to upload images to GCS for recipe %s", recipe_id)
        return None
