"""Image processing service for recipe thumbnails."""

import io

from PIL import Image

# Thumbnail settings - optimized for recipe cards
THUMBNAIL_MAX_WIDTH = 800
THUMBNAIL_MAX_HEIGHT = 600
THUMBNAIL_QUALITY = 85  # JPEG quality (1-100)


def create_thumbnail(image_data: bytes) -> tuple[bytes, str]:
    """Create a JPEG thumbnail from image data.

    Resizes images to fit within max dimensions while maintaining aspect ratio.
    Converts all formats (PNG with transparency, etc.) to RGB JPEG.

    Args:
        image_data: Raw image bytes to process.

    Returns:
        Tuple of (thumbnail_bytes, content_type).
        Always outputs JPEG for smaller file size.

    Raises:
        PIL.UnidentifiedImageError: If image_data is not a valid image.
    """
    img = Image.open(io.BytesIO(image_data))

    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    width, height = img.size
    ratio = min(THUMBNAIL_MAX_WIDTH / width, THUMBNAIL_MAX_HEIGHT / height)

    if ratio < 1:
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=THUMBNAIL_QUALITY, optimize=True)
    output.seek(0)

    return output.getvalue(), "image/jpeg"
