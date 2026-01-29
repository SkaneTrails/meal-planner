# Development Guide

## Setup

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)

### Installation

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone https://github.com/YOUR-USERNAME/my-project.git
cd my-project
uv sync --extra dev
```

### Pre-commit Hooks

```bash
uv run pre-commit install
```

## Development Workflow

### Running Tests

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=app --cov-report=html

# Specific file
uv run pytest tests/test_main.py -v
```

### Linting

```bash
# Check and fix
uv run ruff check --fix
uv run ruff format

# Check only
uv run ruff check
uv run ruff format --check
```

### Type Checking

```bash
uv run ty check app/
```

## Project Structure

```
├── app/                    # Application code
│   ├── main.py             # Streamlit app entry point
│   ├── icons.py            # Icon constants
│   ├── models/             # Data models (dataclasses)
│   │   ├── recipe.py
│   │   ├── meal_plan.py
│   │   └── grocery_list.py
│   ├── services/           # Business logic
│   │   ├── recipe_scraper.py
│   │   └── ingredient_parser.py
│   └── storage/            # Firestore persistence
│       ├── firestore_client.py
│       ├── recipe_storage.py
│       └── meal_plan_storage.py
├── scripts/                # CLI tools
│   ├── recipe_enhancer.py  # Gemini AI recipe enhancement
│   ├── recipe_reviewer.py  # Manual recipe review helper
│   ├── batch_test.py       # Batch testing for enhancer
│   └── test_gemini.py      # Gemini API test script
├── tests/                  # Test files
│   ├── conftest.py         # Shared fixtures
│   └── test_*.py
├── docs/                   # Documentation
├── .github/
│   ├── workflows/          # CI/CD (tests.yml, security-checks.yml)
│   ├── skills/             # AI agent instructions
│   │   ├── recipe-improvement/
│   │   ├── pr-review-workflow/
│   │   └── working-context/
│   └── copilot-instructions.md
├── pyproject.toml          # Project config
└── renovate.json           # Dependency updates
```

## Adding Dependencies

```bash
# Production dependency
uv add package-name

# Development dependency
uv add --optional dev package-name

# Test dependency
uv add --optional test package-name
```

## Recipe Enhancement with Gemini

The project includes AI-powered recipe enhancement using Google's Gemini 2.5 Flash.

### Setup

1. Get a free API key from https://aistudio.google.com/apikey
2. Add to `.env` file:
   ```
   GOOGLE_API_KEY=your-key-here
   ```

### Usage

```bash
# Enhance a single recipe (interactive)
uv run python scripts/recipe_enhancer.py <recipe_id>

# Preview changes without saving
uv run python scripts/recipe_enhancer.py <recipe_id> --dry-run

# Batch process multiple recipes
uv run python scripts/recipe_enhancer.py --batch 10

# Batch with custom delay (default 4.0s for free tier rate limits)
uv run python scripts/recipe_enhancer.py --batch 10 --delay 5.0

# List available recipes
uv run python scripts/recipe_enhancer.py --list
```

### Other Scripts

```bash
# Manual recipe review workflow
uv run python scripts/recipe_reviewer.py next      # Get next unprocessed recipe
uv run python scripts/recipe_reviewer.py status    # Show review progress

# Test Gemini integration
uv run python scripts/test_gemini.py

# Batch test on sample recipes
uv run python scripts/batch_test.py
```

### What It Does

- Protein substitution (50% meat / 50% vegetarian alternatives)
- Airfryer optimization with timing instructions
- Timeline format for complex multi-step recipes
- HelloFresh spice blend replacement with individual ingredients
- Lactose-free dairy substitutions
- Ingredient formatting (fractions, no duplicates, spices last)

### Configuration

Household preferences are configured in the system prompt within `scripts/recipe_enhancer.py`.
See `.github/copilot-instructions.md` for the multi-tenant architecture plan.

---

## Troubleshooting

### Common Issues

**UV not found:**

```bash
# Reload shell or source profile
source ~/.bashrc  # or ~/.zshrc
```

**Pre-commit fails:**

```bash
# Update hooks
uv run pre-commit autoupdate

# Run manually
uv run pre-commit run --all-files
```
