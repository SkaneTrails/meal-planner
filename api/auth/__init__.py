"""Authentication module for Firebase token validation."""

from api.auth.firebase import get_current_user, require_auth
from api.auth.models import AuthenticatedUser

__all__ = ["AuthenticatedUser", "get_current_user", "require_auth"]
