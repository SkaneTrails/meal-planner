"""Tests for recipe data mapping utilities."""

from api.models.recipe import Recipe, RecipeCreate
from api.services.recipe_mapper import build_recipe_create_from_enhanced, build_recipe_create_from_scraped


def _make_recipe(**overrides: object) -> Recipe:
    """Create a Recipe with sensible defaults for testing."""
    defaults = {
        "id": "test-id",
        "title": "Original Title",
        "url": "https://example.com/recipe",
        "ingredients": ["1 cup flour", "2 eggs"],
        "instructions": ["Mix ingredients", "Bake at 180°C"],
        "servings": 4,
    }
    defaults.update(overrides)
    return Recipe(**defaults)


class TestBuildRecipeCreateFromScraped:
    """Tests for build_recipe_create_from_scraped."""

    def test_basic_mapping(self) -> None:
        """All required fields should map correctly."""
        scraped = {
            "title": "Pasta Carbonara",
            "url": "https://example.com/carbonara",
            "ingredients": ["200g spaghetti", "100g pancetta"],
            "instructions": ["Boil pasta", "Mix with eggs"],
        }
        result = build_recipe_create_from_scraped(scraped)

        assert isinstance(result, RecipeCreate)
        assert result.title == "Pasta Carbonara"
        assert result.ingredients == ["200g spaghetti", "100g pancetta"]
        assert result.instructions == ["Boil pasta", "Mix with eggs"]

    def test_optional_fields_default(self) -> None:
        """Missing optional fields should use defaults."""
        scraped = {"title": "Test", "url": "https://example.com"}
        result = build_recipe_create_from_scraped(scraped)

        assert result.ingredients == []
        assert result.instructions == []
        assert result.image_url is None
        assert result.servings is None


class TestBuildRecipeCreateFromEnhanced:
    """Tests for build_recipe_create_from_enhanced."""

    def test_enhanced_fields_override_fallback(self) -> None:
        """Enhanced data should override fallback recipe values."""
        fallback = _make_recipe()
        enhanced_data = {
            "title": "Enhanced Title",
            "ingredients": ["200g refined flour", "3 large eggs"],
            "instructions": ["Sift flour", "Whisk eggs", "Combine"],
        }
        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert result.title == "Enhanced Title"
        assert result.ingredients == ["200g refined flour", "3 large eggs"]
        assert len(result.instructions) == 3

    def test_missing_enhanced_fields_use_fallback(self) -> None:
        """Fields not in enhanced_data should fall back to original recipe."""
        fallback = _make_recipe(servings=6, image_url="https://example.com/image.jpg")
        enhanced_data = {"ingredients": ["better ingredient"]}

        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert result.title == "Original Title"
        assert result.url == "https://example.com/recipe"
        assert result.servings == 6
        assert result.image_url == "https://example.com/image.jpg"

    def test_dict_ingredients_coerced_to_strings(self) -> None:
        """Structured ingredient dicts from Gemini should be coerced to strings.

        This is the exact production bug: Gemini returns
        ``[{"item": "Fennel", "quantity": "1.75", "unit": "lbs"}, ...]``
        which previously caused a Pydantic ValidationError.
        """
        fallback = _make_recipe()
        enhanced_data = {
            "ingredients": [
                {"item": "Fennel", "quantity": "1.75", "unit": "lbs"},
                {"item": "Olive oil", "quantity": "2", "unit": "tbsp"},
                {"item": "Garlic", "quantity": "3", "unit": "cloves"},
            ]
        }
        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert isinstance(result, RecipeCreate)
        assert all(isinstance(ing, str) for ing in result.ingredients)
        assert result.ingredients[0] == "1.75 lbs Fennel"
        assert result.ingredients[1] == "2 tbsp Olive oil"
        assert result.ingredients[2] == "3 cloves Garlic"

    def test_mixed_string_and_dict_ingredients(self) -> None:
        """A mix of plain strings and structured dicts should all become strings."""
        fallback = _make_recipe()
        enhanced_data = {"ingredients": ["200g spaghetti", {"item": "Pancetta", "quantity": "100", "unit": "g"}]}
        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert result.ingredients == ["200g spaghetti", "100 g Pancetta"]

    def test_metadata_fields_mapped(self) -> None:
        """Cuisine, category, tags, and tips should be mapped from enhanced data."""
        fallback = _make_recipe()
        enhanced_data = {
            "cuisine": "Italian",
            "category": "Pasta",
            "tags": ["quick", "weeknight"],
            "tips": "Use freshly grated parmesan for best results.",
        }
        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert result.cuisine == "Italian"
        assert result.category == "Pasta"
        assert result.tags == ["quick", "weeknight"]
        assert result.tips == "Use freshly grated parmesan for best results."

    def test_accepts_recipe_create_as_fallback(self) -> None:
        """Should work with RecipeCreate as fallback (not just Recipe)."""
        fallback = RecipeCreate(title="Original", url="https://example.com", ingredients=["1 cup flour"])
        enhanced_data = {"title": "Better Original"}
        result = build_recipe_create_from_enhanced(enhanced_data, fallback)

        assert result.title == "Better Original"
        assert result.url == "https://example.com"
        assert result.ingredients == ["1 cup flour"]
