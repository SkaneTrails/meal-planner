"""Shared auth helper functions for route handlers."""

from fastapi import HTTPException, status

from api.auth.models import AuthenticatedUser


def require_household(user: AuthenticatedUser) -> str:
    """Require user to have a household, return household_id.

    Raises:
        HTTPException: 403 if user has no household membership.
    """
    if not user.household_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to perform this action"
        )
    return user.household_id
