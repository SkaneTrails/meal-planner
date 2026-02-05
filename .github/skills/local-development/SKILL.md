# Local Development Setup

Instructions for setting up and running the Meal Planner app locally.

## ⚠️ FIRST: Check Environment Setup

**Before starting any local development, ALWAYS check if `mobile/.env.development` exists:**

```bash
# Check if the file exists
ls mobile/.env.development
```

**If the file does NOT exist:**

1. **Ask the user** for the GCP project ID
2. **Verify gcloud authentication**: `gcloud auth list`
3. **Create the file** by fetching secrets:

```bash
PROJECT=<project-id-from-user>

cat > mobile/.env.development << EOF
# Development environment variables
EXPO_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_API_KEY --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT}.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT}.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_APP_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_APP_ID --project=$PROJECT)

# Google OAuth Client ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$(gcloud secrets versions access latest --secret=meal-planner_oauth_client_id --project=$PROJECT)
EOF

echo "Created mobile/.env.development"
```

4. **Verify the file** has actual values (not error messages)

---

## ⚠️ Backend Environment Setup

**Check if `.env` exists in the project root with required variables:**

```bash
# Check if the file exists
ls .env
```

**If missing or incomplete, create/update it:**

```bash
PROJECT=<project-id-from-user>

cat > .env << EOF
# GCP project ID for Firestore (REQUIRED - prevents using wrong gcloud default project)
GOOGLE_CLOUD_PROJECT=$PROJECT

# Gemini API key for recipe enhancement (optional - only for recipe_enhancer.py)
GOOGLE_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=$PROJECT)

# Recipe scraping Cloud Function URL
SCRAPE_FUNCTION_URL=https://scrape-recipe-vt7bvshx5q-ew.a.run.app

# Skip Firebase authentication for local development
SKIP_AUTH=true
EOF

echo "Created .env"
```

**Important**: `GOOGLE_CLOUD_PROJECT` is required to ensure Firestore connects to the correct project.

---

## ⚠️ GCP Service Account Setup (Required for Firestore Access)

ADC (Application Default Credentials) from `gcloud auth application-default login` uses an OAuth client that may not be authorized for the project's Firestore API (causing `CONSUMER_INVALID` errors). **Service account impersonation is required for local development.**

### Automated Setup (Recommended)

Run the setup script which handles everything:

```powershell
# PowerShell (Windows)
.\scripts\setup-local-dev.ps1 -ProjectId <PROJECT_ID>
```

```bash
# Bash (macOS/Linux)
./scripts/setup-local-dev.sh <PROJECT_ID>
```

