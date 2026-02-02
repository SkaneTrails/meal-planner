# Meal Planner - AI Coding Agent Instructions

## Important: Collaboration Guidelines

You are collaborating with a human who may make changes between your edits:

- **Always re-verify** file contents before making changes - don't assume previous state
- **If your previous changes are gone**, do not re-add them without checking with the user first
- **Read before editing** - the human may have modified, moved, or intentionally removed content
- **Verify suggestions** - when given review comments or suggestions, verify they are correct against actual code before applying
- **Compare alternatives** - when the user suggests a different approach, analyze both options and explain the tradeoffs
- **Troubleshoot step-by-step** - when debugging, suggest one fix at a time and wait for results
- **Track iterations** - when a command/approach fails, IMMEDIATELY log to Failure Tracking table in `.copilot-tasks.md` BEFORE retrying with a different approach
- **Plan before large changes** - for complex changes (3+ files), propose a high-level plan first
- **Never work directly on main** - Always create a feature branch for changes
- **Before editing Copilot config** - read `copilot-self-improvement` skill before modifying `copilot-instructions.md`, `*.instructions.md`, skills, or `copilot-references.md`
- **On conversation start** - skim `.copilot-tasks.md` Failure Tracking table for patterns relevant to current topic; when count reaches 3, promote to permanent docs

## Keeping Documentation Current

> **🚨 BLOCKING REQUIREMENT: Update docs BEFORE pushing.**

### Pre-Push Checklist (MANDATORY)

- [ ] **Architecture changes** → Update `copilot-instructions.md` Architecture section
- [ ] **New/changed scripts** → Update `docs/DEVELOPMENT.md` and `copilot-instructions.md`
- [ ] **New directories** → Update project structure in BOTH docs
- [ ] **New dependencies** → Document in `copilot-instructions.md` Key Dependencies
- [ ] **New API endpoints** → Update `docs/DEVELOPMENT.md` API section
- [ ] **User-facing changes** → Update `README.md`
- [ ] **New skills** → Add to skills table in `copilot-instructions.md`

## Project Overview

**Meal Planner** is a recipe collector and weekly meal planner app. It allows users to:

1. **Import recipes** from URLs - automatically extracts ingredients, instructions, and images
2. **Plan weekly meals** - organize recipes into a weekly calendar
3. **Generate grocery lists** - combine ingredients from planned meals

## Architecture

The project is a multi-platform meal planning system with three main interfaces:

| Platform | Directory | Stack | Purpose |
|----------|-----------|-------|--------|
| Mobile | `mobile/` | React Native + Expo | iOS/Android + Web app |
| API | `api/` | FastAPI | REST backend |
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
│   ├── recipes.py       # Includes /enhance endpoint (disabled)
│   ├── meal_plans.py
│   └── grocery.py
├── services/            # Business logic
│   ├── ingredient_parser.py
│   ├── prompt_loader.py      # Loads modular prompts from config/
│   └── recipe_enhancer.py    # Gemini AI enhancement service
└── storage/             # Firestore persistence

config/prompts/          # Gemini AI prompts (see recipe-improvement skill)

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

functions/scrape_recipe/ # Cloud Function for recipe scraping

scripts/                 # CLI tools
├── recipe_enhancer.py   # Gemini AI recipe enhancement
├── recipe_reviewer.py   # Manual recipe review helper
├── validate_gemini.py   # Validate enhanced recipes
├── upload_enhanced_recipe.py  # Re-upload corrupted enhanced recipes from JSON
├── batch_test.py        # Batch testing for enhancer
├── test_gemini.py       # Gemini API test script
├── run-api.sh           # Start FastAPI server
├── run-dev.sh           # Start all dev services
└── run-function.sh      # Run Cloud Function locally

