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
class QuantitySource:
    """A quantity from a specific recipe source."""

    quantity: float | None
    unit: str | None
    recipe: str


@dataclass
class GroceryItem:
    """A single item on the grocery list."""

    name: str
    quantity: str | None = None
    unit: str | None = None
    category: GroceryCategory = GroceryCategory.OTHER
    checked: bool = False
    recipe_sources: list[str] = field(default_factory=list)
    quantity_sources: list[QuantitySource] = field(default_factory=list)

    @property
    def display_text(self) -> str:  # noqa: C901, PLR0912
        """Format the item for display, merging quantities from different recipes."""
        if self.quantity_sources:
            # Group quantities by unit for smart merging
            quantities_by_unit: dict[str | None, list[tuple[float, str]]] = {}
            for qs in self.quantity_sources:
                if qs.quantity is not None:
                    unit_key = qs.unit.lower() if qs.unit else None
                    if unit_key not in quantities_by_unit:
                        quantities_by_unit[unit_key] = []
                    quantities_by_unit[unit_key].append((qs.quantity, qs.recipe))

            if quantities_by_unit:
                parts = []
                for unit_key, qty_list in quantities_by_unit.items():
                    if len(qty_list) == 1:
                        # Single quantity
                        qty, _ = qty_list[0]
                        qty_str = _format_qty(qty)
                    else:
                        # Multiple quantities - show as sum with breakdown
                        qty_strs = [_format_qty(q) for q, _ in qty_list]
                        qty_str = "+".join(qty_strs)

                    # Use the original unit case from first source
                    unit = next(
                        (qs.unit for qs in self.quantity_sources if qs.unit and qs.unit.lower() == unit_key), None
                    )
                    if unit:
                        parts.append(f"{qty_str} {unit}")
                    else:
                        parts.append(qty_str)

                if parts:
                    return f"{', '.join(parts)} {self.name}"

        # Fallback to old format
        if self.quantity and self.unit:
            return f"{self.quantity} {self.unit} {self.name}"
        if self.quantity:
            return f"{self.quantity} {self.name}"
        return self.name


def _format_qty(qty: float) -> str:
    """Format a quantity nicely (no trailing zeros)."""
    if qty == int(qty):
        return str(int(qty))
    return f"{qty:.2f}".rstrip("0").rstrip(".")


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
        """Add an item, merging quantities if the same ingredient already exists."""
        for existing in self.items:
            if existing.name.lower() == item.name.lower():
                # Merge recipe sources (avoid duplicates)
                for source in item.recipe_sources:
                    if source not in existing.recipe_sources:
                        existing.recipe_sources.append(source)
                # Merge quantity sources
                existing.quantity_sources.extend(item.quantity_sources)
                return
        self.items.append(item)
