"""Recipe Pydantic models."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class DietLabel(str, Enum):
    """Diet type labels for recipes."""

    VEGGIE = "veggie"
    FISH = "fish"
    MEAT = "meat"


class MealLabel(str, Enum):
    """Meal type labels for recipes."""

    BREAKFAST = "breakfast"
    STARTER = "starter"
    MEAL = "meal"
    DESSERT = "dessert"
    DRINK = "drink"
    SAUCE = "sauce"
    PICKLE = "pickle"
    GRILL = "grill"


class RecipeBase(BaseModel):
    """Base recipe fields shared across models."""

    title: str = Field(..., min_length=1, max_length=500)
    url: str
    ingredients: list[str] = Field(default_factory=list)
    instructions: list[str] = Field(default_factory=list)
    image_url: str | None = None
    servings: int | None = Field(default=None, ge=1)
    prep_time: int | None = Field(default=None, ge=0, description="Prep time in minutes")
    cook_time: int | None = Field(default=None, ge=0, description="Cook time in minutes")
    total_time: int | None = Field(default=None, ge=0, description="Total time in minutes")
    cuisine: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    diet_label: DietLabel | None = None
    meal_label: MealLabel | None = None


class Recipe(RecipeBase):
    """A recipe with all fields including database ID."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Firestore document ID")

    @property
    def total_time_calculated(self) -> int | None:
        """Calculate total time from prep and cook time if not provided."""
        if self.total_time:
            return self.total_time
        if self.prep_time and self.cook_time:
            return self.prep_time + self.cook_time
        return self.prep_time or self.cook_time


class RecipeCreate(RecipeBase):
    """Recipe creation model (without ID)."""


class RecipeUpdate(BaseModel):
    """Recipe update model (all fields optional)."""

    title: str | None = Field(default=None, min_length=1, max_length=500)
    url: str | None = None
    ingredients: list[str] | None = None
    instructions: list[str] | None = None
    image_url: str | None = None
    servings: int | None = Field(default=None, ge=1)
    prep_time: int | None = Field(default=None, ge=0)
    cook_time: int | None = Field(default=None, ge=0)
    total_time: int | None = Field(default=None, ge=0)
    cuisine: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    diet_label: DietLabel | None = None
    meal_label: MealLabel | None = None


class RecipeScrapeRequest(BaseModel):
    """Request body for recipe scraping."""

    url: HttpUrl = Field(..., description="URL of the recipe to scrape")
