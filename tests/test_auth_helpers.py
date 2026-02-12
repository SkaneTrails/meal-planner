"""Tests for shared auth helper functions."""

import pytest
from fastapi import HTTPException

from api.auth.helpers import require_household
from api.auth.models import AuthenticatedUser


def _make_user(*, household_id: str | None = None) -> AuthenticatedUser:
    return AuthenticatedUser(uid="test-uid", email="test@example.com", household_id=household_id)


class TestRequireHousehold:
    def test_returns_household_id_when_present(self) -> None:
        user = _make_user(household_id="hh-123")
        assert require_household(user) == "hh-123"

    def test_raises_403_when_no_household(self) -> None:
        user = _make_user(household_id=None)
        with pytest.raises(HTTPException) as exc_info:
            require_household(user)
        assert exc_info.value.status_code == 403
        assert "household" in str(exc_info.value.detail).lower()
