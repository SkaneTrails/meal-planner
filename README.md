# Meal Planner

A recipe collector and weekly meal planner that automatically extracts ingredients and procedures from recipe URLs.

## Features

- 🔗 **Recipe Import** - Share a recipe URL and automatically extract:
  - Ingredients list
  - Cooking procedure/instructions
  - Dish photo
  - Prep time, cook time, servings
- 📅 **Weekly Meal Planning** - Plan your meals for the week
- 🛒 **Grocery List** - Auto-generate shopping lists from your meal plan
- 📚 **Recipe Library** - Save and organize your favorite recipes

## Quick Start

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)

### Installation

```bash
# Install UV (if not already installed)
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Clone and set up
git clone https://github.com/SkaneTrails/meal-planner.git
cd meal-planner
uv sync --extra dev  # Install all dependencies including dev tools
```

### Running the App

```bash
# Run the Streamlit app
uv run streamlit run app/main.py
```

### Development

```bash
# Install pre-commit hooks
uv run pre-commit install

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app --cov-report=html

# Run linting
uv run ruff check --fix
uv run ruff format
```

## Project Structure

```
├── app/
│   ├── main.py              # Streamlit app entry point
│   ├── models/              # Data models (Recipe, MealPlan, GroceryList)
│   ├── services/            # Business logic
│   │   ├── recipe_scraper.py    # Extract recipes from URLs
│   │   └── ingredient_parser.py # Parse ingredient strings
│   └── storage/             # Firestore persistence
│       ├── firestore_client.py
│       ├── recipe_storage.py
│       └── meal_plan_storage.py
├── scripts/                 # CLI tools
│   ├── recipe_enhancer.py   # Gemini AI recipe enhancement
│   ├── recipe_reviewer.py   # Manual recipe review helper
│   └── ...
├── tests/
├── docs/
└── data/                    # Local data storage (gitignored)
```

## How It Works

1. **Add a Recipe**: Paste a recipe URL → the app scrapes ingredients, instructions, and image
2. **Plan Your Week**: Drag recipes into your weekly calendar
3. **Generate Grocery List**: Click to combine all ingredients, grouped by category

## Supported Recipe Sites

Uses [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) library which supports 400+ recipe websites including:

### Prioritized Sites

- 🇸🇪 **ICA.se** - Swedish grocery store recipes
- 🇮🇹 **GialloZafferano** - Italian recipes (ricette.giallozafferano.it)
- 🍽️ **HelloFresh** - All regions (.com, .se, .it, .de, .co.uk, etc.)

### Other Popular Sites

- AllRecipes
- BBC Good Food
- Epicurious
- Food Network
- Serious Eats
- And 400+ more...

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
