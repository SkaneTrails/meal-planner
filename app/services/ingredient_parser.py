"""Ingredient parsing and portion scaling service."""

import re
from dataclasses import dataclass
from fractions import Fraction


@dataclass
class ParsedIngredient:
    """A parsed ingredient with quantity, unit, and name separated."""

    quantity: float | None
    unit: str | None
    name: str
    original: str

    def scale(self, factor: float) -> "ParsedIngredient":
        """Return a new ParsedIngredient scaled by the given factor."""
        new_quantity = self.quantity * factor if self.quantity else None
        return ParsedIngredient(
            quantity=new_quantity,
            unit=self.unit,
            name=self.name,
            original=self.original,
        )

    def format(self) -> str:
        """Format the ingredient as a display string."""
        if self.quantity is None:
            return self.name

        # Format the quantity nicely
        qty_str = format_quantity(self.quantity)

        if self.unit:
            return f"{qty_str} {self.unit} {self.name}"
        return f"{qty_str} {self.name}"


def format_quantity(qty: float) -> str:
    """Format a quantity as a clean string (fractions or decimals)."""
    if qty == int(qty):
        return str(int(qty))

    # Common fractions to display nicely
    fraction_map = {
        0.25: "1/4",
        0.33: "1/3",
        0.5: "1/2",
        0.67: "2/3",
        0.75: "3/4",
    }

    # Check for whole number + fraction
    whole = int(qty)
    frac = qty - whole

    # Round to 2 decimal places for matching
    frac_rounded = round(frac, 2)

    if frac_rounded in fraction_map:
        frac_str = fraction_map[frac_rounded]
        if whole > 0:
            return f"{whole} {frac_str}"
        return frac_str

    # Otherwise, use decimal with up to 2 places
    if qty == round(qty, 1):
        return f"{qty:.1f}".rstrip("0").rstrip(".")
    return f"{qty:.2f}".rstrip("0").rstrip(".")


def parse_fraction(text: str) -> float | None:
    """Parse a fraction or mixed number string to a float."""
    text = text.strip()
    if not text:
        return None

    # Replace unicode fractions
    unicode_fractions = {
        "½": "1/2",
        "⅓": "1/3",
        "⅔": "2/3",
        "¼": "1/4",
        "¾": "3/4",
        "⅕": "1/5",
        "⅖": "2/5",
        "⅗": "3/5",
        "⅘": "4/5",
        "⅙": "1/6",
        "⅚": "5/6",
        "⅛": "1/8",
        "⅜": "3/8",
        "⅝": "5/8",
        "⅞": "7/8",
    }
    for unicode_frac, ascii_frac in unicode_fractions.items():
        text = text.replace(unicode_frac, " " + ascii_frac)

    text = text.strip()

    # Try parsing as a simple number first
    try:
        return float(text)
    except ValueError:
        pass

    # Try parsing as a fraction (e.g., "1/2")
    if "/" in text and " " not in text:
        try:
            return float(Fraction(text))
        except (ValueError, ZeroDivisionError):
            pass

    # Try parsing as a mixed number (e.g., "1 1/2" or "1-1/2")
    mixed_pattern = r"^(\d+)\s*[-\s]\s*(\d+)/(\d+)$"
    match = re.match(mixed_pattern, text)
    if match:
        whole = int(match.group(1))
        numerator = int(match.group(2))
        denominator = int(match.group(3))
        if denominator != 0:
            return whole + (numerator / denominator)

    return None


