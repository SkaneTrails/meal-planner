"""Tests for ingredient parsing and portion scaling."""

from api.services.ingredient_parser import (
    ParsedIngredient,
    format_quantity,
    parse_fraction,
    parse_ingredient,
    scale_ingredients,
)


class TestParseFraction:
    """Tests for parse_fraction function."""

    def test_parse_simple_integer(self) -> None:
        assert parse_fraction("2") == 2.0

    def test_parse_simple_decimal(self) -> None:
        assert parse_fraction("2.5") == 2.5

    def test_parse_simple_fraction(self) -> None:
        assert parse_fraction("1/2") == 0.5

    def test_parse_mixed_number(self) -> None:
        assert parse_fraction("1 1/2") == 1.5

    def test_parse_mixed_number_with_dash(self) -> None:
        assert parse_fraction("1-1/2") == 1.5

    def test_parse_unicode_half(self) -> None:
        assert parse_fraction("½") == 0.5

    def test_parse_unicode_quarter(self) -> None:
        assert parse_fraction("¼") == 0.25

    def test_parse_unicode_three_quarters(self) -> None:
        assert parse_fraction("¾") == 0.75

    def test_parse_number_with_unicode_fraction(self) -> None:
        assert parse_fraction("2½") == 2.5

    def test_parse_empty_string_returns_none(self) -> None:
        assert parse_fraction("") is None

    def test_parse_non_numeric_string_returns_none(self) -> None:
        assert parse_fraction("abc") is None

    def test_parse_word_with_slash_returns_none(self) -> None:
        assert parse_fraction("not/a-number") is None


class TestFormatQuantity:
    """Tests for format_quantity function."""

    def test_format_whole_number(self) -> None:
        assert format_quantity(2.0) == "2"

    def test_format_half(self) -> None:
        assert format_quantity(0.5) == "1/2"

    def test_format_quarter(self) -> None:
        assert format_quantity(0.25) == "1/4"

    def test_format_three_quarters(self) -> None:
        assert format_quantity(0.75) == "3/4"

    def test_format_one_and_half(self) -> None:
        assert format_quantity(1.5) == "1 1/2"

    def test_format_two_and_third(self) -> None:
        # 2.33... should become "2 1/3"
        result = format_quantity(2.33)
        assert result == "2 1/3"

    def test_format_decimal(self) -> None:
        assert format_quantity(1.75) == "1 3/4"

    def test_format_non_fraction_decimal_one_digit(self) -> None:
        assert format_quantity(1.2) == "1.2"

    def test_format_non_fraction_decimal_two_digits(self) -> None:
        assert format_quantity(1.23) == "1.23"


class TestParseIngredient:
    """Tests for parse_ingredient function."""

    def test_parse_simple_with_unit(self) -> None:
        result = parse_ingredient("2 cups flour")
        assert result.quantity == 2.0
        assert result.unit == "cups"
        assert result.name == "flour"

    def test_parse_fraction_with_unit(self) -> None:
        result = parse_ingredient("1/2 tsp salt")
        assert result.quantity == 0.5
        assert result.unit == "tsp"
        assert result.name == "salt"

    def test_parse_quantity_no_unit(self) -> None:
        result = parse_ingredient("3 eggs")
        assert result.quantity == 3.0
        assert result.unit is None
        assert result.name == "eggs"

    def test_parse_no_quantity(self) -> None:
        result = parse_ingredient("Salt to taste")
        assert result.quantity is None
        assert result.unit is None
        assert result.name == "Salt to taste"

    def test_parse_with_of(self) -> None:
        result = parse_ingredient("2 cups of flour")
        assert result.quantity == 2.0
        assert result.unit == "cups"
        assert result.name == "flour"

    def test_parse_unicode_fraction(self) -> None:
        result = parse_ingredient("½ cup milk")
        assert result.quantity == 0.5
        assert result.unit == "cup"
        assert result.name == "milk"

    def test_parse_mixed_number(self) -> None:
        result = parse_ingredient("1 1/2 cups sugar")
        assert result.quantity == 1.5
        assert result.unit == "cups"
        assert result.name == "sugar"

    def test_parse_gram_unit(self) -> None:
        result = parse_ingredient("500 g chicken breast")
        assert result.quantity == 500.0
        assert result.unit == "g"
        assert result.name == "chicken breast"

    def test_parse_swedish_units(self) -> None:
        result = parse_ingredient("2 msk olivolja")
        assert result.quantity == 2.0
        assert result.unit == "msk"
        assert result.name == "olivolja"

    def test_parse_keeps_original(self) -> None:
        original = "2 cups flour"
        result = parse_ingredient(original)
        assert result.original == original

    def test_parse_empty_string(self) -> None:
        result = parse_ingredient("")
        assert result.quantity is None
        assert result.unit is None
        assert result.name == ""

    def test_parse_whitespace_only(self) -> None:
        result = parse_ingredient("   ")
        assert result.quantity is None
        assert result.unit is None
        assert result.name == ""