The script will:
1. Run `terraform apply` to create the `local-dev` service account (if it doesn't exist)
2. Grant your user account permission to impersonate the service account
3. Configure ADC to use impersonation (no key files on disk!)
4. Update `.env` with the correct project ID

### Why Impersonation Instead of Key Files?

| Key Files | Impersonation |
|-----------|---------------|
| Long-lived credentials on disk | Short-lived tokens (1 hour) |
| Must rotate manually | Automatic token refresh |
| Can be accidentally committed | Nothing to commit |
| Proliferates keys in GCP | No keys created |

### Manual Setup (if script fails)

**1. Apply Terraform** (creates service account):
```bash
cd infra/environments/dev
terraform apply
```

**2. Grant impersonation permission:**
```bash
gcloud iam service-accounts add-iam-policy-binding \
  local-dev@<PROJECT_ID>.iam.gserviceaccount.com \
  --member="user:YOUR_EMAIL@example.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=<PROJECT_ID>
```

**3. Configure ADC with impersonation:**
```bash
gcloud auth application-default login \
  --impersonate-service-account=local-dev@<PROJECT_ID>.iam.gserviceaccount.com
```

### Service Account Permissions

The `local-dev` service account has:
- `roles/datastore.user` - Firestore read/write access
- `roles/storage.objectUser` - GCS bucket access (recipe images)
- `roles/secretmanager.secretAccessor` - Read secrets

### Refreshing Credentials

Impersonation tokens last 1 hour. If you get auth errors after a while:
```bash
gcloud auth application-default login \
  --impersonate-service-account=local-dev@<PROJECT_ID>.iam.gserviceaccount.com
```

---

## ⚠️ IMPORTANT: Running the App for Debugging

**Before starting services, check if they're already running:**

```bash
# Check if API is running (port 8000)
curl -s http://localhost:8000/health && echo "API already running" || echo "API not running"

# Check if Expo is running (port 8081)
curl -s http://localhost:8081 && echo "Expo already running" || echo "Expo not running"
```

```powershell
# Windows PowerShell - check ports
netstat -ano | findstr :8000   # API
netstat -ano | findstr :8081   # Expo
```

**Only start services that are NOT already running:**

1. **API server** (for data): `uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload`
2. **Mobile app** (Expo): `cd mobile && npx expo start --web`

Or use the combined script (bash): `./scripts/run-dev.sh`

The mobile app requires the API to be running for all data operations (recipes, meal plans, grocery lists).

---

## Finding the GCP Project ID

The project ID is stored in `infra/environments/dev/terraform.tfvars` (gitignored). Ask the user if not available.

## Prerequisites

1. **gcloud CLI** authenticated with access to the GCP project
2. **UV** (Python package manager)
3. **Node.js** (for mobile app)

## Quick Start

### 1. Backend (FastAPI)

```bash
# Install dependencies
uv sync

# Start API server
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### 2. Mobile App (Expo)

Ensure `mobile/.env.development` exists (see "FIRST: Check Environment Setup" above).

Then start the app:

```bash
cd mobile
npm install
npx expo start --web    # For web debugging
npx expo start --lan    # For mobile device (Expo Go)
```

To test against the production API instead of local:
```bash
# In mobile/.env.development, change to Cloud Run URL:
EXPO_PUBLIC_API_URL=https://<service>-<hash>-<region>.a.run.app
# Get the actual URL from: gcloud run services describe meal-planner-api --region=<region> --format='value(status.url)'
```

### 3. Both Services Together (Bash/macOS/Linux only)

```bash
./scripts/run-dev.sh
```

### 4. Windows Quick Start

```powershell
# Terminal 1: API
cd c:\git\meal-planner
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Mobile
cd c:\git\meal-planner\mobile
npm install
npx expo start --web --port 8081
```

## Secret Manager Secrets

These secrets are used by GitHub Actions for CI/CD deployments and can be used locally to populate `.env.development`.

| Secret Name | Purpose |
|-------------|---------|
| `github_EXPO_PUBLIC_API_URL` | Production API URL for Firebase Hosting deploy |
| `github_EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `github_EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase Web App ID |
| `github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `meal-planner_oauth_client_id` | Google OAuth client ID (for sign-in) |
| `meal-planner_oauth_client_secret` | Google OAuth client secret |
| `meal-planner-database-name` | Firestore database name |
| `meal-planner-project-id` | GCP project ID |
| `firestore-database-name` | Firestore database name (duplicate) |
| `firestore-location-id` | Firestore location |
| `firestore-project-id` | Firestore project ID |
| `gemini-api-key` | Gemini API key (for recipe enhancement scripts) |

## Dev Mode (Without Firebase Auth)

If you want to test without real Google authentication, remove or comment out the Firebase credentials in `.env.development`:

```bash
# Comment out these lines in mobile/.env.development:
# EXPO_PUBLIC_FIREBASE_API_KEY=...
# EXPO_PUBLIC_FIREBASE_APP_ID=...
```

The app checks `isFirebaseConfigured` in `mobile/lib/firebase.ts` and will use a mock user (`dev@localhost`) when Firebase isn't configured.

## Troubleshooting

### "Permission denied" on gcloud secrets

Make sure you're authenticated with an account that has access:

```bash
gcloud auth login
gcloud config set project <project-id>
```

### Firebase auth/invalid-api-key error

The `.env.development` file is missing or has incorrect Firebase credentials. Check that the file exists and has valid values for `EXPO_PUBLIC_FIREBASE_API_KEY` and `EXPO_PUBLIC_FIREBASE_APP_ID`.

### API not reachable from mobile

1. Ensure the API is running on `0.0.0.0` (not `127.0.0.1`)
2. Use your machine's LAN IP in `EXPO_PUBLIC_API_URL`
3. Check that both devices are on the same network

### CONSUMER_INVALID error on Firestore API

This error occurs when using ADC from `gcloud auth application-default login`:

```
google.api_core.exceptions.PermissionDenied: 403 Permission denied on resource project...
[reason: "CONSUMER_INVALID"]
```

**Solution**: Use service account impersonation instead of plain ADC. See "GCP Service Account Setup" section above.

The issue is that gcloud's OAuth client ID is not authorized for the project's Firestore API. Service account impersonation bypasses this OAuth client issue.

### Port already in use

```bash
# macOS/Linux
pkill -f "uvicorn"
pkill -f "expo"
pkill -f "node.*metro"
```

```powershell
# Windows PowerShell
Get-Process | Where-Object { $_.ProcessName -match "node|python" } | Stop-Process -Force
# Or find specific port:
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

---

## Mobile Web Deployment (Firebase Hosting)

The mobile app is deployed as a static web export to Firebase Hosting.

**Build command:** `npm run build:web` (runs font copy + `npx expo export --platform web`)

### Known Pitfalls

| Issue | Solution |
|-------|----------|
| **Fonts not bundled** | Expo static export doesn't include `@expo/vector-icons` fonts. Copy TTF to `public/fonts/` and load via `useFonts({ Ionicons: require('../public/fonts/Ionicons.ttf') })` |
| **NativeWind + Tailwind v4** | NativeWind 4 only supports Tailwind CSS v3. Renovate rule prevents v4 upgrades in `mobile/` |
| **OAuth redirect_uri_mismatch** | Add `https://<project>.firebaseapp.com/__/auth/handler` to BOTH OAuth clients in Google Cloud Console |
| **signInWithRedirect fails** | Cross-domain credential storage issue between localhost and firebaseapp.com. Use `signInWithPopup` instead |
| **CORS 403 Forbidden** | Cloud Run needs `allow_public_access = true` in Terraform for public API access |
| **COOP popup warning** | "Cross-Origin-Opener-Policy would block window.close" is harmless - sign-in still works |

### Authentication Flow (Web)

1. User clicks "Sign in with Google" → `signInWithPopup(auth, googleProvider)`
2. Firebase handles OAuth flow via popup
3. On success, `onAuthStateChanged` fires with user
4. API requests include `Authorization: Bearer <id_token>`
5. FastAPI validates token via `firebase_admin.auth.verify_id_token()`
