"""Recipe data model."""

from dataclasses import dataclass, field
from enum import Enum


class DietLabel(Enum):
    """Diet type labels for recipes."""

    VEGGIE = "veggie"
    FISH = "fish"
    MEAT = "meat"


class MealLabel(Enum):
    """Meal type labels for recipes."""

    BREAKFAST = "breakfast"
    STARTER = "starter"
    MEAL = "meal"
    DESSERT = "dessert"
    DRINK = "drink"
    SAUCE = "sauce"
    PICKLE = "pickle"


@dataclass
class Recipe:
    """A recipe with ingredients and instructions."""

    title: str
    url: str
    ingredients: list[str] = field(default_factory=list)
    instructions: list[str] = field(default_factory=list)
    image_url: str | None = None
    servings: int | None = None
    prep_time: int | None = None  # in minutes
    cook_time: int | None = None  # in minutes
    total_time: int | None = None  # in minutes
    cuisine: str | None = None
    category: str | None = None
    tags: list[str] = field(default_factory=list)
    diet_label: DietLabel | None = None
    meal_label: MealLabel | None = None

    @property
    def total_time_calculated(self) -> int | None:
        """Calculate total time from prep and cook time if not provided."""
        if self.total_time:
            return self.total_time
        if self.prep_time and self.cook_time:
            return self.prep_time + self.cook_time
        return self.prep_time or self.cook_time
