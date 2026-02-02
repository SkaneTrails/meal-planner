"""Tests for api/models/grocery_list.py."""

from api.models.grocery_list import GroceryCategory, GroceryItem, GroceryList, QuantitySource, _format_qty


class TestFormatQty:
    """Tests for the _format_qty helper function."""

    def test_integer_quantity(self) -> None:
        """Should format integer without decimals."""
        assert _format_qty(2.0) == "2"
        assert _format_qty(10.0) == "10"

    def test_decimal_quantity(self) -> None:
        """Should format decimal without trailing zeros."""
        assert _format_qty(1.5) == "1.5"
        assert _format_qty(2.25) == "2.25"
        assert _format_qty(0.33) == "0.33"

    def test_trailing_zeros_removed(self) -> None:
        """Should remove trailing zeros after decimal."""
        assert _format_qty(1.50) == "1.5"
        assert _format_qty(2.10) == "2.1"


class TestQuantitySource:
    """Tests for QuantitySource model."""

    def test_create_with_all_fields(self) -> None:
        """Should create with quantity, unit, and recipe."""
        qs = QuantitySource(quantity=2.0, unit="cups", recipe="Pasta Bake")
        assert qs.quantity == 2.0
        assert qs.unit == "cups"
        assert qs.recipe == "Pasta Bake"

    def test_create_without_unit(self) -> None:
        """Should allow None unit for countable items."""
        qs = QuantitySource(quantity=3.0, unit=None, recipe="Recipe A")
        assert qs.quantity == 3.0
        assert qs.unit is None


class TestGroceryItem:
    """Tests for GroceryItem model."""

    def test_display_text_name_only(self) -> None:
        """Should display just name when no quantity."""
        item = GroceryItem(name="salt")
        assert item.display_text == "salt"

    def test_display_text_with_quantity(self) -> None:
        """Should display quantity and name."""
        item = GroceryItem(name="eggs", quantity="3")
        assert item.display_text == "3 eggs"

    def test_display_text_with_quantity_and_unit(self) -> None:
        """Should display quantity, unit, and name."""
        item = GroceryItem(name="flour", quantity="2", unit="cups")
        assert item.display_text == "2 cups flour"

    def test_display_text_single_quantity_source(self) -> None:
        """Should display from single quantity source."""
        item = GroceryItem(name="milk", quantity_sources=[QuantitySource(quantity=1.0, unit="cup", recipe="Recipe A")])
        assert item.display_text == "1 cup milk"

    def test_display_text_multiple_quantity_sources(self) -> None:
        """Should merge multiple quantity sources with +."""
        item = GroceryItem(
            name="eggs",
            quantity_sources=[
                QuantitySource(quantity=2.0, unit=None, recipe="Recipe A"),
                QuantitySource(quantity=3.0, unit=None, recipe="Recipe B"),
            ],
        )
        assert item.display_text == "2+3 eggs"

    def test_display_text_multiple_sources_with_units(self) -> None:
        """Should merge sources with same unit."""
        item = GroceryItem(
            name="flour",
            quantity_sources=[
                QuantitySource(quantity=1.0, unit="cups", recipe="Recipe A"),
                QuantitySource(quantity=0.5, unit="cups", recipe="Recipe B"),
            ],
        )
        assert item.display_text == "1+0.5 cups flour"

    def test_default_category(self) -> None:
        """Should default to OTHER category."""
        item = GroceryItem(name="mystery item")
        assert item.category == GroceryCategory.OTHER

    def test_default_checked_false(self) -> None:
        """Should default to unchecked."""
        item = GroceryItem(name="milk")
        assert item.checked is False

    def test_default_empty_lists(self) -> None:
        """Should default to empty recipe and quantity sources."""
        item = GroceryItem(name="sugar")
        assert item.recipe_sources == []
        assert item.quantity_sources == []


class TestGroceryList:
    """Tests for GroceryList model."""

    def test_empty_list(self) -> None:
        """Should create empty list."""
        grocery_list = GroceryList()
        assert grocery_list.items == []

    def test_get_by_category(self) -> None:
        """Should filter items by category."""
        grocery_list = GroceryList(
            items=[
                GroceryItem(name="carrots", category=GroceryCategory.PRODUCE),
                GroceryItem(name="milk", category=GroceryCategory.DAIRY),
                GroceryItem(name="onions", category=GroceryCategory.PRODUCE),
            ]
        )
        produce = grocery_list.get_by_category(GroceryCategory.PRODUCE)
        assert len(produce) == 2
        assert all(item.category == GroceryCategory.PRODUCE for item in produce)

    def test_get_by_category_empty(self) -> None:
        """Should return empty list for non-existent category."""
        grocery_list = GroceryList(items=[GroceryItem(name="carrots", category=GroceryCategory.PRODUCE)])
        dairy = grocery_list.get_by_category(GroceryCategory.DAIRY)
        assert dairy == []
