---
name: local-development
description: GCP secrets, .env setup, starting servers, and troubleshooting local development
---

# Local Development Setup

Get the Meal Planner app running locally with minimal manual work.

## Prerequisites

- **gcloud CLI** — authenticated with project access
- **UV** — Python package manager (`pip install uv`)
- **Node.js** + **pnpm** — for mobile app (`npm install -g pnpm`)

## GCP Project ID

Stored in `infra/environments/dev/terraform.tfvars` (gitignored). Ask the user if not available.

---

## Step 1: GCP Authentication

ADC from `gcloud auth application-default login` causes `CONSUMER_INVALID` errors. **Service account impersonation is required.**

### Automated (recommended)

```powershell
# Windows
.\scripts\setup-local-dev.ps1 -ProjectId <PROJECT_ID>
```

```bash
# macOS/Linux
./scripts/setup-local-dev.sh <PROJECT_ID>
```

The script creates the `local-dev` service account via Terraform, grants impersonation, configures ADC, and updates `.env`.

### Manual (if script fails)

```bash
cd infra/environments/dev && terraform apply
gcloud iam service-accounts add-iam-policy-binding \
  local-dev@<PROJECT_ID>.iam.gserviceaccount.com \
  --member="user:<YOUR_EMAIL>" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=<PROJECT_ID>
gcloud auth application-default login \
  --impersonate-service-account=local-dev@<PROJECT_ID>.iam.gserviceaccount.com
```

Tokens expire after 1 hour — re-run the `gcloud auth application-default login` command above to refresh.

The service account has: `roles/datastore.user`, `roles/storage.objectUser`, `roles/secretmanager.secretAccessor`.

---

## Step 2: Environment Files

### Root `.env` (API backend)

```bash
PROJECT=<project-id-from-user>

cat > .env << EOF
GOOGLE_CLOUD_PROJECT=$PROJECT
GOOGLE_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key --project=$PROJECT)
SCRAPE_FUNCTION_URL=https://scrape-recipe-vt7bvshx5q-ew.a.run.app
GCS_BUCKET_NAME=${PROJECT}-recipe-images
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:8085,http://localhost:19006,http://localhost:3000
SKIP_AUTH=true
EOF

echo "Created .env"
```

`GOOGLE_API_KEY` is optional (only needed for recipe enhancement).

### `mobile/.env.development` (mobile app)

```bash
PROJECT=<project-id-from-user>

cat > mobile/.env.development << EOF
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_API_KEY --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT}.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT}.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_APP_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_APP_ID --project=$PROJECT)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$(gcloud secrets versions access latest --secret=meal-planner_oauth_client_id --project=$PROJECT)
EOF

echo "Created mobile/.env.development"
```

Verify the file has actual values, not error messages.

### Dev mode (no Firebase auth)

Omit `EXPO_PUBLIC_FIREBASE_API_KEY` and `EXPO_PUBLIC_FIREBASE_APP_ID` from `mobile/.env.development`. The app detects missing config (`isFirebaseConfigured` in `mobile/lib/firebase.ts`) and uses mock user `dev@localhost`.

---

## Step 3: Start Services

**Before starting, check if services are already running** — avoid duplicate listeners:

```powershell
netstat -ano | findstr :8000   # API
netstat -ano | findstr :8081   # Expo
```

### API (Terminal 1)

```bash
uv sync
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Mobile (Terminal 2)

```bash
cd mobile
pnpm install
npx expo start --web --port 8081
```

The mobile app requires the API for all data operations.

### Production API target

To test mobile against Cloud Run instead of local API, set in `mobile/.env.development`:

```
EXPO_PUBLIC_API_URL=https://<service>-<hash>-<region>.a.run.app
```

---

## Step 4: Verify Setup

### API tests (pytest)

```bash
uv run pytest                                    # All tests
uv run pytest --cov=api --cov-report=term-missing # With coverage
uv run pytest tests/test_recipe_storage.py -v     # Single file
```

### Mobile tests (Vitest)

```bash
cd mobile
pnpm test              # All tests
pnpm test -- --run     # CI mode (no watch)
pnpm test <pattern>    # Filter by filename
```

Note: Windows uses `forks` pool automatically (configured in `vitest.config.ts`).

### Linting

```bash
uv run ruff check      # Python lint
uv run ruff format     # Python format
cd mobile && pnpm exec prettier --check .  # TypeScript/TSX format
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `CONSUMER_INVALID` on Firestore | ADC not using impersonation — re-run setup script |
| "Permission denied" on secrets | `gcloud auth login` + `gcloud config set project <id>` |
| Firebase `auth/invalid-api-key` | Check `mobile/.env.development` has real values, not error text |
| Impersonation token expired | Re-run `gcloud auth application-default login --impersonate-service-account=...` |
| Metro ESM URL scheme error (Windows) | Known Node 20+ issue — use CI for mobile builds, web dev works |
| API not reachable from mobile | Ensure API runs on `0.0.0.0` (not `127.0.0.1`), use LAN IP in `EXPO_PUBLIC_API_URL` |
| Port already in use | `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` (Windows) |

---

## Mobile Web Deployment (Firebase Hosting)

The mobile app is deployed as a static web export to Firebase Hosting.

**Build command:** `pnpm run build:web` (runs font copy + `npx expo export --platform web`)

### Known Pitfalls

| Issue | Solution |
| ----- | -------- |
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
