"""Image processing service for recipe images.

Produces two sizes for each image:
- **Hero** (800x600, q75): recipe detail screen, full-width display
- **Thumbnail** (400x300, q72): recipe cards, lists, meal plan slots

There is no CDN resize layer downstream, so whatever we store is what
the client downloads.
"""

import io

from PIL import Image

HERO_MAX_WIDTH = 800
HERO_MAX_HEIGHT = 600
HERO_QUALITY = 75

THUMBNAIL_MAX_WIDTH = 400
THUMBNAIL_MAX_HEIGHT = 300
THUMBNAIL_QUALITY = 72


def _to_rgb(img: Image.Image) -> Image.Image:
    """Convert any image mode to RGB, compositing transparency onto white."""
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        return background
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def _resize_image(img: Image.Image, *, max_width: int, max_height: int, quality: int) -> bytes:
    """Resize an RGB image to fit within bounds and encode as JPEG."""
    width, height = img.size
    ratio = min(max_width / width, max_height / height)

    if ratio < 1:
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=quality, optimize=True)
    output.seek(0)
    return output.getvalue()


def create_hero(image_data: bytes) -> tuple[bytes, str]:
    """Create a hero-sized JPEG (max 800x600) from raw image data.

    Used for the recipe detail screen where the image is displayed
    full-width at ~350 CSS px height (up to ~1200 physical px on 3x
    retina).

    Returns:
        Tuple of (hero_bytes, content_type).

    Raises:
        PIL.UnidentifiedImageError: If image_data is not a valid image.
    """
    img = _to_rgb(Image.open(io.BytesIO(image_data)))
    hero_bytes = _resize_image(img, max_width=HERO_MAX_WIDTH, max_height=HERO_MAX_HEIGHT, quality=HERO_QUALITY)
    return hero_bytes, "image/jpeg"


def create_thumbnail(image_data: bytes) -> tuple[bytes, str]:
    """Create a thumbnail JPEG (max 400x300) from raw image data.

    Used for recipe cards, meal plan slots, and list views.

    Returns:
        Tuple of (thumbnail_bytes, content_type).

    Raises:
        PIL.UnidentifiedImageError: If image_data is not a valid image.
    """
    img = _to_rgb(Image.open(io.BytesIO(image_data)))
    thumb_bytes = _resize_image(
        img, max_width=THUMBNAIL_MAX_WIDTH, max_height=THUMBNAIL_MAX_HEIGHT, quality=THUMBNAIL_QUALITY
    )
    return thumb_bytes, "image/jpeg"


def create_hero_and_thumbnail(image_data: bytes) -> tuple[bytes, bytes]:
    """Create both hero and thumbnail from raw image data with a single decode.

    More efficient than calling create_hero + create_thumbnail separately,
    since the image is decoded from bytes only once.

    Returns:
        Tuple of (hero_bytes, thumbnail_bytes).

    Raises:
        PIL.UnidentifiedImageError: If image_data is not a valid image.
    """
    img = _to_rgb(Image.open(io.BytesIO(image_data)))
    hero_bytes = _resize_image(img, max_width=HERO_MAX_WIDTH, max_height=HERO_MAX_HEIGHT, quality=HERO_QUALITY)
    thumb_bytes = _resize_image(
        img, max_width=THUMBNAIL_MAX_WIDTH, max_height=THUMBNAIL_MAX_HEIGHT, quality=THUMBNAIL_QUALITY
    )
    return hero_bytes, thumb_bytes
