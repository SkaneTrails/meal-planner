"""Meal plan API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
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


def _require_household(user: AuthenticatedUser) -> str:
    """Require user to have a household, return household_id."""
    if not user.household_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to access meal plans"
        )
    return user.household_id


@router.get("")
async def get_meal_plan(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> MealPlan:
    """Get the current user's household meal plan."""
    household_id = _require_household(user)
    meals, notes = meal_plan_storage.load_meal_plan(household_id)
    return MealPlan(user_id=household_id, meals=meals, notes=notes)


@router.put("")
async def update_meal_plan(
    updates: MealPlanUpdate, user: Annotated[AuthenticatedUser, Depends(require_auth)]
) -> MealPlan:
    """Update the current user's household meal plan (merge update).

    Send only the meals/notes you want to change.
    Set value to None to delete a meal or note.
    """
    household_id = _require_household(user)

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
            meal_plan_storage.delete_meal(household_id, date_str, meal_type_str)
        else:
            meal_plan_storage.update_meal(household_id, date_str, meal_type_str, value)

    # Process note updates
    for date_str, note in updates.notes.items():
        meal_plan_storage.update_day_note(household_id, date_str, note or "")

    # Return updated meal plan
    meals, notes = meal_plan_storage.load_meal_plan(household_id)
    return MealPlan(user_id=household_id, meals=meals, notes=notes)


@router.post("/meals")
async def update_single_meal(
    request: MealUpdateRequest, user: Annotated[AuthenticatedUser, Depends(require_auth)]
) -> MealPlan:
    """Update or delete a single meal."""
    household_id = _require_household(user)

    if request.value is None:
        meal_plan_storage.delete_meal(household_id, request.date, request.meal_type)
    else:
        meal_plan_storage.update_meal(household_id, request.date, request.meal_type, request.value)

    meals, notes = meal_plan_storage.load_meal_plan(household_id)
    return MealPlan(user_id=household_id, meals=meals, notes=notes)


@router.post("/notes")
async def update_single_note(
    request: NoteUpdateRequest, user: Annotated[AuthenticatedUser, Depends(require_auth)]
) -> MealPlan:
    """Update or delete a day note."""
    household_id = _require_household(user)
    meal_plan_storage.update_day_note(household_id, request.date, request.note)

    meals, notes = meal_plan_storage.load_meal_plan(household_id)
    return MealPlan(user_id=household_id, meals=meals, notes=notes)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_meal_plan(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> None:
    """Clear all meals and notes from the current user's household meal plan."""
    household_id = _require_household(user)
    meal_plan_storage.save_meal_plan(household_id, {}, {})
