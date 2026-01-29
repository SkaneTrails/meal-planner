# Meal Planner - AI Coding Agent Instructions

## Important: Collaboration Guidelines

You are collaborating with a human who may make changes between your edits:

- **Always re-verify** file contents before making changes - don't assume previous state
- **If your previous changes are gone**, do not re-add them without checking with the user first
- **Read before editing** - the human may have modified, moved, or intentionally removed content
- **Verify suggestions** - when given review comments or suggestions, verify they are correct against actual code before applying
- **Compare alternatives** - when the user suggests a different approach, analyze both options and explain the tradeoffs
- **Troubleshoot step-by-step** - when debugging, suggest one fix at a time and wait for results
- **Plan before large changes** - for complex changes (3+ files), propose a high-level plan first
- **Never work directly on main** - Always create a feature branch for changes

## Keeping Documentation Current

> **🚨 BLOCKING REQUIREMENT: Update docs BEFORE pushing.**
> Documentation updates are not optional. They are part of the definition of done.
> A PR with code changes but outdated docs is **incomplete and must not be merged**.

### Pre-Push Checklist (MANDATORY)

Before running `git push`, verify ALL applicable items:

- [ ] **Architecture changes** → Update `copilot-instructions.md` Architecture section
- [ ] **New/changed scripts** → Update `docs/DEVELOPMENT.md` and `copilot-instructions.md`
- [ ] **New directories** → Update project structure in BOTH docs
- [ ] **New dependencies** → Document in `copilot-instructions.md` Key Dependencies
- [ ] **New API endpoints** → Update `docs/DEVELOPMENT.md` API section
- [ ] **User-facing changes** → Update `README.md`
- [ ] **New skills** → Add to skills table in `copilot-instructions.md`

### Documentation Files

| File                              | Update when...                                           |
| --------------------------------- | -------------------------------------------------------- |
| `.github/copilot-instructions.md` | Architecture, dependencies, patterns, conventions        |
| `docs/DEVELOPMENT.md`             | Scripts, commands, workflows, API usage                  |
| `README.md`                       | User-facing features, quick start, project overview      |
| `.github/skills/**/*.md`          | New skills or changes to existing skill behavior         |

### Triggers Requiring Documentation Updates

- New/renamed/removed directories (`api/`, `mobile/`, `functions/`, etc.)
- New/renamed/removed files in `scripts/`
- New/renamed/removed files in `.github/skills/`
- New/renamed/removed workflows in `.github/workflows/`
- Changes to `pyproject.toml` or `package.json` dependencies
- New services, storage backends, or API endpoints
- Changes to code style tools or conventions

### Enforcement

**Before pushing, ask yourself:**

1. "Does the Architecture section reflect what actually exists?"
2. "Are all current directories documented in the project structure?"
3. "Can someone clone this repo and understand how to run everything?"

**If the answer is NO to any question, update the docs first.**

## Project Overview

**Meal Planner** is a recipe collector and weekly meal planner app built with Streamlit. It allows users to:

1. **Import recipes** from URLs - automatically extracts ingredients, instructions, and images
2. **Plan weekly meals** - organize recipes into a weekly calendar
3. **Generate grocery lists** - combine ingredients from planned meals

## Architecture

The project is a multi-platform meal planning system with three main interfaces:

| Platform | Directory | Stack | Purpose |
|----------|-----------|-------|--------|
| Web (legacy) | `app/` | Streamlit | Original web UI |
| Mobile | `mobile/` | React Native + Expo | iOS/Android app |
| API | `api/` | FastAPI | REST backend for mobile |
| Functions | `functions/` | Google Cloud Functions | Serverless recipe scraping |

### Application Structure

