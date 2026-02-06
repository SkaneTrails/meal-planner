"""Tests for recipe model."""

import pytest
from pydantic import ValidationError

from api.models.recipe import DietLabel, MealLabel, Recipe, RecipeUpdate


class TestRecipe:
    """Tests for Recipe model."""

    def test_recipe_creation(self, sample_recipe) -> None:
        """Test that a recipe can be created with all fields."""
        assert sample_recipe.title == "Spaghetti Carbonara"
        assert sample_recipe.url == "https://example.com/carbonara"
        assert len(sample_recipe.ingredients) == 5
        assert len(sample_recipe.instructions) == 6
        assert sample_recipe.servings == 4

    def test_recipe_total_time_calculated(self) -> None:
        """Test total time calculation from prep and cook time."""
        recipe = Recipe(id="test1", title="Test Recipe", url="https://example.com/test", prep_time=15, cook_time=30)
        assert recipe.total_time_calculated == 45

    def test_recipe_total_time_explicit(self) -> None:
        """Test that explicit total_time takes precedence."""
        recipe = Recipe(
            id="test2",
            title="Test Recipe",
            url="https://example.com/test",
            prep_time=15,
            cook_time=30,
            total_time=60,  # Explicitly set different from sum
        )
        assert recipe.total_time_calculated == 60

    def test_recipe_total_time_partial(self) -> None:
        """Test total time when only one time is provided."""
        recipe = Recipe(id="test3", title="Test Recipe", url="https://example.com/test", prep_time=15)
        assert recipe.total_time_calculated == 15

    def test_recipe_default_lists(self) -> None:
        """Test that lists default to empty."""
        recipe = Recipe(id="test4", title="Minimal", url="https://example.com")
        assert recipe.ingredients == []
        assert recipe.instructions == []
        assert recipe.tags == []

    def test_recipe_with_diet_label(self) -> None:
        """Test recipe creation with diet label."""
        recipe = Recipe(id="test5", title="Veggie Pasta", url="https://example.com/veggie", diet_label=DietLabel.VEGGIE)
        assert recipe.diet_label == DietLabel.VEGGIE
        assert recipe.diet_label.value == "veggie"

    def test_recipe_with_meal_label(self) -> None:
        """Test recipe creation with meal label."""
        recipe = Recipe(
            id="test6", title="Chocolate Cake", url="https://example.com/cake", meal_label=MealLabel.DESSERT
        )
        assert recipe.meal_label == MealLabel.DESSERT
        assert recipe.meal_label.value == "dessert"

    def test_recipe_with_all_labels(self) -> None:
        """Test recipe creation with both diet and meal labels."""
        recipe = Recipe(
            id="test7",
            title="Fish Starter",
            url="https://example.com/fish-starter",
            diet_label=DietLabel.FISH,
            meal_label=MealLabel.STARTER,
        )
        assert recipe.diet_label == DietLabel.FISH
        assert recipe.meal_label == MealLabel.STARTER

    def test_recipe_labels_default_none(self) -> None:
        """Test that labels default to None."""
        recipe = Recipe(id="test8", title="Simple Recipe", url="https://example.com")
        assert recipe.diet_label is None
        assert recipe.meal_label is None


class TestRecipeUpdateRating:
    """Tests for RecipeUpdate rating validation."""

    def test_rating_none_clears(self) -> None:
        """Setting rating to None should clear it."""
        update = RecipeUpdate(rating=None)
        assert update.rating is None

    def test_rating_valid_values(self) -> None:
        """Valid ratings 1-5 should be accepted."""
        for value in (1, 2, 3, 4, 5):
            update = RecipeUpdate(rating=value)
            assert update.rating == value

    def test_rating_zero_rejected(self) -> None:
        """Rating of 0 should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=0)

    def test_rating_six_rejected(self) -> None:
        """Rating of 6 should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=6)

    def test_rating_negative_rejected(self) -> None:
        """Negative ratings should be rejected."""
        with pytest.raises(ValidationError, match="Rating must be between 1 and 5"):
            RecipeUpdate(rating=-1)
