"""Meal plan Pydantic models."""

from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# Expected number of parts when splitting meal key
_MEAL_KEY_PARTS = 2


class MealType(str, Enum):
    """Type of meal."""

    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class PlannedMeal(BaseModel):
    """A meal planned for a specific day."""

    model_config = ConfigDict(from_attributes=True)

    date: date
    meal_type: MealType
    recipe_id: str | None = None
    recipe_title: str | None = None
    notes: str | None = None


class MealPlan(BaseModel):
    """A household's meal plan with all planned meals and notes."""

    model_config = ConfigDict(from_attributes=True)

    household_id: str = Field(..., description="Household identifier")
    meals: dict[str, str] = Field(default_factory=dict, description="Map of date_mealtype to recipe_id or custom:text")
    notes: dict[str, str] = Field(default_factory=dict, description="Map of date to note text")
    extras: list[str] = Field(
        default_factory=list, description="Recipe IDs for 'Other' section (breakfast, desserts, etc.)"
    )

    def get_meals_for_day(self, day: date) -> list[PlannedMeal]:
        """Get all meals planned for a specific day."""
        day_str = day.isoformat()
        result = []
        for key, value in self.meals.items():
            if key.startswith(day_str):
                parts = key.split("_")
                if len(parts) == _MEAL_KEY_PARTS:
                    meal_type = MealType(parts[1])
                    is_custom = value.startswith("custom:")
                    result.append(
                        PlannedMeal(
                            date=day,
                            meal_type=meal_type,
                            recipe_id=None if is_custom else value,
                            recipe_title=value[7:] if is_custom else None,
                        )
                    )
        return result

    def get_meals_by_type(self, meal_type: MealType) -> list[PlannedMeal]:
        """Get all meals of a specific type."""
        result = []
        suffix = f"_{meal_type.value}"
        for key, value in self.meals.items():
            if key.endswith(suffix):
                date_str = key[: -len(suffix)]
                is_custom = value.startswith("custom:")
                result.append(
                    PlannedMeal(
                        date=date.fromisoformat(date_str),
                        meal_type=meal_type,
                        recipe_id=None if is_custom else value,
                        recipe_title=value[7:] if is_custom else None,
                    )
                )
        return result


class MealPlanUpdate(BaseModel):
    """Update model for meal plan."""

    meals: dict[str, str | None] = Field(
        default_factory=dict, description="Map of date_mealtype to recipe_id, custom:text, or None to delete"
    )
    notes: dict[str, str | None] = Field(
        default_factory=dict, description="Map of date to note text, or None to delete"
    )
    extras: list[str] | None = Field(None, description="Recipe IDs for 'Other' section (replaces entire list)")
