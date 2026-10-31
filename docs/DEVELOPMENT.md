# Development Guide

## Setup

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)
- Node.js 20+ and [pnpm](https://pnpm.io/) (for mobile app)

### Installation

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone https://github.com/YOUR-USERNAME/meal-planner.git
cd meal-planner
uv sync --extra dev

# Mobile dependencies
cd mobile
pnpm install
```

### Prek Hooks

```bash
uv run prek install
```

## Running the Application

### FastAPI Backend

```bash
# Using the script
./scripts/run-api.sh

# Or manually
uv run uvicorn api.main:app --reload --reload-dir api --reload-dir config --port 8000
```

### Mobile App

The app uses Expo SDK 58, React Native 0.88.0, and React 19.3.0. Use Expo's installer
to keep native libraries and build tools compatible rather than upgrading them independently:

```bash
cd mobile
pnpm exec expo install --check
# After changing the Expo SDK version:
pnpm exec expo install --fix --pnpm
```

Expo 58 requires the explicit `expo/tsconfig.base.json` extension in `tsconfig.json`.
After an SDK upgrade, run type-checking, coverage, and a web export, and test an
iOS/Android development build on a device. Unit tests mock native modules and do not
establish native compatibility. Expo's installer also registers required config
plugins, such as `expo-font`.

```bash
cd mobile
pnpm install
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

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

The FastAPI backend requires the following environment variables:

| Variable                         | Required | Description                                                  |
| -------------------------------- | -------- | ------------------------------------------------------------ |
| `GOOGLE_CLOUD_PROJECT`           | Yes      | GCP project ID for Firestore                                 |
| `GOOGLE_APPLICATION_CREDENTIALS` | No       | Path to service account JSON (not needed with impersonation) |
| `SCRAPE_FUNCTION_URL`            | Yes      | URL of scrape Cloud Function                                 |
| `GCS_BUCKET_NAME`                | Yes      | GCS bucket name for recipe images                            |
| `ALLOWED_ORIGINS`                | Yes      | Comma-separated CORS origins                                 |
| `SKIP_AUTH`                      | No       | Set to `true` to skip Firebase auth (local dev)              |
| `SKIP_ALLOWLIST`                 | No       | Set to `true` to skip user allowlist check                   |

**GCP Authentication:** Use the setup script to configure service account impersonation (recommended):

```powershell
# PowerShell (Windows)
.\scripts\setup-local-dev.ps1 -ProjectId <your-project-id>
```

```bash
# Bash (Linux/macOS)
./scripts/setup-local-dev.sh <your-project-id>
```

**Scrape Function:** The API calls a separate Cloud Function to scrape recipes. For local development, run `./scripts/run-function.sh` in a separate terminal, or point to the deployed function:

```powershell
# PowerShell (Windows)
$env:SCRAPE_FUNCTION_URL = "https://your-region-your-project.cloudfunctions.net/scrape_recipe"
```

```bash
# Bash (Linux/macOS)
export SCRAPE_FUNCTION_URL="https://your-region-your-project.cloudfunctions.net/scrape_recipe"
```

### Mobile Environment Variables

Copy the example file and fill in your values:

```bash
cd mobile
cp .env.example .env.development
```

Without Firebase/OAuth values, the app runs in dev mode with a mock user (`dev@localhost`).

| Variable                           | Required | Description                                             |
| ---------------------------------- | -------- | ------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`              | Yes      | API URL (default: `http://localhost:8000`)              |
| `EXPO_PUBLIC_FIREBASE_*`           | No\*     | Firebase config for authentication                      |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | No\*     | OAuth web client ID for Google Sign-In (web and native) |

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

3. **Get the OAuth web client ID**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
   - Use the Web application client (also in Secret Manager as `meal-planner_oauth_client_id`)
   - Android and iOS use the same ID; Android also needs its package and signing key
     registered (see Android Release Pipeline)

4. **Configure Authorized Domains**
   - In Firebase Console > Authentication > Settings > Authorized domains
   - Add `localhost` for local development

## Development Workflow

### Running Tests

#### API (pytest)

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=api --cov-report=term-missing

# Specific file
uv run pytest tests/test_main.py -v
```

#### Mobile (Vitest)

```bash
cd mobile

# All tests
pnpm test

# With coverage
pnpm test:coverage

# Specific file
pnpm test -- lib/hooks/__tests__/use-recipes.test.ts
```

> **⚠️ Windows:** Vitest's default `threads` pool causes worker initialization
> timeouts on Windows due to Node.js `worker_threads` limitations with jsdom.
> The `vitest.config.ts` auto-detects Windows and uses `forks` pool instead,
> with `maxWorkers` capped at 50% of available parallelism to prevent resource
> exhaustion when spawning many forked processes.

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
uv run ty check api/
```

## API Endpoints

### Recipe Scraping

The API provides two methods for adding recipes from URLs:

#### Client-Side Scraping (Recommended)

```
POST /api/v1/recipes/parse
```

The mobile app fetches HTML directly and sends it to the API for parsing. This avoids
cloud IP blocking issues (e.g., ICA.se blocks Google Cloud IPs).

**Request:**

```json
{
  "url": "https://www.ica.se/recept/example",
  "html": "<html>...full page content...</html>"
}
```

#### Server-Side Scraping (Fallback)

```
POST /api/v1/recipes/scrape
```

The API fetches the HTML via Cloud Function. Only works for sites that don't block
cloud provider IP ranges.

**Request:**

```json
{
  "url": "https://www.allrecipes.com/recipe/12345"
}
```

#### Query Parameters

Both endpoints accept:

- `enhance=true` - Enhance recipe with AI after saving (requires Gemini API key)

## Project Structure

The project is a multi-platform meal planning system:

```
api/                     # FastAPI REST backend
├── main.py              # FastAPI app entry point
├── models/              # Pydantic models
├── routers/             # API route handlers
├── services/            # Business logic
└── storage/             # Firestore persistence

mobile/                  # React Native mobile app
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation screens
│   └── __tests__/       # Screen tests (auth, navigation)
├── components/          # Reusable UI components
├── lib/                 # Utilities, hooks, API client
│   ├── hooks/           # React Query hooks
│   │   └── __tests__/   # Hook tests
│   └── __tests__/       # Context/utility tests
├── test/                # Test setup, helpers, RN mocks
└── package.json

functions/               # Google Cloud Functions
└── scrape_recipe/       # Recipe scraping function

scripts/                 # CLI tools
├── recipe_enhancer.py   # Gemini AI recipe enhancement
├── batch_test.py        # Batch testing for enhancer
├── test_gemini.py       # Gemini API test script
├── run-api.sh           # Start FastAPI server
├── run-dev.sh           # Start all dev services
└── run-function.sh      # Run Cloud Function locally

tools/                   # Interactive CLI tools
├── admin_commands.py    # User & household management commands
└── recipe_manager.py    # Admin tool: recipes, users, households

tests/                   # API test files (pytest)
├── conftest.py          # Shared fixtures
└── test_*.py

docs/                    # Documentation

.github/
├── workflows/           # CI/CD (tests.yml, security-checks.yml, android-release.yml)
├── skills/              # AI agent instructions
│   ├── recipe-improvement/
│   ├── pr-review-workflow/
│   ├── working-context/
│   ├── copilot-self-improvement/
│   ├── local-development/
│   └── security/
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
# Recipe management (list, get, export, delete, enhance, etc.)
uv run python tools/recipe_manager.py --project <project_id> list
uv run python tools/recipe_manager.py --project <project_id> status

# User & household management
uv run python -m tools.recipe_manager --project <project_id> user get <email>
uv run python -m tools.recipe_manager --project <project_id> user list --household <id>
uv run python -m tools.recipe_manager --project <project_id> household list
uv run python -m tools.recipe_manager --project <project_id> household get <id>
uv run python -m tools.recipe_manager --project <project_id> household set <id> <field> <value>

# Test Gemini integration
uv run python scripts/test_gemini.py

# Batch test on sample recipes
uv run python scripts/batch_test.py
```

### What It Does

- Translates recipes to the household's configured language
- Adjusts ingredients for dietary restrictions (gluten-free, dairy-free, nut-free, etc.)
- Adapts cooking methods for available equipment (airfryer, sous vide, etc.)
- Replaces branded spice mixes with individual ingredients
- Adds coordinated timelines for complex multi-step recipes
- Cleans up ingredient formatting (fractions, deduplication, spices last)

### Configuration

Household preferences are configured in the system prompt within `scripts/recipe_enhancer.py`.
See `.github/copilot-instructions.md` for the multi-tenant architecture plan.

---

## Android Release Pipeline

`.github/workflows/android-release.yml` builds a signed Android App Bundle with **EAS
Build** (Expo cloud, free monthly build quota per Expo account) and submits it to the
Google Play **internal testing** track (invited testers only). EAS stores the signing
keystore, so no keystore is kept in the repo. The Expo project belongs to the
`aroma-team` organization (`owner` and `extra.eas.projectId` in `mobile/app.json`).

**Triggers:** pushing a version tag (`git tag v1.0.1 && git push origin v1.0.1`) or a
manual run from the Actions tab. The Android `versionCode` is incremented by EAS
(`appVersionSource: "remote"` + `autoIncrement` in `mobile/eas.json`).

| Part                                                      | How                                                     |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Google Play Android Developer API, Play publisher account | Terraform (`infra/modules/apis`, `infra/modules/iam`)   |
| Play publisher JSON key                                   | One-time manual step (kept out of the Terraform state)  |
| Play Console app, declarations, testers, account invite   | Manual in Play Console (no API)                         |
| Build-time `EXPO_PUBLIC_*` values, keystore               | `eas` CLI (the keystore is generated and stored by EAS) |

**One-time setup** (order matters; run `eas` commands from `mobile/`):

1. **Package name** - `com.aroma.mealplanner` (`expo.android.package` in `mobile/app.json`)
   must equal the app in Play Console. Google Play fixes it when the app is created, and
   EAS keeps one keystore per package name, so never change it after the first upload.

1. **Build-time variables** - cloud builds never see the gitignored `mobile/.env*` files.
   Fill in `mobile/.env.production` with real values, not the `.env.example` placeholders
   (the Firebase values, API URL and web client ID are in Secret Manager as
   `github_EXPO_PUBLIC_*` and `meal-planner_oauth_client_id`), then:

   ```bash
   eas env:push production --path .env.production
   eas env:list production     # every EXPO_PUBLIC_* name should be listed
   ```

   The `production` build profile uses this environment. The values are public by
   design (they are embedded in the app).

1. **Expo token** - in the `aroma-team` organization on expo.dev, create a robot user
   with an access token and store it as the `EXPO_TOKEN` repository secret
   (`gh secret set EXPO_TOKEN`). A robot token does not depend on anyone's login.

1. **Terraform** - apply `infra/environments/dev` (or merge to `main`). This enables the
   Google Play Android Developer API and creates the Play publisher service account:
   `terraform output play_publisher_sa`.

1. **Play Console app** - create the app with the package name above and the store title
   "Aroma Meal Planner" (the launcher shows `expo.name`, "Aroma"), complete the **App
   content** declarations (privacy policy, data safety, content rating, target audience,
   app access), and under **Testing > Internal testing** create the track and add the
   testers' emails.

1. **First build and upload (manual, once)** - Google Play requires the first bundle of
   a new app to be uploaded in the Console. On a clean working tree:

   ```bash
   eas build --platform android --profile production
   ```

   Answer **yes** when asked to generate an Android keystore (run interactively). Download
   the `.aab`, then in Play Console create an Internal testing release, accept Play App
   Signing, upload the file and roll it out. This build's certificate becomes the app's
   upload key; every later bundle must be signed with the same keystore.

1. **Play publisher key and permission** - create a key, store it as a secret, delete the
   local copy:

   ```powershell
   # PowerShell
   gcloud iam service-accounts keys create play-key.json --iam-account=<play_publisher_sa> --project=<PROJECT_ID>
   Get-Content play-key.json -Raw | gh secret set PLAY_SERVICE_ACCOUNT_JSON
   Remove-Item play-key.json
   ```

   ```bash
   # bash
   gcloud iam service-accounts keys create play-key.json --iam-account=<play_publisher_sa> --project=<PROJECT_ID>
   gh secret set PLAY_SERVICE_ACCOUNT_JSON < play-key.json
   rm play-key.json
   ```

   Then in Play Console, **Users and permissions > Invite new users**: add the service
   account email with permission to release to testing tracks for this app.

1. **Google sign-in on Play-installed builds** - native sign-in uses
   `@react-native-google-signin/google-signin` with the web client ID, but Google also
   requires an Android OAuth client for the package and signing certificate. Terraform
   registers the app in Firebase (`google_firebase_android_app` in `infra/modules/firebase`)
   and Firebase creates that client itself. Testers get a copy that Google re-signs, so the
   fingerprints are those of the **Play app signing key** (Play Console: Protected with
   Play > Play Store protection > Manage Play app signing > App signing key; or download
   the "Signed, universal APK" under Test and release > Latest releases and bundles >
   Downloads and run `keytool -printcert -jarfile <apk>`). Put them in
   `infra/environments/dev/terraform.tfvars` as lowercase hex without colons:

   ```hcl
   android_package_name  = "com.aroma.mealplanner"
   android_sha1_hashes   = ["<play-app-signing-sha1>"]
   android_sha256_hashes = ["<play-app-signing-sha256>"]
   ```

   CI rebuilds `terraform.tfvars` from the `TF_VARS_FILE` secret, so after any change run
   `infra/environments/dev/scripts/sync-access-secrets.ps1` (or `.sh`); otherwise plan and
   apply fail on the missing variables. Then check that **APIs & Services > Credentials**
   lists an auto-created "Android client for com.aroma.mealplanner".

After setup, a release is one command: `git tag v1.0.1 && git push origin v1.0.1`.
To widen the beta later, change `submit.production.android.track` in `mobile/eas.json`
from `internal` to a closed-testing track (e.g. `alpha`).

The app requests no microphone access: `expo-image-picker` would add `RECORD_AUDIO` for
video capture, so `mobile/app.json` sets `microphonePermission: false` and blocks the
permission.

---

## Troubleshooting

### Common Issues

**UV not found:**

```bash
# Reload shell or source profile
source ~/.bashrc  # or ~/.zshrc
```

**Prek fails:**

```bash
# Update hooks
uv run prek auto-update

# Run manually
uv run prek run --all-files
```