infra/                   # Terraform infrastructure
├── environments/
│   └── dev/             # Development environment
│       ├── main.tf      # Root module
│       ├── variables.tf
│       ├── versions.tf
│       ├── backend.tf   # GCS state backend
│       └── access/      # User emails (gitignored)
└── modules/             # Terraform modules (apis, iam, firestore)
```

### Key Dependencies

| Component | Key Packages |
|-----------|--------------|
| API (`api/`) | fastapi, uvicorn, pydantic, google-cloud-firestore, google-genai, recipe-scrapers |
| Mobile (`mobile/`) | expo, expo-router, @tanstack/react-query, nativewind |
| Functions (`functions/`) | functions-framework, recipe-scrapers |

### Data Flow

1. User pastes recipe URL → mobile fetches HTML (client-side to avoid IP blocking)
2. Mobile sends HTML + URL to API `/recipes/parse` → proxies to Cloud Function
3. Recipe saved to Firestore → user plans meals → grocery list generated
4. (Optional) `recipe_enhancer.py` enhances recipes with Gemini AI

### Firestore Schema

The app uses two Firestore databases:

| Database       | Purpose                    |
| -------------- | -------------------------- |
| `(default)`    | Original scraped recipes   |
| `meal-planner` | AI-enhanced recipes        |

Both databases use the same schema. The `?enhanced=true` API parameter switches between them.

#### Recipe Document Schema

All fields must be at the **top level** (no nested objects). The `created_at` field is **required** for queries.

```python
{
    # Required fields
    "title": str,                    # Recipe title
    "url": str,                      # Source URL
    "ingredients": list[str],        # List of ingredient strings
    "instructions": list[str],       # List of instruction steps (MUST be list, not string)
    "created_at": datetime,          # Required for order_by queries
    "updated_at": datetime,          # Last modification time

    # Optional fields
    "image_url": str | None,
    "servings": int | None,
    "prep_time": int | None,         # Minutes
    "cook_time": int | None,         # Minutes
    "total_time": int | None,        # Minutes
    "cuisine": str | None,           # e.g., "Italian", "Swedish"
    "category": str | None,          # e.g., "Huvudrätt", "Dessert"
    "tags": list[str],               # e.g., ["quick", "vegetarian"]
    "diet_label": str | None,        # "veggie" | "fish" | "meat"
    "meal_label": str | None,        # "breakfast" | "meal" | "dessert" | etc.
    "rating": int | None,            # 1-5 stars
}
```

#### Common Schema Mistakes (DO NOT DO)

| ❌ Wrong                                      | ✅ Correct                                    |
| --------------------------------------------- | --------------------------------------------- |
| `instructions: "Step 1. Do X. Step 2. Do Y."` | `instructions: ["Step 1. Do X", "Step 2..."]` |
| `metadata: { cuisine: "Italian" }`            | `cuisine: "Italian"` (top-level)              |
| Missing `created_at`                          | Always include `created_at: datetime.now()`   |

### Skills (AI Agent Instructions)

Skills in `.github/skills/` provide domain-specific instructions:

| Skill                      | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `local-development/`       | GCP secrets, .env setup, starting servers, troubleshooting      |
| `recipe-improvement/`      | Cooking techniques, equipment optimization, dietary preferences |
| `pr-review-workflow/`      | PR creation, review comments, CI status, GitHub API patterns    |
| `working-context/`         | Track tasks and discovered issues across conversations          |
| `copilot-self-improvement/`| Meta-skill for maintaining Copilot config, skills, instructions |

## Development Workflows

### Running the API

```bash
uv sync                                    # Install dependencies
./scripts/run-api.sh                       # Start API (or: uv run uvicorn api.main:app --reload --port 8000)
./scripts/run-dev.sh                       # Start all dev services
./scripts/run-function.sh                  # Run Cloud Function locally
```

**Note:** The API requires the scrape Cloud Function to be running. Either:
1. Run `./scripts/run-function.sh` in a separate terminal, or
2. Set `SCRAPE_FUNCTION_URL` to point to the deployed Cloud Function

```powershell
# PowerShell - use deployed function instead of local
$env:SCRAPE_FUNCTION_URL = "https://your-region-your-project.cloudfunctions.net/scrape_recipe"
```

### Running the Mobile App

```bash
cd mobile
npm install
npx expo start
```

For web deployment and Firebase Hosting, see `local-development` skill.

### Code Quality Tools

- **Package manager**: UV (Astral's fast Python package manager)
- **Linter/Formatter**: Ruff (configured in `pyproject.toml`)
- **Pre-commit hooks**: `.pre-commit-config.yaml`
- **Testing**: pytest with coverage
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`

## Code Style

See `pyproject.toml` for tool configurations.

- **Ruff** for linting/formatting
- Test files must match `test_*.py` pattern
- **Self-documenting code**: Avoid inline comments - code should be readable without them
- **Test coverage**: All API code must be tested (see TDD section for requirements)
- **Dataclasses**: Use dataclasses for models with `@dataclass` decorator
- **Type hints**: Use modern Python type hints (`list[str]` not `List[str]`)

## Test-Driven Development (TDD)

> **🚨 All API code changes MUST have corresponding tests.**

- New API endpoints → `tests/test_api_*.py`
- New service functions → `tests/test_*.py`
- Bug fixes → Write a failing test first, then fix
- Run: `uv run pytest --cov=api --cov-report=term-missing`

**Exceptions:** Mobile/frontend, Terraform, config files.

## Key Patterns & Conventions

### Recipe Scraping

- Uses `recipe-scrapers` library which supports 400+ recipe websites
- Always handle scraping errors gracefully - return `None` if scraping fails
- Extract: title, ingredients, instructions, image_url, servings, prep_time, cook_time

### Data Models

- Use Python dataclasses for all models
- Default mutable fields with `field(default_factory=list)`
- Add computed properties for derived values (e.g., `total_time_calculated`)

## When Making Changes

1. Create feature branch: `git checkout -b feat/feature-name`
2. Write tests first (TDD)
3. Implement the feature
4. Run tests and linting: `uv run pytest --cov=api && uv run ruff check`
5. Commit with conventional message (`feat:`, `fix:`, `chore:`, etc.)
6. Push and create PR

## Recipe Enhancement

AI-powered recipe enhancement using Gemini. See `recipe-improvement` skill for:
- Prompt structure and loading
- CLI enhancement tools
- Key rules enforced
