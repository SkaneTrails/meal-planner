"""Firebase Authentication middleware for FastAPI."""

import os
from functools import lru_cache
from typing import Annotated

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials

from api.auth.models import AuthenticatedUser
from api.storage.firestore_client import get_firestore_client


@lru_cache(maxsize=1)
def _get_firebase_app() -> firebase_admin.App:
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


async def get_current_user(
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
    except auth.InvalidIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except auth.ExpiredIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def require_auth(user: Annotated[AuthenticatedUser | None, Depends(get_current_user)]) -> AuthenticatedUser:
    """
    Require authentication for an endpoint.

    Use as a dependency to enforce authentication.
    Also checks if user is in the allowlist.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is in allowlist
    if not await _is_user_allowed(user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized to access this application"
        )

    return user


async def _is_user_allowed(email: str) -> bool:
    """
    Check if user email is in the allowlist.

    Allowlist is stored in Firestore collection 'allowed_users'.
    Each document has an 'email' field.
    """
    # Skip allowlist check in development mode
    if os.getenv("SKIP_ALLOWLIST", "").lower() == "true":
        return True

    try:
        db = get_firestore_client(database="meal-planner")
    except Exception:
        # If Firestore is not available, deny access in production
        return os.getenv("SKIP_ALLOWLIST", "").lower() == "true"

    # Check if email exists in allowlist
    # Using email as document ID for O(1) lookup
    doc = db.collection("allowed_users").document(email).get()  # type: ignore[union-attr]
    return doc.exists  # type: ignore[union-attr]
