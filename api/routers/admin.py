"""Admin API endpoints for household management.

These endpoints require superuser or admin role access.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.admin import (
    CurrentUserResponse,
    FavoriteRecipeAdd,
    FavoriteRecipeResponse,
    HouseholdCreate,
    HouseholdResponse,
    HouseholdUpdate,
    ItemAtHomeAdd,
    ItemAtHomeResponse,
    MemberAdd,
    MemberResponse,
    RecipeTransfer,
    TransferResponse,
)
from api.models.settings import HouseholdSettings, HouseholdSettingsUpdate
from api.storage import household_storage, recipe_storage

router = APIRouter(prefix="/admin", tags=["admin"])


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

    if household is None:  # pragma: no cover
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

    # Normalize email at the API boundary for consistent comparisons and storage lookups
    normalized_email = email.lower()
    user_email = user.email.lower()

    # Verify household exists
    if household_storage.get_household(household_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Verify member exists and belongs to this household
    membership = household_storage.get_user_membership(normalized_email)
    if membership is None or membership.household_id != household_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this household")

    # Prevent removing yourself (must use a different mechanism for leaving)
    if normalized_email == user_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself from the household")

    household_storage.remove_member(normalized_email)


@router.get("/me", response_model_exclude_none=True)
async def get_current_user(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> CurrentUserResponse:
    """Get the current authenticated user's info including household membership."""
    household_name = None
    if user.household_id:
        household = household_storage.get_household(user.household_id)
        if household:
            household_name = household.name

    return CurrentUserResponse(
        uid=user.uid, email=user.email, role=user.role, household_id=user.household_id, household_name=household_name
    )


# --- Settings Endpoints ---


@router.get("/households/{household_id}/settings")
async def get_household_settings(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str
) -> HouseholdSettings:
    """Get settings for a household. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    settings = household_storage.get_household_settings(household_id)
    if settings is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    return HouseholdSettings(**settings)


@router.put("/households/{household_id}/settings")
async def update_household_settings(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, settings: "HouseholdSettingsUpdate"
) -> HouseholdSettings:
    """Update settings for a household. Superuser or household admin."""
    _require_admin_or_superuser(user, household_id)

    settings_dict = settings.model_dump(exclude_unset=True)
    success = household_storage.update_household_settings(household_id, settings_dict)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    updated = household_storage.get_household_settings(household_id) or {}
    return HouseholdSettings(**updated)


# --- Recipe Management Endpoints ---


@router.post("/recipes/{recipe_id}/transfer")
async def transfer_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], recipe_id: str, transfer: RecipeTransfer
) -> TransferResponse:
    """Transfer a recipe to a different household. Superuser only."""
    _require_superuser(user)

    target_household = household_storage.get_household(transfer.target_household_id)
    if target_household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target household not found")

    recipe = recipe_storage.transfer_recipe_to_household(recipe_id, transfer.target_household_id)
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return TransferResponse(
        id=recipe.id,
        title=recipe.title,
        household_id=recipe.household_id,
        message=f"Recipe transferred to {target_household.name}",
    )


# --- Items at Home Endpoints ---


class HouseholdNotFoundError(ValueError):
    """Raised when a household is not found."""


class ItemValidationError(ValueError):
    """Raised when an item fails validation (e.g., empty)."""


@router.get("/households/{household_id}/items-at-home")
async def get_items_at_home(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str
) -> ItemAtHomeResponse:
    """Get items-at-home list for a household. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    # Check household exists first
    household = household_storage.get_household(household_id)
    if household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    items = household_storage.get_items_at_home(household_id)
    return ItemAtHomeResponse(items_at_home=items)


@router.post("/households/{household_id}/items-at-home")
async def add_item_at_home(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, request: ItemAtHomeAdd
) -> ItemAtHomeResponse:
    """Add an item to the household's items-at-home list. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    try:
        items = household_storage.add_item_at_home(household_id, request.item)
        return ItemAtHomeResponse(items_at_home=items)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg) from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg) from e


@router.delete("/households/{household_id}/items-at-home/{item}")
async def remove_item_at_home(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, item: str
) -> ItemAtHomeResponse:
    """Remove an item from the household's items-at-home list. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    try:
        items = household_storage.remove_item_at_home(household_id, item)
        return ItemAtHomeResponse(items_at_home=items)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg) from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg) from e


# --- Favorite Recipes Endpoints ---


@router.get("/households/{household_id}/favorites")
async def get_favorite_recipes(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str
) -> FavoriteRecipeResponse:
    """Get favorite recipes for a household. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    household = household_storage.get_household(household_id)
    if household is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    favorites = household_storage.get_favorite_recipes(household_id)
    return FavoriteRecipeResponse(favorite_recipes=favorites)


@router.post("/households/{household_id}/favorites")
async def add_favorite_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, request: FavoriteRecipeAdd
) -> FavoriteRecipeResponse:
    """Add a recipe to household favorites. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    try:
        favorites = household_storage.add_favorite_recipe(household_id, request.recipe_id)
        return FavoriteRecipeResponse(favorite_recipes=favorites)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg) from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg) from e


@router.delete("/households/{household_id}/favorites/{recipe_id}")
async def remove_favorite_recipe(
    user: Annotated[AuthenticatedUser, Depends(require_auth)], household_id: str, recipe_id: str
) -> FavoriteRecipeResponse:
    """Remove a recipe from household favorites. Superuser or household member."""
    _require_member_or_superuser(user, household_id)

    try:
        favorites = household_storage.remove_favorite_recipe(household_id, recipe_id)
        return FavoriteRecipeResponse(favorite_recipes=favorites)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg) from e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg) from e
