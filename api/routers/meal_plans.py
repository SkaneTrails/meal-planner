"""Meal plan API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.meal_plan import MealPlan, MealPlanUpdate
from api.storage import meal_plan_storage

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])

# Expected number of parts when splitting meal key
_MEAL_KEY_PARTS = 2


class MealUpdateRequest(BaseModel):
    """Request to update a single meal."""

    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    meal_type: str = Field(..., description="Meal type (breakfast, lunch, dinner, snack)")
    value: str | None = Field(None, description="Recipe ID, 'custom:text', or None to delete")


class NoteUpdateRequest(BaseModel):
    """Request to update a day note."""

    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    note: str = Field(..., description="Note text (empty to delete)")


def _resolve_household(user: AuthenticatedUser, household_id_override: str | None = None) -> str:
    """Resolve household ID for the request.

    Superusers can specify any household via override.
    Regular users must use their own household.
    Returns the resolved household_id or raises 403.
    """
    # Superusers can access any household, but must provide a valid ID
    if user.role == "superuser" and household_id_override is not None:
        if not household_id_override.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="household_id parameter must be a non-empty string"
            )
        return household_id_override

    # Use user's household if available
    if user.household_id:
        return user.household_id

    # Superuser without household and no override specified
    if user.role == "superuser":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superuser must specify household_id parameter to access meal plans",
        )

    # Regular user without household
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to access meal plans"
    )


@router.get("")
async def get_meal_plan(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    household_id: Annotated[str | None, Query(description="Household ID (superuser only)")] = None,
) -> MealPlan:
    """Get meal plan for a household.

    Regular users get their own household's meal plan.
    Superusers can specify any household_id to view.
    """
    resolved_id = _resolve_household(user, household_id)
    meals, notes = meal_plan_storage.load_meal_plan(resolved_id)
    return MealPlan(user_id=resolved_id, meals=meals, notes=notes)


@router.put("")
async def update_meal_plan(
    updates: MealPlanUpdate,
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    household_id: Annotated[str | None, Query(description="Household ID (superuser only)")] = None,
) -> MealPlan:
    """Update meal plan (merge update).

    Send only the meals/notes you want to change.
    Set value to None to delete a meal or note.
    Superusers can specify household_id to update any household.
    """
    resolved_id = _resolve_household(user, household_id)

    # Process meal updates
    for key, value in updates.meals.items():
        parts = key.rsplit("_", 1)
        if len(parts) != _MEAL_KEY_PARTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid meal key format: {key}. Expected 'YYYY-MM-DD_mealtype'",
            )
        date_str, meal_type_str = parts

        if value is None:
            meal_plan_storage.delete_meal(resolved_id, date_str, meal_type_str)
        else:
            meal_plan_storage.update_meal(resolved_id, date_str, meal_type_str, value)

    # Process note updates
    for date_str, note in updates.notes.items():
        meal_plan_storage.update_day_note(resolved_id, date_str, note or "")

    # Return updated meal plan
    meals, notes = meal_plan_storage.load_meal_plan(resolved_id)
    return MealPlan(user_id=resolved_id, meals=meals, notes=notes)


@router.post("/meals")
async def update_single_meal(
    request: MealUpdateRequest,
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    household_id: Annotated[str | None, Query(description="Household ID (superuser only)")] = None,
) -> MealPlan:
    """Update or delete a single meal.

    Superusers can specify household_id to update any household.
    """
    resolved_id = _resolve_household(user, household_id)

    if request.value is None:
        meal_plan_storage.delete_meal(resolved_id, request.date, request.meal_type)
    else:
        meal_plan_storage.update_meal(resolved_id, request.date, request.meal_type, request.value)

    meals, notes = meal_plan_storage.load_meal_plan(resolved_id)
    return MealPlan(user_id=resolved_id, meals=meals, notes=notes)


@router.post("/notes")
async def update_single_note(
    request: NoteUpdateRequest,
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    household_id: Annotated[str | None, Query(description="Household ID (superuser only)")] = None,
) -> MealPlan:
    """Update or delete a day note.

    Superusers can specify household_id to update any household.
    """
    resolved_id = _resolve_household(user, household_id)
    meal_plan_storage.update_day_note(resolved_id, request.date, request.note)

    meals, notes = meal_plan_storage.load_meal_plan(resolved_id)
    return MealPlan(user_id=resolved_id, meals=meals, notes=notes)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_meal_plan(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    household_id: Annotated[str | None, Query(description="Household ID (superuser only)")] = None,
) -> None:
    """Clear all meals and notes from a household's meal plan.

    Superusers can specify household_id to clear any household.
    """
    resolved_id = _resolve_household(user, household_id)
    meal_plan_storage.save_meal_plan(resolved_id, {}, {})
