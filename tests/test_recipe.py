"""Tests for recipe model."""

from app.models.recipe import Recipe


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
        recipe = Recipe(
            title="Test Recipe",
            url="https://example.com/test",
            prep_time=15,
            cook_time=30,
        )
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
        recipe = Recipe(
            title="Test Recipe",
            url="https://example.com/test",
            prep_time=15,
        )
        assert recipe.total_time_calculated == 15

    def test_recipe_default_lists(self) -> None:
        """Test that lists default to empty."""
        recipe = Recipe(title="Minimal", url="https://example.com")
        assert recipe.ingredients == []
        assert recipe.instructions == []
        assert recipe.tags == []
