"""Tests for api/services/url_safety.py."""

from unittest.mock import patch

from api.services.url_safety import is_safe_url


class TestIsSafeUrl:
    """Tests for is_safe_url SSRF protection."""

    def test_allows_external_https(self) -> None:
        """Should allow normal HTTPS URLs."""
        with patch("api.services.url_safety._resolve_and_check_ips", return_value=False):
            assert is_safe_url("https://example.com/photo.jpg") is True

    def test_allows_external_http(self) -> None:
        """Should allow normal HTTP URLs."""
        with patch("api.services.url_safety._resolve_and_check_ips", return_value=False):
            assert is_safe_url("http://example.com/photo.jpg") is True

    def test_blocks_localhost(self) -> None:
        """Should block localhost."""
        assert is_safe_url("http://localhost/secret") is False

    def test_blocks_metadata_endpoint(self) -> None:
        """Should block cloud metadata endpoint."""
        assert is_safe_url("http://169.254.169.254/metadata") is False

    def test_blocks_private_ip(self) -> None:
        """Should block private network IPs."""
        assert is_safe_url("http://192.168.1.1/admin") is False
        assert is_safe_url("http://10.0.0.1/internal") is False

    def test_blocks_ftp_scheme(self) -> None:
        """Should block non-HTTP schemes."""
        assert is_safe_url("ftp://example.com/file") is False

    def test_blocks_file_scheme(self) -> None:
        """Should block file:// URLs."""
        assert is_safe_url("file:///etc/passwd") is False

    def test_blocks_empty_url(self) -> None:
        """Should block empty or malformed URLs."""
        assert is_safe_url("") is False

    def test_blocks_metadata_hostname_variations(self) -> None:
        """Should block hostnames containing 'metadata' or 'internal'."""
        assert is_safe_url("http://metadata.google.internal/computeMetadata") is False

    def test_blocks_dns_resolving_to_private_ip(self) -> None:
        """Should block URLs whose DNS resolves to private IPs."""
        with patch("api.services.url_safety._resolve_and_check_ips", return_value=True):
            assert is_safe_url("https://evil.com/photo.jpg") is False
