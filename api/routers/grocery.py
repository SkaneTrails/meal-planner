"""Grocery list API endpoints."""

from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query

from api.models.grocery_list import GroceryCategory, GroceryItem, GroceryList, QuantitySource
from api.services.ingredient_parser import parse_ingredient
from api.storage import meal_plan_storage, recipe_storage

router = APIRouter(prefix="/grocery", tags=["grocery"])

# Expected number of parts when splitting meal key
_MEAL_KEY_PARTS = 2

# Category detection keywords
CATEGORY_KEYWORDS: dict[GroceryCategory, set[str]] = {
    GroceryCategory.PRODUCE: {
        "apple",
        "apples",
        "avocado",
        "banana",
        "basil",
        "bean",
        "beans",
        "bell pepper",
        "broccoli",
        "cabbage",
        "carrot",
        "carrots",
        "celery",
        "chili",
        "chive",
        "chives",
        "cilantro",
        "corn",
        "cucumber",
        "dill",
        "eggplant",
        "fruit",
        "garlic",
        "ginger",
        "grape",
        "grapes",
        "green",
        "greens",
        "herb",
        "herbs",
        "kale",
        "leek",
        "lemon",
        "lettuce",
        "lime",
        "mango",
        "mint",
        "mushroom",
        "mushrooms",
        "onion",
        "onions",
        "orange",
        "oregano",
        "parsley",
        "pea",
        "peas",
        "pepper",
        "peppers",
        "potato",
        "potatoes",
        "rosemary",
        "sage",
        "salad",
        "scallion",
        "scallions",
        "shallot",
        "shallots",
        "spinach",
        "squash",
        "strawberry",
        "thyme",
        "tomato",
        "tomatoes",
        "vegetable",
        "vegetables",
        "zucchini",
    },
    GroceryCategory.MEAT_SEAFOOD: {
        "anchovy",
        "bacon",
        "beef",
        "chicken",
        "clam",
        "cod",
        "crab",
        "duck",
        "fish",
        "ground beef",
        "ground pork",
        "ham",
        "lamb",
        "lobster",
        "meat",
        "meatball",
        "mussel",
        "oyster",
        "pork",
        "prawn",
        "salmon",
        "sausage",
        "scallop",
        "seafood",
        "shrimp",
        "steak",
        "tuna",
        "turkey",
        "veal",
    },
    GroceryCategory.DAIRY: {
        "butter",
        "cheddar",
        "cheese",
        "cream",
        "cream cheese",
        "crème fraîche",
        "egg",
        "eggs",
        "feta",
        "goat cheese",
        "greek yogurt",
        "half and half",
        "heavy cream",
        "milk",
        "mozzarella",
        "parmesan",
        "ricotta",
        "sour cream",
        "whipping cream",
        "yogurt",
    },
    GroceryCategory.BAKERY: {
        "bagel",
        "baguette",
        "bread",
        "brioche",
        "bun",
        "ciabatta",
        "cracker",
        "croissant",
        "flatbread",
        "muffin",
        "naan",
        "pita",
        "roll",
        "sourdough",
        "tortilla",
    },
    GroceryCategory.PANTRY: {
        "baking powder",
        "baking soda",
        "bay leaf",
        "bouillon",
        "broth",
        "canned",
        "capers",
        "cayenne",
        "chili flakes",
        "cinnamon",
        "cocoa",
        "coconut milk",
        "cornstarch",
        "cumin",
        "curry",
        "dried",
        "flour",
        "honey",
        "ketchup",
        "maple syrup",
        "mayonnaise",
        "mustard",
        "noodle",
        "noodles",
        "nut",
        "nuts",
        "oil",
        "olive oil",
        "paprika",
        "pasta",
        "peanut butter",
        "pepper",
        "rice",
        "salt",
        "sauce",
        "sesame",
        "soy sauce",
        "spice",
        "stock",
        "sugar",
        "syrup",
        "tahini",
        "vanilla",
        "vinegar",
        "worcestershire",
    },
    GroceryCategory.FROZEN: {"frozen", "ice cream", "popsicle", "sorbet"},
    GroceryCategory.BEVERAGES: {"beer", "coffee", "juice", "soda", "tea", "water", "wine"},
}


def detect_category(ingredient_name: str) -> GroceryCategory:
    """Detect the category of an ingredient based on keywords."""
    name_lower = ingredient_name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category
    return GroceryCategory.OTHER


def _get_today() -> date:
    """Get today's date (UTC)."""
    return datetime.now(tz=UTC).date()


@router.get("/{user_id}")
async def generate_grocery_list(
    user_id: str,
    start_date: Annotated[date | None, Query(description="Start date for meal plan range")] = None,
    end_date: Annotated[date | None, Query(description="End date for meal plan range")] = None,
    days: Annotated[int, Query(ge=1, le=30, description="Number of days if start_date not provided")] = 7,
) -> GroceryList:
    """Generate a grocery list from a user's meal plan.

    If start_date is not provided, uses today as start.
    If end_date is not provided, uses an inclusive range of `days` starting at start_date
    (i.e., end_date = start_date + timedelta(days=days - 1)).
    """
    # Determine date range
    effective_start = start_date if start_date is not None else _get_today()
    effective_end = end_date if end_date is not None else effective_start + timedelta(days=days - 1)

    # Load meal plan
    meals, _ = meal_plan_storage.load_meal_plan(user_id)

    # Collect recipe IDs for the date range
    recipe_ids: set[str] = set()
    for key, value in meals.items():
        parts = key.rsplit("_", 1)
        if len(parts) != _MEAL_KEY_PARTS:
            continue
        date_str, _ = parts
        try:
            meal_date = date.fromisoformat(date_str)
        except ValueError:
            continue

        # Check date range and skip custom meals
        if effective_start <= meal_date <= effective_end and not value.startswith("custom:"):
            recipe_ids.add(value)

    # Load recipes and collect ingredients
    grocery_list = GroceryList()

    for recipe_id in recipe_ids:
        recipe = recipe_storage.get_recipe(recipe_id)
        if recipe is None:
            continue

        for ingredient_str in recipe.ingredients:
            parsed = parse_ingredient(ingredient_str)

            item = GroceryItem(
                name=parsed.name or ingredient_str,
                quantity=str(parsed.quantity) if parsed.quantity else None,
                unit=parsed.unit,
                category=detect_category(parsed.name or ingredient_str),
                recipe_sources=[recipe.title],
                quantity_sources=[QuantitySource(quantity=parsed.quantity, unit=parsed.unit, recipe=recipe.title)],
            )

            grocery_list.add_item(item)

    return grocery_list
