"""Tests for api/services/image_service.py."""

import io

from PIL import Image

from api.services.image_service import (
    HERO_MAX_HEIGHT,
    HERO_MAX_WIDTH,
    THUMBNAIL_MAX_HEIGHT,
    THUMBNAIL_MAX_WIDTH,
    _resize_image,
    _to_rgb,
    create_hero,
    create_hero_and_thumbnail,
    create_thumbnail,
)


def _make_image(width: int, height: int, mode: str = "RGB") -> bytes:
    """Create a minimal in-memory image with the given dimensions and mode."""
    img = Image.new(
        mode,
        (width, height),
        color=(100, 150, 200)[: len(Image.new(mode, (1, 1)).getpixel((0, 0))) if mode not in ("L", "1", "P") else 1],
    )
    buf = io.BytesIO()
    fmt = "PNG" if mode in ("RGBA", "P", "LA") else "JPEG" if mode == "RGB" else "PNG"
    if mode == "P":
        img.putpalette([i % 256 for i in range(768)])
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.getvalue()


def _make_rgb_image(width: int, height: int) -> bytes:
    """Create a minimal RGB JPEG image."""
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()


def _make_rgba_image(width: int, height: int) -> bytes:
    """Create an RGBA PNG image with transparency."""
    img = Image.new("RGBA", (width, height), color=(100, 150, 200, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _make_palette_image(width: int, height: int) -> bytes:
    """Create a palette-mode (P) PNG image."""
    img = Image.new("P", (width, height))
    img.putpalette([i % 256 for i in range(768)])
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _make_grayscale_image(width: int, height: int) -> bytes:
    """Create a grayscale (L) image."""
    img = Image.new("L", (width, height), color=128)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _make_la_image(width: int, height: int) -> bytes:
    """Create a grayscale with alpha (LA) image."""
    img = Image.new("LA", (width, height), color=(128, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _decode_jpeg(data: bytes) -> Image.Image:
    """Decode JPEG bytes back to a PIL Image."""
    return Image.open(io.BytesIO(data))


class TestToRgb:
    """Tests for _to_rgb mode conversion."""

    def test_rgb_passthrough(self) -> None:
        img = Image.new("RGB", (10, 10), color=(255, 0, 0))
        result = _to_rgb(img)
        assert result.mode == "RGB"
        assert result.size == (10, 10)

    def test_rgba_composited_onto_white(self) -> None:
        img = Image.new("RGBA", (10, 10), color=(255, 0, 0, 0))
        result = _to_rgb(img)
        assert result.mode == "RGB"
        pixel = result.getpixel((0, 0))
        assert pixel == (255, 255, 255), "Fully transparent RGBA should composite to white"

    def test_palette_mode_converted(self) -> None:
        img = Image.new("P", (10, 10))
        img.putpalette([i % 256 for i in range(768)])
        result = _to_rgb(img)
        assert result.mode == "RGB"

    def test_grayscale_converted(self) -> None:
        img = Image.new("L", (10, 10), color=128)
        result = _to_rgb(img)
        assert result.mode == "RGB"

    def test_la_mode_converted(self) -> None:
        img = Image.new("LA", (10, 10), color=(128, 200))
        result = _to_rgb(img)
        assert result.mode == "RGB"


class TestResizeImage:
    """Tests for _resize_image."""

    def test_large_image_downscaled(self) -> None:
        img = Image.new("RGB", (1600, 1200))
        result = _resize_image(img, max_width=800, max_height=600, quality=75)
        decoded = _decode_jpeg(result)
        assert decoded.size[0] <= 800
        assert decoded.size[1] <= 600

    def test_small_image_not_upscaled(self) -> None:
        img = Image.new("RGB", (200, 150))
        result = _resize_image(img, max_width=800, max_height=600, quality=75)
        decoded = _decode_jpeg(result)
        assert decoded.size == (200, 150)

    def test_output_is_jpeg(self) -> None:
        img = Image.new("RGB", (100, 100))
        result = _resize_image(img, max_width=800, max_height=600, quality=75)
        assert result[:2] == b"\xff\xd8", "Output should start with JPEG magic bytes"

    def test_aspect_ratio_preserved(self) -> None:
        img = Image.new("RGB", (1600, 400))
        result = _resize_image(img, max_width=800, max_height=600, quality=75)
        decoded = _decode_jpeg(result)
        assert decoded.size == (800, 200)


class TestCreateHero:
    """Tests for create_hero function."""

    def test_returns_jpeg_bytes_and_content_type(self) -> None:
        data = _make_rgb_image(1600, 1200)
        hero_bytes, content_type = create_hero(data)
        assert content_type == "image/jpeg"
        assert hero_bytes[:2] == b"\xff\xd8"

    def test_hero_within_bounds(self) -> None:
        data = _make_rgb_image(2000, 1500)
        hero_bytes, _ = create_hero(data)
        decoded = _decode_jpeg(hero_bytes)
        assert decoded.size[0] <= HERO_MAX_WIDTH
        assert decoded.size[1] <= HERO_MAX_HEIGHT

    def test_hero_from_rgba_png(self) -> None:
        data = _make_rgba_image(1000, 800)
        hero_bytes, content_type = create_hero(data)
        assert content_type == "image/jpeg"
        decoded = _decode_jpeg(hero_bytes)
        assert decoded.mode == "RGB"

    def test_hero_from_palette_image(self) -> None:
        data = _make_palette_image(800, 600)
        _hero_bytes, content_type = create_hero(data)
        assert content_type == "image/jpeg"

    def test_hero_from_grayscale(self) -> None:
        data = _make_grayscale_image(800, 600)
        hero_bytes, content_type = create_hero(data)
        assert content_type == "image/jpeg"
        decoded = _decode_jpeg(hero_bytes)
        assert decoded.mode == "RGB"

    def test_hero_from_la_image(self) -> None:
        data = _make_la_image(800, 600)
        _hero_bytes, content_type = create_hero(data)
        assert content_type == "image/jpeg"


class TestCreateThumbnail:
    """Tests for create_thumbnail function."""

    def test_returns_jpeg_bytes_and_content_type(self) -> None:
        data = _make_rgb_image(800, 600)
        thumb_bytes, content_type = create_thumbnail(data)
        assert content_type == "image/jpeg"
        assert thumb_bytes[:2] == b"\xff\xd8"

    def test_thumbnail_within_bounds(self) -> None:
        data = _make_rgb_image(2000, 1500)
        thumb_bytes, _ = create_thumbnail(data)
        decoded = _decode_jpeg(thumb_bytes)
        assert decoded.size[0] <= THUMBNAIL_MAX_WIDTH
        assert decoded.size[1] <= THUMBNAIL_MAX_HEIGHT

    def test_thumbnail_from_rgba_png(self) -> None:
        data = _make_rgba_image(800, 600)
        _thumb_bytes, content_type = create_thumbnail(data)
        assert content_type == "image/jpeg"

    def test_small_image_not_upscaled(self) -> None:
        data = _make_rgb_image(100, 80)
        thumb_bytes, _ = create_thumbnail(data)
        decoded = _decode_jpeg(thumb_bytes)
        assert decoded.size == (100, 80)


class TestCreateHeroAndThumbnail:
    """Tests for create_hero_and_thumbnail combined function."""

    def test_returns_two_byte_objects(self) -> None:
        data = _make_rgb_image(1600, 1200)
        hero_bytes, thumb_bytes = create_hero_and_thumbnail(data)
        assert isinstance(hero_bytes, bytes)
        assert isinstance(thumb_bytes, bytes)

    def test_hero_larger_than_thumbnail(self) -> None:
        data = _make_rgb_image(1600, 1200)
        hero_bytes, thumb_bytes = create_hero_and_thumbnail(data)
        hero = _decode_jpeg(hero_bytes)
        thumb = _decode_jpeg(thumb_bytes)
        assert hero.size[0] >= thumb.size[0]
        assert hero.size[1] >= thumb.size[1]

    def test_both_within_respective_bounds(self) -> None:
        data = _make_rgb_image(2000, 1500)
        hero_bytes, thumb_bytes = create_hero_and_thumbnail(data)
        hero = _decode_jpeg(hero_bytes)
        thumb = _decode_jpeg(thumb_bytes)
        assert hero.size[0] <= HERO_MAX_WIDTH
        assert hero.size[1] <= HERO_MAX_HEIGHT
        assert thumb.size[0] <= THUMBNAIL_MAX_WIDTH
        assert thumb.size[1] <= THUMBNAIL_MAX_HEIGHT

    def test_works_with_rgba_input(self) -> None:
        data = _make_rgba_image(1000, 800)
        hero_bytes, thumb_bytes = create_hero_and_thumbnail(data)
        assert _decode_jpeg(hero_bytes).mode == "RGB"
        assert _decode_jpeg(thumb_bytes).mode == "RGB"
