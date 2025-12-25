"""Meal plan data model."""

from dataclasses import dataclass, field
from datetime import date
from enum import Enum


class MealType(Enum):
    """Type of meal."""

    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


@dataclass
class PlannedMeal:
    """A meal planned for a specific day."""

    date: date
    meal_type: MealType
    recipe_id: str | None = None
    recipe_title: str | None = None
    notes: str | None = None


@dataclass
class WeeklyPlan:
    """A week's worth of meal planning."""

    start_date: date
    meals: list[PlannedMeal] = field(default_factory=list)

    def get_meals_for_day(self, day: date) -> list[PlannedMeal]:
        """Get all meals planned for a specific day."""
        return [m for m in self.meals if m.date == day]

    def get_meals_by_type(self, meal_type: MealType) -> list[PlannedMeal]:
        """Get all meals of a specific type for the week."""
        return [m for m in self.meals if m.meal_type == meal_type]
