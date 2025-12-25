"""Tests for recipe model."""

from app.models.recipe import DietLabel, MealLabel, Recipe


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
        recipe = Recipe(title="Test Recipe", url="https://example.com/test", prep_time=15, cook_time=30)
        assert recipe.total_time_calculated == 45

    def test_recipe_total_time_explicit(self) -> None:
        """Test that explicit total_time takes precedence."""
        recipe = Recipe(
            title="Test Recipe",
            url="https://example.com/test",
            prep_time=15,
            cook_time=30,
            total_time=60,  # Explicitly set different from sum
        )
        assert recipe.total_time_calculated == 60

    def test_recipe_total_time_partial(self) -> None:
        """Test total time when only one time is provided."""
        recipe = Recipe(title="Test Recipe", url="https://example.com/test", prep_time=15)
        assert recipe.total_time_calculated == 15

    def test_recipe_default_lists(self) -> None:
        """Test that lists default to empty."""
        recipe = Recipe(title="Minimal", url="https://example.com")
        assert recipe.ingredients == []
        assert recipe.instructions == []
        assert recipe.tags == []

    def test_recipe_with_diet_label(self) -> None:
        """Test recipe creation with diet label."""
        recipe = Recipe(title="Veggie Pasta", url="https://example.com/veggie", diet_label=DietLabel.VEGGIE)
        assert recipe.diet_label == DietLabel.VEGGIE
        assert recipe.diet_label.value == "veggie"

    def test_recipe_with_meal_label(self) -> None:
        """Test recipe creation with meal label."""
        recipe = Recipe(title="Chocolate Cake", url="https://example.com/cake", meal_label=MealLabel.DESSERT)
        assert recipe.meal_label == MealLabel.DESSERT
        assert recipe.meal_label.value == "dessert"

    def test_recipe_with_all_labels(self) -> None:
        """Test recipe creation with both diet and meal labels."""
        recipe = Recipe(
            title="Fish Starter",
            url="https://example.com/fish-starter",
            diet_label=DietLabel.FISH,
            meal_label=MealLabel.STARTER,
        )
        assert recipe.diet_label == DietLabel.FISH
        assert recipe.meal_label == MealLabel.STARTER

    def test_recipe_labels_default_none(self) -> None:
        """Test that labels default to None."""
        recipe = Recipe(title="Simple Recipe", url="https://example.com")
        assert recipe.diet_label is None
        assert recipe.meal_label is None
