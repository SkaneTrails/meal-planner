"""Tests for api/services/image_downloader.py."""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from PIL import Image

from api.services.image_downloader import (
    MAX_DOWNLOAD_BYTES,
    _download_image,
    _process_image,
    _upload_to_gcs,
    download_and_upload_image,
    is_gcs_url,
)

BUCKET = "test-bucket"
RECIPE_ID = "recipe_abc123"
EXTERNAL_URL = "https://example.com/photo.jpg"
GCS_URL = f"https://storage.googleapis.com/{BUCKET}/recipes/{RECIPE_ID}/thumb.jpg"


def _make_jpeg_bytes(width: int = 100, height: int = 80) -> bytes:
    """Create minimal valid JPEG bytes for testing."""
    img = Image.new("RGB", (width, height), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestIsGcsUrl:
    """Tests for is_gcs_url helper."""

    def test_recognises_own_bucket(self) -> None:
        """Should return True for URLs in our bucket."""
        url = f"https://storage.googleapis.com/{BUCKET}/recipes/id/img.jpg"
        assert is_gcs_url(url, BUCKET) is True

    def test_rejects_external_url(self) -> None:
        """Should return False for non-GCS URLs."""
        assert is_gcs_url(EXTERNAL_URL, BUCKET) is False

    def test_rejects_different_bucket(self) -> None:
        """Should return False for a different GCS bucket."""
        url = "https://storage.googleapis.com/other-bucket/img.jpg"
        assert is_gcs_url(url, BUCKET) is False


class TestDownloadImage:
    """Tests for _download_image."""

    @pytest.mark.asyncio
    async def test_downloads_image_bytes(self) -> None:
        """Should return image bytes on success."""
        image_bytes = _make_jpeg_bytes()
        mock_response = MagicMock()
        mock_response.content = image_bytes
        mock_response.raise_for_status = MagicMock()

        with patch("api.services.image_downloader.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_cls.return_value.__aenter__.return_value = mock_client

            result = await _download_image(EXTERNAL_URL)

        assert result == image_bytes

    @pytest.mark.asyncio
    async def test_returns_none_on_timeout(self) -> None:
        """Should return None when download times out."""
        with patch("api.services.image_downloader.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.TimeoutException("slow")
            mock_cls.return_value.__aenter__.return_value = mock_client

            result = await _download_image(EXTERNAL_URL)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_http_error(self) -> None:
        """Should return None on HTTP 404 etc."""
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Not Found", request=MagicMock(), response=mock_response
        )

        with patch("api.services.image_downloader.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_cls.return_value.__aenter__.return_value = mock_client

            result = await _download_image(EXTERNAL_URL)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_request_error(self) -> None:
        """Should return None on DNS failure or connection error."""
        with patch("api.services.image_downloader.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.ConnectError("DNS fail")
            mock_cls.return_value.__aenter__.return_value = mock_client

            result = await _download_image(EXTERNAL_URL)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_too_large(self) -> None:
        """Should return None when image exceeds size limit."""
        oversized = b"\x00" * (MAX_DOWNLOAD_BYTES + 1)
        mock_response = MagicMock()
        mock_response.content = oversized
        mock_response.raise_for_status = MagicMock()

        with patch("api.services.image_downloader.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_cls.return_value.__aenter__.return_value = mock_client

            result = await _download_image(EXTERNAL_URL)

        assert result is None


class TestProcessImage:
    """Tests for _process_image."""

    def test_creates_thumbnail(self) -> None:
        """Should return JPEG thumbnail bytes."""
        image_data = _make_jpeg_bytes(1200, 900)
        result = _process_image(image_data, RECIPE_ID)

        assert result is not None
        img = Image.open(io.BytesIO(result))
        assert img.format == "JPEG"
        assert img.width <= 800
        assert img.height <= 600

    def test_returns_none_for_invalid_data(self) -> None:
        """Should return None for non-image bytes."""
        result = _process_image(b"not an image", RECIPE_ID)
        assert result is None

    def test_handles_png_with_transparency(self) -> None:
        """Should convert RGBA PNG to RGB JPEG."""
        img = Image.new("RGBA", (200, 150), (255, 0, 0, 128))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        result = _process_image(png_bytes, RECIPE_ID)
        assert result is not None

        output_img = Image.open(io.BytesIO(result))
        assert output_img.mode == "RGB"


class TestUploadToGcs:
    """Tests for _upload_to_gcs."""

    def test_uploads_and_returns_url(self) -> None:
        """Should upload to GCS and return public URL."""
        thumbnail_data = _make_jpeg_bytes()

        with patch("api.services.image_downloader.storage.Client") as mock_storage:
            mock_blob = MagicMock()
            mock_bucket = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_storage.return_value.bucket.return_value = mock_bucket

            result = _upload_to_gcs(thumbnail_data, RECIPE_ID, BUCKET)

        assert result is not None
        assert result.startswith(f"https://storage.googleapis.com/{BUCKET}/recipes/{RECIPE_ID}/")
        assert result.endswith(".jpg")
        mock_blob.upload_from_string.assert_called_once_with(thumbnail_data, content_type="image/jpeg")

    def test_returns_none_on_upload_failure(self) -> None:
        """Should return None when GCS upload fails."""
        with patch("api.services.image_downloader.storage.Client", side_effect=Exception("GCS down")):
            result = _upload_to_gcs(b"data", RECIPE_ID, BUCKET)

        assert result is None


class TestDownloadAndUploadImage:
    """Tests for the full download_and_upload_image pipeline."""

    @pytest.mark.asyncio
    async def test_full_pipeline(self) -> None:
        """Should download, process, and upload, returning GCS URL."""
        image_bytes = _make_jpeg_bytes()

        with (
            patch("api.services.image_downloader._download_image", new_callable=AsyncMock) as mock_dl,
            patch("api.services.image_downloader._process_image") as mock_proc,
            patch("api.services.image_downloader._upload_to_gcs") as mock_up,
        ):
            mock_dl.return_value = image_bytes
            mock_proc.return_value = b"thumb"
            mock_up.return_value = GCS_URL

            result = await download_and_upload_image(EXTERNAL_URL, RECIPE_ID, BUCKET)

        assert result == GCS_URL
        mock_dl.assert_awaited_once_with(EXTERNAL_URL)
        mock_proc.assert_called_once_with(image_bytes, RECIPE_ID)
        mock_up.assert_called_once_with(b"thumb", RECIPE_ID, BUCKET)

    @pytest.mark.asyncio
    async def test_skips_gcs_url(self) -> None:
        """Should return the same URL if it already points to our bucket."""
        result = await download_and_upload_image(GCS_URL, RECIPE_ID, BUCKET)
        assert result == GCS_URL

    @pytest.mark.asyncio
    async def test_returns_none_on_download_failure(self) -> None:
        """Should return None when download fails."""
        with patch("api.services.image_downloader._download_image", new_callable=AsyncMock) as mock_dl:
            mock_dl.return_value = None

            result = await download_and_upload_image(EXTERNAL_URL, RECIPE_ID, BUCKET)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_processing_failure(self) -> None:
        """Should return None when image processing fails."""
        with (
            patch("api.services.image_downloader._download_image", new_callable=AsyncMock) as mock_dl,
            patch("api.services.image_downloader._process_image") as mock_proc,
        ):
            mock_dl.return_value = b"data"
            mock_proc.return_value = None

            result = await download_and_upload_image(EXTERNAL_URL, RECIPE_ID, BUCKET)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_upload_failure(self) -> None:
        """Should return None when GCS upload fails."""
        with (
            patch("api.services.image_downloader._download_image", new_callable=AsyncMock) as mock_dl,
            patch("api.services.image_downloader._process_image") as mock_proc,
            patch("api.services.image_downloader._upload_to_gcs") as mock_up,
        ):
            mock_dl.return_value = b"data"
            mock_proc.return_value = b"thumb"
            mock_up.return_value = None

            result = await download_and_upload_image(EXTERNAL_URL, RECIPE_ID, BUCKET)

        assert result is None
