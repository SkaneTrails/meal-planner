"""URL safety validation to prevent SSRF attacks.

Blocks requests to private networks, loopback, cloud metadata endpoints,
and other internal addresses. Used by image_downloader to validate external
image URLs before downloading.

Ported from functions/scrape_recipe/recipe_scraper.py to share the same
protection in the API layer.
"""

import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("100.64.0.0/10"),
]

BLOCKED_HOSTNAMES = {"localhost", "metadata", "metadata.google", "metadata.google.internal", "169.254.169.254"}


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
    """Resolve hostname via DNS and check if any resolved IP is blocked.

    Returns True if blocked.
    """
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        return any(_is_ip_blocked(str(sockaddr[0])) for *_, sockaddr in addr_info)
    except socket.gaierror:
        return True


def is_safe_url(url: str) -> bool:
    """Validate URL to prevent SSRF attacks.

    Returns True if the URL is safe to fetch, False otherwise.
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname

        if parsed.scheme not in ("http", "https") or not hostname:
            return False

        if _is_hostname_blocked(hostname) or _resolve_and_check_ips(hostname):
            return False

    except Exception:
        return False

    return True
