"""Recipe scraping service using recipe-scrapers library."""

import ipaddress
import re
import socket
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx
from recipe_scrapers import scrape_html

# Blocked IP ranges for SSRF protection
BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),  # Private
    ipaddress.ip_network("172.16.0.0/12"),  # Private
    ipaddress.ip_network("192.168.0.0/16"),  # Private
    ipaddress.ip_network("127.0.0.0/8"),  # Loopback
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local / Cloud metadata
    ipaddress.ip_network("0.0.0.0/8"),  # Current network
    ipaddress.ip_network("224.0.0.0/4"),  # Multicast
    ipaddress.ip_network("240.0.0.0/4"),  # Reserved
    ipaddress.ip_network("100.64.0.0/10"),  # Shared address space
]

BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata",
    "metadata.google",
    "metadata.google.internal",
    "169.254.169.254",  # Cloud metadata endpoint
}


def _is_ip_blocked(ip_str: str) -> bool:
    """Check if an IP address is in a blocked range."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in blocked_range for blocked_range in BLOCKED_IP_RANGES)
    except ValueError:
        return False


def _is_hostname_blocked(hostname: str) -> bool:
    """Check if a hostname is blocked or suspicious."""
    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES:
        return True
    return any(blocked in hostname_lower for blocked in ("internal", "local", "metadata"))


def _resolve_and_check_ips(hostname: str) -> bool:
    """Resolve hostname via DNS and check if any resolved IP is blocked. Returns True if blocked."""
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        return any(_is_ip_blocked(sockaddr[0]) for *_, sockaddr in addr_info)
    except socket.gaierror:
        # DNS resolution failed - treat as blocked
        return True


def _is_safe_url(url: str) -> bool:
    """Validate URL to prevent SSRF attacks."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname

        # Only allow http and https schemes
        if parsed.scheme not in ("http", "https") or not hostname:
            return False

        # Check hostname and DNS resolution
        if _is_hostname_blocked(hostname) or _resolve_and_check_ips(hostname):
            return False

    except Exception:
        return False

    return True


@dataclass
class Recipe:
    """A scraped recipe (simplified model for the Cloud Function)."""

    title: str
    url: str
    ingredients: list[str] = field(default_factory=list)
    instructions: list[str] = field(default_factory=list)
    image_url: str | None = None
    servings: int | None = None
    prep_time: int | None = None
    cook_time: int | None = None
    total_time: int | None = None


def _safe_get[T](func: Callable[[], T], default: T) -> T:
    """Safely call a scraper method, returning default if it raises an exception."""
    try:
        result = func()
        return result if result is not None else default
    except Exception:
        return default


def _safe_get_optional[T](func: Callable[[], T]) -> T | None:
    """Safely call a scraper method, returning None if it raises an exception."""
    try:
        return func()
    except Exception:
        return None


def _safe_int(value: str | int | None) -> int | None:
    """Safely convert a value to int, extracting numbers from strings like '4 servings'."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None


def parse_recipe_html(html: str, url: str) -> Recipe | None:
    """
    Parse a recipe from HTML content.

    This is used for client-side scraping where the client fetches the HTML
    and sends it to the API for parsing, avoiding cloud IP blocking issues.

    Args:
        html: The HTML content of the recipe page.
        url: The original URL (used for metadata extraction).

    Returns:
        A Recipe object if successful, None otherwise.
    """
    try:
        scraper = scrape_html(html, org_url=url)

        instructions: list[str] = _safe_get(scraper.instructions_list, [])
        if not instructions:
            raw_instructions = _safe_get(scraper.instructions, "")
            instructions = [step.strip() for step in raw_instructions.split("\n") if step.strip()]

        return Recipe(
            title=_safe_get(scraper.title, "Unknown Recipe"),
            url=url,
            ingredients=_safe_get(scraper.ingredients, []),
            instructions=instructions,
            image_url=_safe_get_optional(scraper.image),
            servings=_safe_int(_safe_get_optional(scraper.yields)),
            prep_time=_safe_get_optional(scraper.prep_time),
            cook_time=_safe_get_optional(scraper.cook_time),
            total_time=_safe_get_optional(scraper.total_time),
        )
    except Exception as e:
        print(f"Recipe parsing error for {url}: {type(e).__name__}: {e}", file=sys.stderr)
        return None


def scrape_recipe(url: str) -> Recipe | None:
    """
    Scrape a recipe from a URL.

    Args:
        url: The URL of the recipe to scrape.

    Returns:
        A Recipe object if successful, None otherwise.
    """
    # SSRF protection: validate URL before fetching
    if not _is_safe_url(url):
        print(f"URL blocked by security policy: {url}", file=sys.stderr)
        return None

    try:
        # Use a browser-like User-Agent to avoid being blocked by recipe sites
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        response = httpx.get(url, follow_redirects=True, timeout=30.0, headers=headers)
        response.raise_for_status()

        # Validate final URL after redirects to prevent SSRF bypass
        final_url = str(response.url)
        if final_url != url and not _is_safe_url(final_url):
            print(f"Redirect blocked by security policy: {url} -> {final_url}", file=sys.stderr)
            return None

        html = response.text

        # Use the shared parsing function
        return parse_recipe_html(html, url)
    except Exception as e:
        print(f"Recipe scraping error for {url}: {type(e).__name__}: {e}", file=sys.stderr)
        return None
