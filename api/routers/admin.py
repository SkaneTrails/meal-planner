"""Admin API endpoints for household management.

These endpoints require superuser or admin role access.
"""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.settings import HouseholdSettingsUpdate  # noqa: TC001 - FastAPI needs at runtime
from api.storage import household_storage, recipe_storage

router = APIRouter(prefix="/admin", tags=["admin"])

# Regex for valid household names: letters, numbers, spaces, hyphens, apostrophes
# Excludes underscores and non-space whitespace (tabs, newlines)
# \p{L} = Unicode letters, \p{N} = Unicode numbers (Python re doesn't support \p, use character classes)
VALID_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9\u00C0-\u017F \-']+$")
MAX_NAME_LENGTH = 100

# Validation error messages
_ERR_NAME_EMPTY = "Name cannot be empty"
_ERR_NAME_TOO_LONG = "Name cannot exceed 100 characters"
_ERR_NAME_INVALID_CHARS = "Name can only contain letters, numbers, spaces, hyphens, and apostrophes"


def _validate_household_name(name: str) -> str:
    """Validate and normalize a household name."""
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


def _require_superuser(user: AuthenticatedUser) -> None:
    """Require user to be a superuser."""
    if user.role != "superuser":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superuser access required")


def _require_admin_or_superuser(user: AuthenticatedUser, household_id: str) -> None:
    """Require user to be a superuser or admin of the specified household."""
    if user.role == "superuser":
        return
    if user.role == "admin" and user.household_id == household_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or superuser access required")


def _require_member_or_superuser(user: AuthenticatedUser, household_id: str) -> None:
    """Require user to be a superuser or member of the specified household."""
    if user.role == "superuser":
        return
    if user.household_id == household_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Household member or superuser access required")


@router.get("/households")
async def list_households(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> list[HouseholdResponse]:
    """List all households. Superuser only."""
    _require_superuser(user)

    households = household_storage.list_all_households()
    return [HouseholdResponse(id=h.id, name=h.name, created_by=h.created_by) for h in households]


@router.post("/households", status_code=status.HTTP_201_CREATED)
async def create_household(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], request: HouseholdCreate
) -> HouseholdResponse:
    """Create a new household. Superuser only."""
    _require_superuser(user)

    # Check for duplicate name
    if household_storage.household_name_exists(request.name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"A household named '{request.name}' already exists"
        )

    household_id = household_storage.create_household(request.name, user.email)
    household = household_storage.get_household(household_id)

    if household is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create household")

    return HouseholdResponse(id=household.id, name=household.name, created_by=household.created_by)


@router.get("/households/{household_id}")
async def get_household(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str
) -> HouseholdResponse:
    """Get a household by ID. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    household = household_storage.get_household(household_id)
    if household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    return HouseholdResponse(id=household.id, name=household.name, created_by=household.created_by)


@router.patch("/households/{household_id}")
async def rename_household(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, request: HouseholdUpdate
) -> HouseholdResponse:
    """Rename a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    # Verify household exists
    household = household_storage.get_household(household_id)
    if household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Check for duplicate name (excluding current household)
    if household_storage.household_name_exists(request.name, exclude_id=household_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"A household named '{request.name}' already exists"
        )

    # Update the name
    household_storage.update_household(household_id, request.name)

    return HouseholdResponse(id=household_id, name=request.name, created_by=household.created_by)


@router.get("/households/{household_id}/members")
async def list_members(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str
) -> list[MemberResponse]:
    """List all members of a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    # Verify household exists
    if household_storage.get_household(household_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    members = household_storage.list_household_members(household_id)
    return [
        MemberResponse(email=m.email, household_id=m.household_id, role=m.role, display_name=m.display_name)
        for m in members
    ]


@router.post("/households/{household_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, request: MemberAdd
) -> MemberResponse:
    """Add a member to a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    # Verify household exists
    if household_storage.get_household(household_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Check if user is already a member of any household
    existing = household_storage.get_user_membership(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User {request.email} is already a member of household {existing.household_id}",
        )

    # Validate role
    if request.role not in ("admin", "member"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'admin' or 'member'")

    household_storage.add_member(
        household_id=household_id,
        email=request.email,
        role=request.role,
        display_name=request.display_name,
        invited_by=user.email,
    )

    return MemberResponse(
        email=request.email, household_id=household_id, role=request.role, display_name=request.display_name
    )


@router.delete("/households/{household_id}/members/{email}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, email: str
) -> None:
    """Remove a member from a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    # Verify household exists
    if household_storage.get_household(household_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Verify member exists and belongs to this household
    membership = household_storage.get_user_membership(email)
    if membership is None or membership.household_id != household_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this household")

    # Prevent removing yourself (must use a different mechanism for leaving)
    if email == user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself from the household")

    household_storage.remove_member(email)


@router.get("/me")
async def get_current_user(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> dict:
    """Get the current authenticated user's info including household membership."""
    result = {"uid": user.uid, "email": user.email, "role": user.role, "household_id": user.household_id}

    if user.household_id:
        household = household_storage.get_household(user.household_id)
        if household:
            result["household_name"] = household.name

    return result


# --- Settings Endpoints ---


@router.get("/households/{household_id}/settings")
async def get_household_settings(user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str) -> dict:
    """Get settings for a household. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    settings = household_storage.get_household_settings(household_id)
    if settings is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    return settings


@router.put("/households/{household_id}/settings")
async def update_household_settings(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, settings: "HouseholdSettingsUpdate"
) -> dict:
    """Update settings for a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    # Convert to dict for storage, excluding unset fields
    settings_dict = settings.model_dump(exclude_unset=True)
    success = household_storage.update_household_settings(household_id, settings_dict)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Return the updated settings
    return household_storage.get_household_settings(household_id) or {}


# --- Recipe Management Endpoints ---


class RecipeTransfer(BaseModel):
    """Request to transfer a recipe to a different household."""

    target_household_id: str = Field(..., description="The household ID to transfer the recipe to")


@router.post("/recipes/{recipe_id}/transfer")
async def transfer_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, transfer: RecipeTransfer
) -> dict:
    """Transfer a recipe to a different household. Superuser only."""
    _require_superuser(user)

    # Verify target household exists
    target_household = household_storage.get_household(transfer.target_household_id)
    if target_household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target household not found")

    # Transfer the recipe
    recipe = recipe_storage.transfer_recipe_to_household(recipe_id, transfer.target_household_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return {
        "id": recipe.id,
        "title": recipe.title,
        "household_id": recipe.household_id,
        "message": f"Recipe transferred to {target_household.name}",
    }
