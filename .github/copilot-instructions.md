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
│   ├── recipes.py       # Includes /enhance endpoint (disabled)
│   ├── meal_plans.py
│   └── grocery.py
├── services/            # Business logic
│   ├── ingredient_parser.py
│   ├── prompt_loader.py      # Loads modular prompts from config/
│   └── recipe_enhancer.py    # Gemini AI enhancement service
└── storage/             # Firestore persistence
    ├── firestore_client.py
    ├── recipe_storage.py
    └── meal_plan_storage.py

config/                  # Configuration files
└── prompts/             # Gemini AI prompt system
    ├── core/            # Universal rules (apply to all)
    │   ├── base.md      # Role and JSON output schema
    │   ├── formatting.md # Fractions, measurements, ordering
    │   └── rules.md     # Forbidden terms, HelloFresh spices
    └── user/            # User-specific preferences
        ├── dietary.md   # Dietary restrictions, substitutions
        └── equipment.md # Kitchen equipment specs

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
├── validate_gemini.py   # Validate enhanced recipes
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
└── modules/
    ├── apis/            # Enable GCP APIs
    ├── iam/             # Custom roles and permissions
    └── firestore/       # Database and indexes
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

1. User pastes recipe URL in mobile app
2. Mobile app fetches HTML directly (client-side scraping to avoid cloud IP blocking)
3. Mobile app sends HTML + URL to API `/recipes/parse` endpoint
4. API proxies to Cloud Function for parsing with `recipe-scrapers` library
5. Recipe saved to Firestore via `recipe_storage.py`
6. User plans meals → MealPlan saved via `meal_plan_storage.py`
7. Grocery list generated by combining ingredients from planned recipes
8. (Optional) `recipe_enhancer.py` enhances recipes with Gemini AI

**Note:** Client-side scraping is used because some recipe sites (e.g., ICA.se) block
requests from cloud provider IP ranges. The fallback to server-side scraping
(`/recipes/scrape`) is used when client-side fetch fails (CORS, network errors).

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

# Run all dev services (API + Cloud Function)
./scripts/run-dev.sh

# Run Cloud Function locally (in separate terminal)
./scripts/run-function.sh
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

### Mobile Web Deployment (Firebase Hosting)

The mobile app is deployed as a static web export to Firebase Hosting.

**Build command:** `npm run build:web` (runs font copy + `npx expo export --platform web`)

#### Known Pitfalls

| Issue | Solution |
|-------|----------|
| **Fonts not bundled** | Expo static export doesn't include `@expo/vector-icons` fonts. Copy TTF to `public/fonts/` and load via `useFonts({ Ionicons: require('../public/fonts/Ionicons.ttf') })` |
| **NativeWind + Tailwind v4** | NativeWind 4 only supports Tailwind CSS v3. Renovate rule prevents v4 upgrades in `mobile/` |
| **OAuth redirect_uri_mismatch** | Add `https://<project>.firebaseapp.com/__/auth/handler` to BOTH OAuth clients in Google Cloud Console |
| **signInWithRedirect fails** | Cross-domain credential storage issue between localhost and firebaseapp.com. Use `signInWithPopup` instead |
| **CORS 403 Forbidden** | Cloud Run needs `allow_public_access = true` in Terraform for public API access |
| **COOP popup warning** | "Cross-Origin-Opener-Policy would block window.close" is harmless - sign-in still works |

#### Authentication Flow (Web)

1. User clicks "Sign in with Google" → `signInWithPopup(auth, googleProvider)`
2. Firebase handles OAuth flow via popup
3. On success, `onAuthStateChanged` fires with user
4. API requests include `Authorization: Bearer <id_token>`
5. FastAPI validates token via `firebase_admin.auth.verify_id_token()`

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
- **Test coverage**: All API code must be tested (see TDD section for requirements)
- **Dataclasses**: Use dataclasses for models with `@dataclass` decorator
- **Type hints**: Use modern Python type hints (`list[str]` not `List[str]`)

## Test-Driven Development (TDD)

**Strongly prefer TDD when implementing new features or modules.**

### Test Coverage Requirements (MANDATORY)

> **🚨 All API code changes MUST have corresponding tests.**
> Code without tests is incomplete. PRs with untested API code must not be merged.

