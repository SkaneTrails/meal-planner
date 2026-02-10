"""Tests for api/services/html_fetcher.py."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from api.services.html_fetcher import FetchError, FetchResult, fetch_html

_SAFE_URL_PATCH = patch("api.services.html_fetcher.is_safe_url", return_value=True)


@pytest.mark.asyncio
class TestFetchHtml:
    """Tests for fetch_html function."""

    async def test_returns_html_on_success(self) -> None:
        """Should return FetchResult with HTML on successful fetch."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.is_success = True
        mock_response.text = "<html><body>Recipe</body></html>"
        mock_response.content = b"<html><body>Recipe</body></html>"
        mock_response.url = "https://example.com/recipe"
        mock_response.headers = {}

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/recipe")

        assert isinstance(result, FetchResult)
        assert result.html == "<html><body>Recipe</body></html>"
        assert result.final_url == "https://example.com/recipe"

    async def test_returns_error_for_blocked_url(self) -> None:
        """Should return FetchError for SSRF-blocked URLs."""
        result = await fetch_html("http://169.254.169.254/metadata")

        assert isinstance(result, FetchError)
        assert result.reason == "security"

    async def test_returns_error_for_403(self) -> None:
        """Should return FetchError with blocked reason for 403."""
        mock_response = AsyncMock()
        mock_response.status_code = 403
        mock_response.is_success = False

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://www.coop.se/recept/test/")

        assert isinstance(result, FetchError)
        assert result.reason == "blocked"
        assert "coop.se" in result.message

    async def test_returns_error_for_429(self) -> None:
        """Should return FetchError with blocked reason for rate limiting."""
        mock_response = AsyncMock()
        mock_response.status_code = 429
        mock_response.is_success = False

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/recipe")

        assert isinstance(result, FetchError)
        assert result.reason == "blocked"

    async def test_returns_error_on_timeout(self) -> None:
        """Should return FetchError on timeout."""
        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.TimeoutException("timed out")
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/slow")

        assert isinstance(result, FetchError)
        assert result.reason == "blocked"

    async def test_returns_error_on_network_failure(self) -> None:
        """Should return FetchError on network errors."""
        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.ConnectError("connection refused")
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/down")

        assert isinstance(result, FetchError)
        assert result.reason == "fetch_failed"

    async def test_returns_error_on_non_success_status(self) -> None:
        """Should return FetchError for non-blocked non-success status codes."""
        mock_response = AsyncMock()
        mock_response.status_code = 500
        mock_response.is_success = False

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/error")

        assert isinstance(result, FetchError)
        assert result.reason == "fetch_failed"

    async def test_blocks_unsafe_redirect_via_event_hook(self) -> None:
        """Should return FetchError when redirect targets blocked URL."""
        from api.services.html_fetcher import _UnsafeRedirectError

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = _UnsafeRedirectError("Redirect blocked")
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/redirect")

        assert isinstance(result, FetchError)
        assert result.reason == "security"

    async def test_returns_error_for_oversized_response(self) -> None:
        """Should return FetchError when response exceeds max size."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.is_success = True
        mock_response.headers = {"content-length": "10000000"}
        mock_response.content = b"x" * 10_000_000

        with _SAFE_URL_PATCH, patch("api.services.html_fetcher.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            result = await fetch_html("https://example.com/huge")

        assert isinstance(result, FetchError)
        assert result.reason == "fetch_failed"
        assert "5 MB" in result.message
