"""Grocery list API endpoints."""

from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.auth.firebase import require_auth
from api.auth.models import AuthenticatedUser
from api.models.grocery_list import (
    GroceryItem,
    GroceryList,
    GroceryListState,
    GroceryListStatePatch,
    GroceryListStateSave,
    QuantitySource,
)
from api.services.grocery_categories import detect_category
from api.services.ingredient_parser import parse_ingredient
from api.storage import grocery_list_storage, meal_plan_storage
from api.storage.recipe_queries import get_recipes_by_ids

router = APIRouter(prefix="/grocery", tags=["grocery"])

_MEAL_KEY_PARTS = 2


def _get_today() -> date:
    """Get today's date (UTC)."""
    return datetime.now(tz=UTC).date()


def _require_household(user: AuthenticatedUser) -> str:
    """Require user to have a household, return household_id."""
    if not user.household_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of a household to access grocery lists"
        )
    return user.household_id


@router.get("")
async def generate_grocery_list(
    user: Annotated[AuthenticatedUser, Depends(require_auth)],
    start_date: Annotated[date | None, Query(description="Start date for meal plan range")] = None,
    end_date: Annotated[date | None, Query(description="End date for meal plan range")] = None,
    days: Annotated[int, Query(ge=1, le=30, description="Number of days if start_date not provided")] = 7,
) -> GroceryList:
    """Generate a grocery list from the current user's household meal plan.

    If start_date is not provided, uses today as start.
    If end_date is not provided, uses an inclusive range of `days` starting at start_date
    (i.e., end_date = start_date + timedelta(days=days - 1)).
    """
    household_id = _require_household(user)

    # Determine date range
    effective_start = start_date if start_date is not None else _get_today()
    effective_end = end_date if end_date is not None else effective_start + timedelta(days=days - 1)

    # Load meal plan
    meals, _ = meal_plan_storage.load_meal_plan(household_id)

    # Collect recipe IDs for the date range
    recipe_ids: set[str] = set()
    for key, value in meals.items():
        parts = key.rsplit("_", 1)
        if len(parts) != _MEAL_KEY_PARTS:
            continue
        date_str, _ = parts
        try:
            meal_date = date.fromisoformat(date_str)
        except ValueError:
            continue

        # Check date range and skip custom meals
        if effective_start <= meal_date <= effective_end and not value.startswith("custom:"):
            recipe_ids.add(value)

    # Load recipes and collect ingredients
    grocery_list = GroceryList()

    # Batch-fetch all recipes at once instead of N individual reads
    recipes_by_id = get_recipes_by_ids(recipe_ids)

    for recipe_id in recipe_ids:
        recipe = recipes_by_id.get(recipe_id)
        if recipe is None:
            continue

        for ingredient_str in recipe.ingredients:
            parsed = parse_ingredient(ingredient_str)

            item = GroceryItem(
                name=parsed.name or ingredient_str,
                quantity=str(parsed.quantity) if parsed.quantity else None,
                unit=parsed.unit,
                category=detect_category(parsed.name or ingredient_str),
                recipe_sources=[recipe.title],
                quantity_sources=[QuantitySource(quantity=parsed.quantity, unit=parsed.unit, recipe=recipe.title)],
            )

            grocery_list.add_item(item)

    return grocery_list


# ---------------------------------------------------------------------------
# Grocery list state endpoints (Firestore-backed, shared across household)
# ---------------------------------------------------------------------------


@router.get("/state")
async def get_grocery_state(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> GroceryListState:
    """Load the household's persisted grocery list state.

    Returns saved selections, servings, checked items, and custom items.
    If no state exists yet, returns an empty default state.
    """
    household_id = _require_household(user)
    data = grocery_list_storage.load_grocery_state(household_id)
    if data is None:
        return GroceryListState()
    return GroceryListState(**data)


@router.put("/state")
async def save_grocery_state(
    body: GroceryListStateSave, user: Annotated[AuthenticatedUser, Depends(require_auth)]
) -> GroceryListState:
    """Save (replace) the household's grocery list state.

    All household members will see the updated state.
    """
    household_id = _require_household(user)
    data = grocery_list_storage.save_grocery_state(
        household_id,
        selected_meals=body.selected_meals,
        meal_servings=body.meal_servings,
        checked_items=body.checked_items,
        custom_items=[item.model_dump() for item in body.custom_items],
        created_by=user.email,
    )
    return GroceryListState(**data)


@router.patch("/state")
async def patch_grocery_state(
    body: GroceryListStatePatch, user: Annotated[AuthenticatedUser, Depends(require_auth)]
) -> GroceryListState:
    """Partially update the household's grocery list state.

    Only provided fields are merged; omitted fields stay unchanged.
    Creates a new state with the provided fields if none exists yet.
    """
    household_id = _require_household(user)

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    if "custom_items" in updates:
        updates["custom_items"] = [item.model_dump() for item in body.custom_items]  # type: ignore[union-attr]

    result = grocery_list_storage.update_grocery_state(household_id, updates)
    if result is None:
        data = grocery_list_storage.save_grocery_state(
            household_id,
            selected_meals=body.selected_meals or [],
            meal_servings=body.meal_servings or {},
            checked_items=body.checked_items or [],
            custom_items=[item.model_dump() for item in (body.custom_items or [])],
            created_by=user.email,
        )
        return GroceryListState(**data)
    return GroceryListState(**result)


@router.delete("/state", status_code=status.HTTP_204_NO_CONTENT)
async def clear_grocery_state(user: Annotated[AuthenticatedUser, Depends(require_auth)]) -> None:
    """Clear (delete) the household's grocery list state."""
    household_id = _require_household(user)
    grocery_list_storage.delete_grocery_state(household_id)
