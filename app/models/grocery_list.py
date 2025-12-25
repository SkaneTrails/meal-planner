"""Grocery list data model."""

from dataclasses import dataclass, field
from enum import Enum


class GroceryCategory(Enum):
    """Category for grocery items."""

    PRODUCE = "produce"
    MEAT_SEAFOOD = "meat_seafood"
    DAIRY = "dairy"
    BAKERY = "bakery"
    PANTRY = "pantry"
    FROZEN = "frozen"
    BEVERAGES = "beverages"
    OTHER = "other"


@dataclass
class GroceryItem:
    """A single item on the grocery list."""

    name: str
    quantity: str | None = None
    unit: str | None = None
    category: GroceryCategory = GroceryCategory.OTHER
    checked: bool = False
    recipe_sources: list[str] = field(default_factory=list)

    @property
    def display_text(self) -> str:
        """Format the item for display."""
        if self.quantity and self.unit:
            return f"{self.quantity} {self.unit} {self.name}"
        if self.quantity:
            return f"{self.quantity} {self.name}"
        return self.name


@dataclass
class GroceryList:
    """A complete grocery list."""

    items: list[GroceryItem] = field(default_factory=list)

    def get_by_category(self, category: GroceryCategory) -> list[GroceryItem]:
        """Get all items in a category."""
        return [item for item in self.items if item.category == category]

    def get_unchecked(self) -> list[GroceryItem]:
        """Get all unchecked items."""
        return [item for item in self.items if not item.checked]

    def add_item(self, item: GroceryItem) -> None:
        """Add an item, merging if it already exists."""
        for existing in self.items:
            if existing.name.lower() == item.name.lower():
                # Merge recipe sources
                existing.recipe_sources.extend(item.recipe_sources)
                # Future enhancement: Merge quantities intelligently
                return
        self.items.append(item)
