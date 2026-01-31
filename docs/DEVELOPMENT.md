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

## Running the Application

### Streamlit Web App (Legacy)

```bash
uv run streamlit run app/main.py
```

### FastAPI Backend

```bash
# Using the script
./scripts/run-api.sh

# Or manually
uv run uvicorn api.main:app --reload --port 8000
```

### Mobile App

```bash
cd mobile
npm install
npx expo start
```

### All Services (Development)

```bash
# Starts API + mobile with hot reload
./scripts/run-dev.sh
```

### Cloud Function (Local)

```bash
./scripts/run-function.sh
```

## Environment Setup

### API Environment Variables

The FastAPI backend requires the following environment variables:

| Variable                         | Required | Description                  |
| -------------------------------- | -------- | ---------------------------- |
| `GOOGLE_CLOUD_PROJECT`           | Yes      | GCP project ID for Firestore |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes      | Path to service account JSON |

### Mobile Environment Variables

Copy `mobile/.env.example` to `mobile/.env.development`:

```bash
cd mobile
cp .env.example .env.development
```

| Variable                         | Required | Description                                |
| -------------------------------- | -------- | ------------------------------------------ |
| `EXPO_PUBLIC_API_URL`            | Yes      | API URL (default: `http://localhost:8000`) |
| `EXPO_PUBLIC_FIREBASE_*`         | No\*     | Firebase config for authentication         |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | No\*     | OAuth client IDs for Google Sign-In        |

**\*Authentication in dev mode:** If Firebase/OAuth credentials are not configured, the app runs in "dev mode" with a mock authenticated user (`dev@localhost`). This allows local development without setting up Firebase.

### Setting Up Firebase Authentication (Optional)

To enable real authentication:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing GCP project
   - Enable Authentication > Sign-in method > Google

2. **Get Firebase Config**
   - Project Settings > General > Your apps > Add Web app
   - Copy the config values to your `.env.development`

3. **Get OAuth Client IDs**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
   - Create OAuth 2.0 Client IDs for:
     - Web application (for Expo web)
     - iOS (for iOS builds)
     - Android (for Android builds)

4. **Configure Authorized Domains**
   - In Firebase Console > Authentication > Settings > Authorized domains
   - Add `localhost` for local development

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

The project is a multi-platform meal planning system:

```
api/                     # FastAPI REST backend
├── main.py              # FastAPI app entry point
├── models/              # Pydantic models
├── routers/             # API route handlers
├── services/            # Business logic
└── storage/             # Firestore persistence

app/                     # Streamlit web app (legacy)
├── main.py              # Streamlit app entry point
├── icons.py             # Icon constants
├── models/              # Data models (dataclasses)
├── services/            # Business logic
└── storage/             # Firestore persistence

mobile/                  # React Native mobile app
├── app/                 # Expo Router screens
│   └── (tabs)/          # Tab navigation screens
├── components/          # Reusable UI components
├── lib/                 # Utilities, hooks, API client
└── package.json

functions/               # Google Cloud Functions
└── scrape_recipe/       # Recipe scraping function

scripts/                 # CLI tools
├── recipe_enhancer.py   # Gemini AI recipe enhancement
├── recipe_reviewer.py   # Manual recipe review helper
├── batch_test.py        # Batch testing for enhancer
├── test_gemini.py       # Gemini API test script
├── run-api.sh           # Start FastAPI server
├── run-dev.sh           # Start all dev services
└── run-function.sh      # Run Cloud Function locally

tests/                   # Test files
├── conftest.py          # Shared fixtures
└── test_*.py

docs/                    # Documentation

.github/
├── workflows/           # CI/CD (tests.yml, security-checks.yml)
├── skills/              # AI agent instructions
│   ├── recipe-improvement/
│   ├── pr-review-workflow/
│   └── working-context/
└── copilot-instructions.md

pyproject.toml           # Python project config
renovate.json            # Dependency updates
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
