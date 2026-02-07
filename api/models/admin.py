"""Admin Pydantic models for household management."""

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

VALID_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9\u00C0-\u017F \-']+$")
MAX_NAME_LENGTH = 100

_ERR_NAME_EMPTY = "Name cannot be empty"
_ERR_NAME_TOO_LONG = "Name cannot exceed 100 characters"
_ERR_NAME_INVALID_CHARS = "Name can only contain letters, numbers, spaces, hyphens, and apostrophes"


def _validate_household_name(name: str) -> str:
    """Validate and normalize a household name.

    Args:
        name: Raw household name to validate.

    Returns:
        Stripped and validated name.

    Raises:
        ValueError: If name is empty, too long, or contains invalid characters.
    """
    name = name.strip()
    if not name:
        raise ValueError(_ERR_NAME_EMPTY)
    if len(name) > MAX_NAME_LENGTH:
        raise ValueError(_ERR_NAME_TOO_LONG)
    if not VALID_NAME_PATTERN.match(name):
        raise ValueError(_ERR_NAME_INVALID_CHARS)
    return name


class HouseholdCreate(BaseModel):
    """Request to create a new household."""

    name: str = Field(..., min_length=1, max_length=100, description="Household display name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return _validate_household_name(v)


class HouseholdUpdate(BaseModel):
    """Request to update a household."""

    name: str = Field(..., min_length=1, max_length=100, description="New household name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return _validate_household_name(v)


class HouseholdResponse(BaseModel):
    """Response containing household details."""

    id: str
    name: str
    created_by: str


class MemberAdd(BaseModel):
    """Request to add a member to a household."""

    email: EmailStr = Field(..., description="Email of the user to add")
    role: str = Field(default="member", description="Role: admin or member")
    display_name: str | None = Field(None, description="Display name for the member")


class MemberResponse(BaseModel):
    """Response containing member details."""

    email: str
    household_id: str
    role: str
    display_name: str | None


class RecipeTransfer(BaseModel):
    """Request to transfer a recipe to a different household."""

    target_household_id: str = Field(..., description="The household ID to transfer the recipe to")


class TransferResponse(BaseModel):
    """Response from a recipe transfer."""

    id: str
    title: str
    household_id: str | None
    message: str


class CurrentUserResponse(BaseModel):
    """Response containing current user info."""

    uid: str
    email: str
    role: str
    household_id: str | None = None
    household_name: str | None = None
