"""Fetch HTML from recipe URLs with SSRF and blocking protection.

Used by the /scrape endpoint to fetch HTML server-side (from Cloud Run)
before sending it to the Cloud Function for parsing. This avoids both:
- CORS errors when the web client fetches directly
- Cloud Function IP blocking by recipe sites
"""

import logging
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx

from api.services.url_safety import is_safe_url

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = 30.0
MAX_RESPONSE_BYTES = 5 * 1024 * 1024  # 5 MB

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5,sv;q=0.3",
}

_BLOCKED_STATUS_CODES = {403, 406, 429, 451, 503}


class _UnsafeRedirectError(Exception):
    """Raised when a redirect targets a blocked URL."""


@dataclass
class FetchResult:
    """Successful HTML fetch result."""

    html: str
    final_url: str


@dataclass
class FetchError:
    """Failed HTML fetch with reason."""

    reason: str
    message: str


async def _validate_redirect(response: httpx.Response) -> None:
    """Event hook: validate each redirect hop against SSRF policy."""
    if response.is_redirect and response.has_redirect_location:
        location = response.headers["location"]
        resolved = str(response.url.join(location))
        if not is_safe_url(resolved):
            msg = f"Redirect to {resolved} blocked by security policy"
            raise _UnsafeRedirectError(msg)


async def fetch_html(url: str) -> FetchResult | FetchError:
    """Fetch HTML from a URL with safety checks and blocking detection.

    Returns FetchResult on success, FetchError on failure.
    """
    if not is_safe_url(url):
        return FetchError(reason="security", message=f"URL blocked by security policy: {url}")

    try:
        async with httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            follow_redirects=True,
            max_redirects=5,
            event_hooks={"response": [_validate_redirect]},
        ) as client:
            response = await client.get(url, headers=_BROWSER_HEADERS)
    except _UnsafeRedirectError as e:
        return FetchError(reason="security", message=str(e))
    except httpx.TimeoutException:
        return FetchError(reason="blocked", message="Request timed out — site may be blocking cloud requests")
    except httpx.RequestError as e:
        logger.warning("HTML fetch failed for %s: %s", url, e)
        return FetchError(reason="fetch_failed", message=f"Failed to fetch page: {type(e).__name__}")

    error = _check_response(url, response)
    return error if error else FetchResult(html=response.text, final_url=str(response.url))


def _check_response(url: str, response: httpx.Response) -> FetchError | None:
    """Check HTTP response for blocking, errors, or oversized body."""
    if response.status_code in _BLOCKED_STATUS_CODES:
        host = urlparse(url).hostname or url
        return FetchError(reason="blocked", message=f"{host} blocked the request (HTTP {response.status_code})")

    if not response.is_success:
        return FetchError(reason="fetch_failed", message=f"HTTP {response.status_code} from {urlparse(url).hostname}")

    content_length = response.headers.get("content-length")
    body_too_large = (content_length and int(content_length) > MAX_RESPONSE_BYTES) or (
        len(response.content) > MAX_RESPONSE_BYTES
    )
    if body_too_large:
        return FetchError(reason="fetch_failed", message="Response too large (exceeds 5 MB limit)")

    return None