class TestParsedIngredientScale:
    """Tests for ParsedIngredient.scale method."""

    def test_scale_doubles_quantity(self) -> None:
        ing = ParsedIngredient(quantity=2.0, unit="cups", name="flour", original="2 cups flour")
        scaled = ing.scale(2.0)
        assert scaled.quantity == 4.0
        assert scaled.unit == "cups"
        assert scaled.name == "flour"

    def test_scale_halves_quantity(self) -> None:
        ing = ParsedIngredient(quantity=4.0, unit="tbsp", name="butter", original="4 tbsp butter")
        scaled = ing.scale(0.5)
        assert scaled.quantity == 2.0

    def test_scale_none_quantity(self) -> None:
        ing = ParsedIngredient(quantity=None, unit=None, name="Salt to taste", original="Salt to taste")
        scaled = ing.scale(2.0)
        assert scaled.quantity is None
        assert scaled.name == "Salt to taste"


class TestParsedIngredientFormat:
    """Tests for ParsedIngredient.format method."""

    def test_format_with_quantity_and_unit(self) -> None:
        ing = ParsedIngredient(quantity=2.0, unit="cups", name="flour", original="2 cups flour")
        assert ing.format() == "2 cups flour"

    def test_format_with_quantity_no_unit(self) -> None:
        ing = ParsedIngredient(quantity=3.0, unit=None, name="eggs", original="3 eggs")
        assert ing.format() == "3 eggs"

    def test_format_fraction(self) -> None:
        ing = ParsedIngredient(quantity=0.5, unit="cup", name="milk", original="1/2 cup milk")
        assert ing.format() == "1/2 cup milk"

    def test_format_no_quantity(self) -> None:
        ing = ParsedIngredient(quantity=None, unit=None, name="Salt to taste", original="Salt to taste")
        assert ing.format() == "Salt to taste"


class TestScaleIngredients:
    """Tests for scale_ingredients function."""

    def test_scale_double_servings(self) -> None:
        ingredients = ["2 cups flour", "1 tsp salt", "3 eggs"]
        scaled = scale_ingredients(ingredients, original_servings=4, new_servings=8)
        assert scaled[0] == "4 cups flour"
        assert scaled[1] == "2 tsp salt"
        assert scaled[2] == "6 eggs"

    def test_scale_half_servings(self) -> None:
        ingredients = ["4 cups flour", "2 tsp salt"]
        scaled = scale_ingredients(ingredients, original_servings=8, new_servings=4)
        assert scaled[0] == "2 cups flour"
        assert scaled[1] == "1 tsp salt"

    def test_scale_same_servings_unchanged(self) -> None:
        ingredients = ["2 cups flour", "1 tsp salt"]
        scaled = scale_ingredients(ingredients, original_servings=4, new_servings=4)
        assert scaled == ingredients

    def test_scale_preserves_no_quantity_items(self) -> None:
        ingredients = ["Salt to taste", "Fresh herbs for garnish"]
        scaled = scale_ingredients(ingredients, original_servings=4, new_servings=8)
        assert scaled[0] == "Salt to taste"
        assert scaled[1] == "Fresh herbs for garnish"

    def test_scale_handles_zero_original_servings(self) -> None:
        ingredients = ["2 cups flour"]
        scaled = scale_ingredients(ingredients, original_servings=0, new_servings=4)
        assert scaled == ingredients

    def test_scale_handles_zero_new_servings(self) -> None:
        ingredients = ["2 cups flour"]
        scaled = scale_ingredients(ingredients, original_servings=4, new_servings=0)
        assert scaled == ingredients
