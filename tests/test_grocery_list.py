"""Tests for grocery list model."""

from app.models.grocery_list import GroceryCategory, GroceryItem, GroceryList


class TestGroceryItem:
    """Tests for GroceryItem model."""

    def test_display_text_with_quantity_and_unit(self) -> None:
        """Test display text formatting with quantity and unit."""
        item = GroceryItem(name="flour", quantity="2", unit="cups")
        assert item.display_text == "2 cups flour"

    def test_display_text_with_quantity_only(self) -> None:
        """Test display text formatting with quantity only."""
        item = GroceryItem(name="eggs", quantity="3")
        assert item.display_text == "3 eggs"

    def test_display_text_name_only(self) -> None:
        """Test display text formatting with name only."""
        item = GroceryItem(name="salt")
        assert item.display_text == "salt"


class TestGroceryList:
    """Tests for GroceryList model."""

    def test_get_by_category(self) -> None:
        """Test filtering items by category."""
        grocery_list = GroceryList(
            items=[
                GroceryItem(name="apples", category=GroceryCategory.PRODUCE),
                GroceryItem(name="milk", category=GroceryCategory.DAIRY),
                GroceryItem(name="bananas", category=GroceryCategory.PRODUCE),
            ]
        )
        produce = grocery_list.get_by_category(GroceryCategory.PRODUCE)
        assert len(produce) == 2
        assert all(item.category == GroceryCategory.PRODUCE for item in produce)

    def test_get_unchecked(self) -> None:
        """Test getting unchecked items."""
        grocery_list = GroceryList(
            items=[
                GroceryItem(name="apples", checked=False),
                GroceryItem(name="milk", checked=True),
                GroceryItem(name="bread", checked=False),
            ]
        )
        unchecked = grocery_list.get_unchecked()
        assert len(unchecked) == 2

    def test_add_item_new(self) -> None:
        """Test adding a new item."""
        grocery_list = GroceryList()
        grocery_list.add_item(GroceryItem(name="apples"))
        assert len(grocery_list.items) == 1
        assert grocery_list.items[0].name == "apples"

    def test_add_item_merge_existing(self) -> None:
        """Test that adding duplicate item merges recipe sources."""
        grocery_list = GroceryList(items=[GroceryItem(name="flour", recipe_sources=["Recipe A"])])
        grocery_list.add_item(GroceryItem(name="Flour", recipe_sources=["Recipe B"]))
        assert len(grocery_list.items) == 1
        assert grocery_list.items[0].recipe_sources == ["Recipe A", "Recipe B"]