```
api/                     # FastAPI REST backend
├── main.py              # FastAPI app entry point
├── models/              # Pydantic models
│   ├── recipe.py
│   ├── meal_plan.py
│   └── grocery_list.py
├── routers/             # API route handlers
│   ├── recipes.py
│   ├── meal_plans.py
│   └── grocery.py
├── services/            # Business logic
│   └── ingredient_parser.py
└── storage/             # Firestore persistence
    ├── firestore_client.py
    ├── recipe_storage.py
    └── meal_plan_storage.py

app/                     # Streamlit web app (legacy)
├── main.py              # Streamlit app entry point
├── icons.py             # Icon constants
├── models/              # Data models (dataclasses)
├── services/            # Business logic
└── storage/             # Firestore persistence

mobile/                  # React Native mobile app
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation screens
│   ├── recipe/[id].tsx  # Recipe detail screen
│   ├── add-recipe.tsx   # Add recipe screen
│   └── select-recipe.tsx
├── components/          # Reusable UI components
├── lib/                 # Utilities, hooks, API client
│   ├── api.ts           # REST API client
│   ├── hooks/           # React Query hooks
│   └── types.ts         # TypeScript types
└── package.json

functions/               # Google Cloud Functions
└── scrape_recipe/       # Recipe scraping function
    ├── main.py
    ├── recipe_scraper.py
    └── requirements.txt

scripts/                 # CLI tools
├── recipe_enhancer.py   # Gemini AI recipe enhancement
├── recipe_reviewer.py   # Manual recipe review helper
├── batch_test.py        # Batch testing for enhancer
├── test_gemini.py       # Gemini API test script
├── run-api.sh           # Start FastAPI server
├── run-dev.sh           # Start all dev services
└── run-function.sh      # Run Cloud Function locally
```

### Key Dependencies

**Python Backend (api/, app/, scripts/):**

- **fastapi** - REST API framework
- **uvicorn** - ASGI server
- **pydantic** - Data validation
- **streamlit** - Web UI framework (legacy)
- **google-cloud-firestore** - Firestore database client
- **google-genai** - Gemini AI for recipe enhancement
- **recipe-scrapers** - Extract recipes from 400+ websites
- **httpx** - HTTP client
- **pillow** - Image processing

**Mobile (mobile/):**

- **expo** - React Native framework
- **expo-router** - File-based routing
- **@tanstack/react-query** - Data fetching/caching
- **nativewind** - Tailwind CSS for React Native

**Cloud Functions (functions/):**

- **functions-framework** - Google Cloud Functions runtime
- **recipe-scrapers** - Recipe extraction

### Data Flow

1. User pastes recipe URL → `recipe_scraper.scrape_recipe()` fetches and parses
2. Recipe saved to Firestore via `recipe_storage.py`
3. User plans meals → MealPlan saved via `meal_plan_storage.py`
4. Grocery list generated by combining ingredients from planned recipes
5. (Optional) `recipe_enhancer.py` enhances recipes with Gemini AI

### Skills (AI Agent Instructions)

Skills in `.github/skills/` provide domain-specific instructions:

| Skill                 | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `recipe-improvement/` | Cooking techniques, equipment optimization, dietary preferences |
| `pr-review-workflow/` | PR creation, review comments, CI status, GitHub API patterns    |
| `working-context/`    | Track tasks and discovered issues across conversations          |

## Development Workflows

### Running the App

```bash
# Install Python dependencies
uv sync

# Run Streamlit web app (legacy)
uv run streamlit run app/main.py

# Run FastAPI backend
./scripts/run-api.sh
# Or manually:
uv run uvicorn api.main:app --reload --port 8000

# Run all dev services (API + mobile)
./scripts/run-dev.sh

# Run Cloud Function locally
./scripts/run-function.sh
```

### Running the Mobile App

```bash
cd mobile
npm install
npx expo start
```

### Code Quality Tools

