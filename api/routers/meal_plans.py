"""Meal plan API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.auth.firebase import require_auth
from api.models.meal_plan import MealPlan, MealPlanUpdate
from api.storage import meal_plan_storage

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"], dependencies=[Depends(require_auth)])

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


@router.get("/{user_id}")
async def get_meal_plan(user_id: str) -> MealPlan:
    """Get a user's meal plan."""
    meals, notes = meal_plan_storage.load_meal_plan(user_id)
    return MealPlan(user_id=user_id, meals=meals, notes=notes)


@router.put("/{user_id}")
async def update_meal_plan(user_id: str, updates: MealPlanUpdate) -> MealPlan:
    """Update a user's meal plan (merge update).

    Send only the meals/notes you want to change.
    Set value to None to delete a meal or note.
    """
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
            meal_plan_storage.delete_meal(user_id, date_str, meal_type_str)
        else:
            meal_plan_storage.update_meal(user_id, date_str, meal_type_str, value)

    # Process note updates
    for date_str, note in updates.notes.items():
        meal_plan_storage.update_day_note(user_id, date_str, note or "")

    # Return updated meal plan
    meals, notes = meal_plan_storage.load_meal_plan(user_id)
    return MealPlan(user_id=user_id, meals=meals, notes=notes)


@router.post("/{user_id}/meals")
async def update_single_meal(user_id: str, request: MealUpdateRequest) -> MealPlan:
    """Update or delete a single meal."""
    if request.value is None:
        meal_plan_storage.delete_meal(user_id, request.date, request.meal_type)
    else:
        meal_plan_storage.update_meal(user_id, request.date, request.meal_type, request.value)

    meals, notes = meal_plan_storage.load_meal_plan(user_id)
    return MealPlan(user_id=user_id, meals=meals, notes=notes)


@router.post("/{user_id}/notes")
async def update_single_note(user_id: str, request: NoteUpdateRequest) -> MealPlan:
    """Update or delete a day note."""
    meal_plan_storage.update_day_note(user_id, request.date, request.note)

    meals, notes = meal_plan_storage.load_meal_plan(user_id)
    return MealPlan(user_id=user_id, meals=meals, notes=notes)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_meal_plan(user_id: str) -> None:
    """Clear all meals and notes from a user's meal plan."""
    meal_plan_storage.save_meal_plan(user_id, {}, {})