**Coverage rules:**
- New API endpoints → Add integration tests in `tests/test_api_*.py`
- New service functions → Add unit tests in `tests/test_*.py`
- Modified functions → Update or add tests to cover changes
- Bug fixes → Write a failing test first, then fix

**Exceptions (no tests required):**
- Mobile/frontend code (UI tests not practical currently)
- Terraform infrastructure code
- Configuration files (prompts, settings)

### When to Use TDD

- **New models** - Write tests first to define the data structure
- **New services** - Test edge cases before implementation
- **Bug fixes** - Write a failing test that reproduces the bug
- **Refactoring** - Ensure tests pass before and after

### Running Tests

```bash
# Full test suite with coverage for both app and api
uv run pytest --cov=app --cov=api --cov-report=term-missing

# Run specific test file
uv run pytest tests/test_recipe.py -v

# Run tests in parallel (faster)
uv run pytest -n=auto --cov=app --cov=api
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

### Terraform Conventions

- **All infrastructure must be declared in Terraform** - no manual resource creation via console or CLI
- **Resource names** (buckets, databases, service accounts, etc.) must be defined in `terraform.tfvars` or `variables.tf`, never hardcoded in resource blocks
- **`gcloud` and `gsutil` commands** are only for troubleshooting, never for creating or modifying infrastructure
- Environment-specific values go in `infra/environments/{dev,prod}/terraform.tfvars`
- Shared module variables go in `infra/modules/*/variables.tf` with sensible defaults
- **Free tier compliance** - All resources must stay within GCP free tier limits

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

The app includes AI-powered recipe enhancement using Gemini. The prompt system is split into modular files for maintainability.

### Design Principles

- **Public repo ready**: Anyone can clone, apply terraform, and run their own instance
- **Core vs User config**: Separate universal improvements from household-specific preferences
- **Additive equipment model**: Baseline is stove + oven; users list additional equipment they HAVE

### Prompt Structure

```
config/prompts/
  core/                    # Committed, applies to ALL users
    base.md                # Role, output JSON schema
    formatting.md          # Fractions (½ not 0.5), ingredient order, Swedish measurements
    rules.md               # Forbidden terms, HelloFresh spice replacements

  user/                    # User-specific preferences
    dietary.md             # Dietary restrictions, protein substitutions, lactose-free rules
    equipment.md           # Kitchen equipment (airfryer specs, oven settings)
```

### Loading Prompts

The `api/services/prompt_loader.py` module assembles prompts from these files:

```python
from api.services.prompt_loader import load_system_prompt

# Load complete prompt (core + user)
prompt = load_system_prompt()

# Validate all files exist
status = validate_prompts()  # Returns dict of file -> exists
```

### API Enhancement Endpoint

The API includes a recipe enhancement endpoint (disabled by default):

```
POST /recipes/{recipe_id}/enhance
```

**Enable enhancement:**
```bash
export ENABLE_RECIPE_ENHANCEMENT=true
export GOOGLE_API_KEY=your-gemini-api-key
```

**Workflow:**
1. Fetch recipe from `(default)` database
2. Run through Gemini with assembled prompt
3. Save enhanced version to `meal-planner` database (same ID)
4. Return enhanced recipe

### CLI Enhancement

The `scripts/recipe_enhancer.py` CLI tool uses the same prompt system:

```bash
# Enhance single recipe
uv run python scripts/recipe_enhancer.py <recipe_id>

# Preview without saving
uv run python scripts/recipe_enhancer.py <recipe_id> --dry-run

# Batch process unenhanced recipes
uv run python scripts/recipe_enhancer.py --batch 10
```

### Validation

Validate enhanced recipes against Gemini output:

```bash
# Validate 5 recipes
uv run python scripts/validate_gemini.py

# Skip first 10, validate next 5
uv run python scripts/validate_gemini.py --skip 10 --limit 5
```

### Key Rules Enforced

- **Forbidden terms**: "protein/proteiner" - use specific names (kyckling, Quorn)
- **No consolidation**: Keep separate ingredient entries (salt for pasta, salt for chicken)
- **Concrete quantities**: Convert "1 paket" → "400 g", "en nypa" → "2 krm"
- **Swedish fractions**: Use ½, ⅓, ¼ - never 0.5, 0.33, 0.25
- **HelloFresh spices**: Replace blends with individual spices
