"""Firebase Authentication middleware for FastAPI."""

import logging
import os
from functools import lru_cache
from typing import Annotated

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials

from api.auth.models import AuthenticatedUser
from api.storage.household_storage import get_user_membership, is_superuser

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_firebase_app() -> firebase_admin.App:  # pragma: no cover
    """Get or initialize Firebase Admin app (cached)."""
    # Check if already initialized
    try:
        return firebase_admin.get_app()
    except ValueError:
        # Not initialized, create new app
        # Uses ADC in Cloud Run, or GOOGLE_APPLICATION_CREDENTIALS locally
        cred = credentials.ApplicationDefault()
        return firebase_admin.initialize_app(cred)


# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


async def get_current_user(  # pragma: no cover
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> AuthenticatedUser | None:
    """
    Extract and validate Firebase ID token from Authorization header.

    Returns None if no token provided (for optional auth endpoints).
    Raises HTTPException if token is invalid.
    """
    if credentials is None:
        return None

    token = credentials.credentials

    try:
        # Ensure Firebase is initialized
        _get_firebase_app()

        # Verify the ID token
        decoded_token = auth.verify_id_token(token)

        return AuthenticatedUser(
            uid=decoded_token["uid"],
            email=decoded_token.get("email", ""),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture"),
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def require_auth(
    user: Annotated[AuthenticatedUser | None, Depends(get_current_user)],
) -> AuthenticatedUser:  # pragma: no cover
    """
    Require authentication for an endpoint.

    Use as a dependency to enforce authentication.
    Resolves user's household membership and role.
    """
    # Skip auth in development mode
    if os.getenv("SKIP_AUTH", "").lower() == "true":
        return AuthenticatedUser(
            uid="dev-user",
            email="dev@localhost",
            name="Dev User",
            picture=None,
            household_id="dev-household",
            role="superuser",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve user access and household membership
    resolved_user = await _resolve_user_access(user)
    if resolved_user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized to access this application"
        )

    return resolved_user


async def _resolve_user_access(user: AuthenticatedUser) -> AuthenticatedUser | None:  # pragma: no cover
    """
    Resolve user's access level and household membership.

    Returns updated AuthenticatedUser with household_id and role set,
    or None if user has no access.

    Access hierarchy:
    1. Superusers (in superusers collection) - global access, no household required
    2. Household members (in household_members collection) - household-scoped access
    """
    # Skip access check in development mode
    if os.getenv("SKIP_ALLOWLIST", "").lower() == "true":
        return AuthenticatedUser(
            uid=user.uid,
            email=user.email,
            name=user.name,
            picture=user.picture,
            household_id="dev-household",
            role="superuser",
        )

    try:
        # Check if user is a superuser (global access)
        if is_superuser(user.email):
            # Superuser may also be in a household
            membership = get_user_membership(user.email)
            return AuthenticatedUser(
                uid=user.uid,
                email=user.email,
                name=user.name,
                picture=user.picture,
                household_id=membership.household_id if membership else None,
                role="superuser",
            )

        # Check household membership
        membership = get_user_membership(user.email)
        if membership:
            return AuthenticatedUser(
                uid=user.uid,
                email=user.email,
                name=user.name,
                picture=user.picture,
                household_id=membership.household_id,
                role=membership.role,
            )

        # User has no access
        return None

    except Exception:
        logger.exception("Error resolving user access")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authorization service temporarily unavailable"
        ) from None
