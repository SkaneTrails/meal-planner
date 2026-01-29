"""Tests for API ingredient parsing service.

These tests verify api/services/ingredient_parser.py has the same behavior
as the app version to prevent regressions.
"""

from api.services.ingredient_parser import (
    ParsedIngredient,
    format_quantity,
    parse_fraction,
    parse_ingredient,
    scale_ingredients,
)


class TestParseFraction:
    """Tests for parse_fraction function in API module."""

    def test_parse_simple_integer(self) -> None:
        assert parse_fraction("2") == 2.0

    def test_parse_simple_decimal(self) -> None:
        assert parse_fraction("2.5") == 2.5

    def test_parse_simple_fraction(self) -> None:
        assert parse_fraction("1/2") == 0.5

    def test_parse_mixed_number(self) -> None:
        assert parse_fraction("1 1/2") == 1.5

    def test_parse_unicode_half(self) -> None:
        assert parse_fraction("½") == 0.5

    def test_parse_unicode_quarter(self) -> None:
        assert parse_fraction("¼") == 0.25

    def test_parse_unicode_three_quarters(self) -> None:
        assert parse_fraction("¾") == 0.75

    def test_parse_empty_string_returns_none(self) -> None:
        assert parse_fraction("") is None


class TestFormatQuantity:
    """Tests for format_quantity function in API module."""

    def test_format_whole_number(self) -> None:
        assert format_quantity(2.0) == "2"

    def test_format_half(self) -> None:
        assert format_quantity(0.5) == "1/2"

    def test_format_quarter(self) -> None:
        assert format_quantity(0.25) == "1/4"

    def test_format_mixed_number(self) -> None:
        assert format_quantity(1.5) == "1 1/2"


class TestParseIngredient:
    """Tests for parse_ingredient function in API module."""

    def test_parse_simple_ingredient(self) -> None:
        result = parse_ingredient("salt")
        assert result.name == "salt"
        assert result.quantity is None
        assert result.unit is None

    def test_parse_with_quantity(self) -> None:
        result = parse_ingredient("2 eggs")
        assert result.quantity == 2.0
        assert result.name == "eggs"
        assert result.unit is None

    def test_parse_with_quantity_and_unit(self) -> None:
        result = parse_ingredient("1 cup flour")
        assert result.quantity == 1.0
        assert result.unit == "cup"
        assert result.name == "flour"

    def test_parse_with_fraction(self) -> None:
        result = parse_ingredient("1/2 cup sugar")
        assert result.quantity == 0.5
        assert result.unit == "cup"
        assert result.name == "sugar"

    def test_parse_preserves_original(self) -> None:
        original = "2 cups all-purpose flour, sifted"
        result = parse_ingredient(original)
        assert result.original == original


class TestScaleIngredients:
    """Tests for scale_ingredients function in API module.

    Note: The API version returns formatted strings, not ParsedIngredient objects.
    """

    def test_scale_ingredients_double(self) -> None:
        ingredients = ["1 cup flour", "2 eggs"]
        scaled = scale_ingredients(ingredients, 2, 4)  # Scale from 2 to 4 servings (2x)

        assert len(scaled) == 2
        assert "2 cup" in scaled[0]  # 1 cup * 2
        assert "4" in scaled[1]  # 2 eggs * 2

    def test_scale_ingredients_half(self) -> None:
        ingredients = ["2 cups flour"]
        scaled = scale_ingredients(ingredients, 4, 2)  # Scale from 4 to 2 servings (0.5x)

        assert len(scaled) == 1
        assert "1 cup" in scaled[0]  # 2 cups / 2


class TestParsedIngredientModel:
    """Tests for ParsedIngredient Pydantic model."""

    def test_scale_method(self) -> None:
        ingredient = ParsedIngredient(quantity=2.0, unit="cups", name="flour", original="2 cups flour")
        scaled = ingredient.scale(2.0)

        assert scaled.quantity == 4.0
        assert scaled.unit == "cups"
        assert scaled.name == "flour"

    def test_format_method(self) -> None:
        ingredient = ParsedIngredient(quantity=1.5, unit="cups", name="flour", original="1 1/2 cups flour")
        formatted = ingredient.format()

        assert formatted == "1 1/2 cups flour"

    def test_format_without_unit(self) -> None:
        ingredient = ParsedIngredient(quantity=2.0, unit=None, name="eggs", original="2 eggs")
        formatted = ingredient.format()

        assert formatted == "2 eggs"

    def test_format_without_quantity(self) -> None:
        ingredient = ParsedIngredient(quantity=None, unit=None, name="salt", original="salt")
        formatted = ingredient.format()

        assert formatted == "salt"
