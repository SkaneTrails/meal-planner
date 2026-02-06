"""Extract base64 image from Firestore doc, resize, upload to GCS, update doc.

Usage:
    uv run python -m scripts.fix_embedded_image <recipe_id>
"""

import base64
import io
import sys
import uuid

from google.cloud import storage
from PIL import Image

from api.storage.firestore_client import RECIPES_COLLECTION, get_firestore_client

GCS_BUCKET_NAME = "hikes-482104-recipe-images"
THUMBNAIL_MAX_WIDTH = 800
THUMBNAIL_MAX_HEIGHT = 600
THUMBNAIL_QUALITY = 85


def create_thumbnail(image_data: bytes) -> bytes:
    """Resize image to max 800x600, convert to JPEG."""
    img = Image.open(io.BytesIO(image_data))

    # Convert to RGB
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    print(f"  Original size: {img.size[0]}x{img.size[1]}")

    # Resize if needed
    width, height = img.size
    ratio = min(THUMBNAIL_MAX_WIDTH / width, THUMBNAIL_MAX_HEIGHT / height)
    if ratio < 1:
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        print(f"  Resized to:    {new_width}x{new_height}")
    else:
        print(f"  No resize needed (already within {THUMBNAIL_MAX_WIDTH}x{THUMBNAIL_MAX_HEIGHT})")

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=THUMBNAIL_QUALITY, optimize=True)
    return output.getvalue()


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: uv run python -m scripts.fix_embedded_image <recipe_id>")
        return

    recipe_id = sys.argv[1]
    db = get_firestore_client()
    doc = db.collection(RECIPES_COLLECTION).document(recipe_id).get()

    if not doc.exists:  # type: ignore[union-attr]
        print(f"❌ Recipe not found: {recipe_id}")
        return

    data = doc.to_dict()  # type: ignore[union-attr]
    if data is None:
        print(f"❌ Empty doc data: {recipe_id}")
        return
    image_url = data.get("image_url", "")

    if not image_url.startswith("data:"):
        print(f"image_url is not base64-embedded ({len(image_url)} chars), nothing to fix.")
        return

    print(f"Recipe: {data.get('title')}")
    print(f"  image_url: {len(image_url)} chars (base64 embedded)")

    # Decode base64
    # Format: data:image/jpeg;base64,/9j/4AAQ...
    _header, b64data = image_url.split(",", 1)
    image_bytes = base64.b64decode(b64data)
    print(f"  Decoded: {len(image_bytes)} bytes")

    # Resize
    thumbnail = create_thumbnail(image_bytes)
    print(f"  Thumbnail: {len(thumbnail)} bytes ({len(thumbnail) // 1024} KB)")

    # Upload to GCS
    filename = f"recipes/{recipe_id}/{uuid.uuid4()}.jpg"
    print(f"  Uploading to gs://{GCS_BUCKET_NAME}/{filename}")

    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(filename)
    blob.upload_from_string(thumbnail, content_type="image/jpeg")
    gcs_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"
    print(f"  Public URL: {gcs_url}")

    # Update Firestore
    db.collection(RECIPES_COLLECTION).document(recipe_id).update({"image_url": gcs_url})
    print(f"\n✅ Updated recipe {recipe_id} image_url")

    # Verify new doc size
    updated = db.collection(RECIPES_COLLECTION).document(recipe_id).get().to_dict()  # type: ignore[union-attr]
    print(f"  New image_url: {len(updated.get('image_url', '') if updated else '')} chars")


if __name__ == "__main__":
    main()