- **Package manager**: UV (Astral's fast Python package manager)
- **Linter/Formatter**: Ruff (configured in `pyproject.toml`)
  - Line length: 120 characters
  - Target: Python 3.14
- **Pre-commit hooks**: `.pre-commit-config.yaml`
  - Install: `uv run pre-commit install`
- **Testing**: pytest with coverage
  - Run: `uv run pytest --cov=app`
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`

## Code Style

See `pyproject.toml` for tool configurations.

- **Ruff** for linting/formatting
- Test files must match `test_*.py` pattern
- **Self-documenting code**: Avoid inline comments - code should be readable without them
- **Test coverage**: All new methods and modified functions must have corresponding tests
- **Dataclasses**: Use dataclasses for models with `@dataclass` decorator
- **Type hints**: Use modern Python type hints (`list[str]` not `List[str]`)

## Test-Driven Development (TDD)

**Strongly prefer TDD when implementing new features or modules.**

### When to Use TDD

- **New models** - Write tests first to define the data structure
- **New services** - Test edge cases before implementation
- **Bug fixes** - Write a failing test that reproduces the bug
- **Refactoring** - Ensure tests pass before and after

### Running Tests

```bash
uv run pytest -n=auto --cov=app --cov-report=term-missing
uv run pytest tests/test_recipe.py -v
```

## Key Patterns & Conventions

### Recipe Scraping

- Uses `recipe-scrapers` library which supports 400+ recipe websites
- Always handle scraping errors gracefully - return `None` if scraping fails
- Extract: title, ingredients, instructions, image_url, servings, prep_time, cook_time

### Streamlit Patterns

- Use `st.session_state` for persisting data across reruns
- Use `st.spinner()` for long-running operations like HTTP requests
- Use `st.form()` for grouping inputs that should submit together
- Handle errors with `st.error()` and successes with `st.success()`

### Data Models

- Use Python dataclasses for all models
- Default mutable fields with `field(default_factory=list)`
- Add computed properties for derived values (e.g., `total_time_calculated`)

## When Making Changes

### Adding New Features

1. Create feature branch: `git checkout -b feat/feature-name`
2. Write tests first (TDD)
3. Implement the feature
4. Run tests and linting
5. Commit with conventional commit message
6. Push and create PR

### Adding Recipe Scraper Features

- Test with real recipe URLs from different sites
- Handle missing fields gracefully (not all sites have all info)
- Consider caching fetched recipes

### Adding Grocery List Features

- Implement ingredient parsing/normalization
- Group by category (produce, dairy, etc.)
- Handle quantity merging for duplicate items

## Future Enhancements

- [ ] Persistent storage (JSON files or SQLite)
- [ ] Ingredient parsing and normalization
- [ ] Category detection for grocery items
- [ ] Recipe editing and manual entry
- [ ] Export grocery list to various formats
- [ ] User accounts and cloud sync

---

## Recipe Enhancement Architecture

The app includes AI-powered recipe enhancement using Gemini. The prompt system is designed for multi-tenant use.

> **Note:** The prompt structure below describes the planned architecture. Currently, the system prompt is embedded in `scripts/recipe_enhancer.py`. Separating prompts into external files is planned for future work.

### Design Principles

- **Public repo ready**: Anyone can clone, apply terraform, and run their own instance
- **Core vs User config**: Separate universal improvements from household-specific preferences
- **Additive equipment model**: Baseline is stove + oven; users list additional equipment they HAVE

### Prompt Structure

```
config/prompts/
  core/                    # Committed, English, applies to ALL users
    base.md                # Role, output JSON schema
    formatting.md          # Fractions (½ not 0.5), ingredient order, spices last
    timeline.md            # When/how to use ⏱️ timeline format
    hellofresh-spices.md   # Spice blend substitution tables

  user/
    example.yaml           # Committed - example household config
    household.yaml         # Gitignored - actual user config
```

### User Configuration Schema

```yaml
household:
  size: 2
  language: sv # Recipe output language

dietary:
  mode: flexitarian # omnivore | flexitarian | vegetarian | vegan
  lactose: lactose-free # normal | lactose-free | dairy-free
  gluten: normal
  allergies: []

  flexitarian:
    meat_split: 50 # % meat vs vegetarian
    minced_meat: vegetarian
    fish: keep

equipment:
  # Baseline assumed: stove, oven
  oven:
    has_convection: true
    temp_adjustment: -20
  additional:
    - airfryer:
        model: "Xiaomi Smart Air Fryer 4.5L"
        capacity_liters: 4.5

proteins:
  chicken_alternative: "Quorn"
  beef_alternative: "Oumph The Chunk"
  minced_alternative: "Sojafärs"
```

### Key Rules

- **Core prompts**: Always in English, no household-specific content
- **User config**: Can use any language for output, contains all personal preferences
- **Equipment**: Never suggest equipment not in user's config
- **Dietary modes**: Prompt logic adapts based on mode (e.g., flexitarian = split proteins)