# Common units in cooking (case-insensitive matching)
UNITS = {
    # Volume - metric
    "ml",
    "milliliter",
    "milliliters",
    "millilitre",
    "millilitres",
    "l",
    "liter",
    "liters",
    "litre",
    "litres",
    "dl",
    "deciliter",
    "deciliters",
    "decilitre",
    "decilitres",
    "cl",
    "centiliter",
    "centiliters",
    "centilitre",
    "centilitres",
    # Volume - imperial
    "tsp",
    "teaspoon",
    "teaspoons",
    "tbsp",
    "tablespoon",
    "tablespoons",
    "cup",
    "cups",
    "fl oz",
    "fluid ounce",
    "fluid ounces",
    "pint",
    "pints",
    "quart",
    "quarts",
    "gallon",
    "gallons",
    # Weight - metric
    "g",
    "gram",
    "grams",
    "gramme",
    "grammes",
    "kg",
    "kilogram",
    "kilograms",
    "kilogramme",
    "kilogrammes",
    "mg",
    "milligram",
    "milligrams",
    # Weight - imperial
    "oz",
    "ounce",
    "ounces",
    "lb",
    "lbs",
    "pound",
    "pounds",
    # Count/pieces
    "piece",
    "pieces",
    "slice",
    "slices",
    "clove",
    "cloves",
    "head",
    "heads",
    "bunch",
    "bunches",
    "sprig",
    "sprigs",
    "stalk",
    "stalks",
    "can",
    "cans",
    "jar",
    "jars",
    "package",
    "packages",
    "packet",
    "packets",
    "box",
    "boxes",
    "bag",
    "bags",
    "bottle",
    "bottles",
    # Size descriptors often used as units
    "small",
    "medium",
    "large",
    "handful",
    "handfuls",
    "pinch",
    "pinches",
    "dash",
    "dashes",
    # Swedish units
    "msk",  # matsked (tablespoon)
    "tsk",  # tesked (teaspoon)
    "krm",  # kryddmått (pinch)
    "st",  # styck (pieces)
    "port",  # portion
    "portioner",  # portions
}


def parse_ingredient(text: str) -> ParsedIngredient:
    """Parse an ingredient string into structured components.

    Examples:
        "2 cups flour" -> ParsedIngredient(quantity=2.0, unit="cups", name="flour")
        "1/2 tsp salt" -> ParsedIngredient(quantity=0.5, unit="tsp", name="salt")
        "3 eggs" -> ParsedIngredient(quantity=3.0, unit=None, name="eggs")
        "Salt to taste" -> ParsedIngredient(quantity=None, unit=None, name="Salt to taste")
    """
    original = text
    text = text.strip()

    if not text:
        return ParsedIngredient(quantity=None, unit=None, name="", original=original)

    # Pattern to match quantity at the start
    # Matches: "2", "1/2", "1 1/2", "2.5", etc.
    quantity_pattern = r"^((?:\d+\s*)?(?:\d+/\d+|\d*\.?\d+))"

    # Also check for unicode fractions
    unicode_quantity_pattern = r"^(\d*\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])"

    quantity = None
    remaining = text

    # Try unicode fraction pattern first
    match = re.match(unicode_quantity_pattern, text)
    if match:
        qty_str = match.group(1)
        quantity = parse_fraction(qty_str)
        remaining = text[match.end() :].strip()
    else:
        # Try regular quantity pattern
        match = re.match(quantity_pattern, text)
        if match:
            qty_str = match.group(1)
            quantity = parse_fraction(qty_str)
            remaining = text[match.end() :].strip()

    # Now try to find a unit
    unit = None
    if remaining:
        # Check if the first word is a unit
        words = remaining.split(None, 1)
        if words:
            first_word = words[0].lower().rstrip(".,")
            if first_word in UNITS:
                unit = words[0].rstrip(".,")
                remaining = words[1] if len(words) > 1 else ""

    # Clean up the name
    name = remaining.strip()

    # Remove leading "of" if present (e.g., "2 cups of flour" -> "flour")
    if name.lower().startswith("of "):
        name = name[3:]

    return ParsedIngredient(quantity=quantity, unit=unit, name=name, original=original)


def scale_ingredients(ingredients: list[str], original_servings: int, new_servings: int) -> list[str]:
    """Scale a list of ingredient strings to a new serving size.

    Args:
        ingredients: List of ingredient strings
        original_servings: The original number of servings
        new_servings: The desired number of servings

    Returns:
        List of scaled ingredient strings
    """
    if original_servings <= 0 or new_servings <= 0:
        return ingredients

    if original_servings == new_servings:
        return ingredients

    factor = new_servings / original_servings
    scaled = []

    for ing in ingredients:
        parsed = parse_ingredient(ing)
        if parsed.quantity is not None:
            scaled_parsed = parsed.scale(factor)
            scaled.append(scaled_parsed.format())
        else:
            scaled.append(ing)

    return scaled
