"""Tests for production auth bypass guard in api/auth/firebase.py."""

import asyncio
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.security import HTTPAuthorizationCredentials

from api.auth.firebase import _guard_production_bypass, _resolve_user_access, get_current_user, require_auth
from api.auth.models import AuthenticatedUser


def _run(coro: Any) -> Any:
    """Run an async function synchronously."""
    return asyncio.run(coro)


class TestGuardProductionBypass:
    """Tests for the _guard_production_bypass helper."""

    def test_raises_when_k_service_is_set(self) -> None:
        """Should raise RuntimeError in Cloud Run (K_SERVICE present)."""
        with (
            patch.dict("os.environ", {"K_SERVICE": "meal-planner-api"}),
            pytest.raises(RuntimeError, match="not allowed in production"),
        ):
            _guard_production_bypass("SKIP_AUTH")

    def test_allows_when_k_service_not_set(self) -> None:
        """Should not raise when K_SERVICE is absent (local dev)."""
        with patch.dict("os.environ", {}, clear=True):
            _guard_production_bypass("SKIP_AUTH")

    def test_error_message_includes_flag_name(self) -> None:
        """Should include the specific flag name in the error."""
        with patch.dict("os.environ", {"K_SERVICE": "api"}), pytest.raises(RuntimeError, match="SKIP_ALLOWLIST"):
            _guard_production_bypass("SKIP_ALLOWLIST")


class TestGetCurrentUserProductionGuard:
    """Tests for SKIP_AUTH production guard in get_current_user."""

    def test_skip_auth_blocked_in_production(self) -> None:
        """Should raise RuntimeError when SKIP_AUTH is true in Cloud Run."""
        creds = MagicMock(spec=HTTPAuthorizationCredentials)
        with (
            patch.dict("os.environ", {"SKIP_AUTH": "true", "K_SERVICE": "api"}),
            pytest.raises(RuntimeError, match="not allowed in production"),
        ):
            _run(get_current_user(creds))

    def test_skip_auth_works_locally(self) -> None:
        """Should return dev user when SKIP_AUTH is true without K_SERVICE."""
        creds = MagicMock(spec=HTTPAuthorizationCredentials)
        env = {"SKIP_AUTH": "true"}
        with patch.dict("os.environ", env, clear=True):
            result = _run(get_current_user(creds))

        assert result is not None
        assert result.uid == "dev-user"
        assert result.email == "dev@localhost"

    def test_skip_auth_returns_none_without_credentials(self) -> None:
        """Should return None when SKIP_AUTH is true but no credentials provided."""
        env = {"SKIP_AUTH": "true"}
        with patch.dict("os.environ", env, clear=True):
            result = _run(get_current_user(None))

        assert result is None


class TestRequireAuthProductionGuard:
    """Tests for SKIP_AUTH production guard in require_auth."""

    def test_skip_auth_blocked_in_production(self) -> None:
        """Should raise RuntimeError when SKIP_AUTH is true in Cloud Run."""
        user = AuthenticatedUser(uid="u1", email="a@b.com", name="Test", picture=None)
        with (
            patch.dict("os.environ", {"SKIP_AUTH": "true", "K_SERVICE": "api"}),
            pytest.raises(RuntimeError, match="not allowed in production"),
        ):
            _run(require_auth(user))

    def test_skip_auth_returns_dev_user_locally(self) -> None:
        """Should return superuser dev user when SKIP_AUTH is true locally."""
        user = AuthenticatedUser(uid="u1", email="a@b.com", name="Test", picture=None)
        env = {"SKIP_AUTH": "true", "DEV_HOUSEHOLD_ID": "h1"}
        with patch.dict("os.environ", env, clear=True):
            result = _run(require_auth(user))

        assert result.uid == "dev-user"
        assert result.role == "superuser"
        assert result.household_id == "h1"


class TestResolveUserAccessProductionGuard:
    """Tests for SKIP_ALLOWLIST production guard in _resolve_user_access."""

    def test_skip_allowlist_blocked_in_production(self) -> None:
        """Should raise RuntimeError when SKIP_ALLOWLIST is true in Cloud Run."""
        user = AuthenticatedUser(uid="u1", email="a@b.com", name="Test", picture=None)
        with (
            patch.dict("os.environ", {"SKIP_ALLOWLIST": "true", "K_SERVICE": "api"}),
            pytest.raises(RuntimeError, match="not allowed in production"),
        ):
            _run(_resolve_user_access(user))

    def test_skip_allowlist_returns_superuser_locally(self) -> None:
        """Should return superuser when SKIP_ALLOWLIST is true locally."""
        user = AuthenticatedUser(uid="u1", email="a@b.com", name="Test", picture=None)
        env = {"SKIP_ALLOWLIST": "true", "DEV_HOUSEHOLD_ID": "h1"}
        with patch.dict("os.environ", env, clear=True):
            result = _run(_resolve_user_access(user))

        assert result is not None
        assert result.role == "superuser"
        assert result.household_id == "h1"
        assert result.email == "a@b.com"
