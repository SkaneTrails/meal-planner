# Local Development Setup

Instructions for setting up and running the Meal Planner app locally.

## Finding the GCP Project ID

The project ID is stored in `infra/environments/dev/terraform.tfvars` (gitignored). Check this file first:

```bash
grep "^project" infra/environments/dev/terraform.tfvars
```

If the file doesn't exist or the project isn't set, **ask the user for the GCP project ID**.

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

First, populate the `.env` file with secrets from GCP:

```bash
cd mobile

# Get your local IP for the API URL
LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

# Set the project ID (from terraform.tfvars or ask user)
PROJECT=<project-id>

# Fetch secrets and create .env
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:8000
EXPO_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_API_KEY --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT}.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT
EXPO_PUBLIC_FIREBASE_APP_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_APP_ID --project=$PROJECT)
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(gcloud secrets versions access latest --secret=github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --project=$PROJECT)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$(gcloud secrets versions access latest --secret=meal-planner_oauth_client_id --project=$PROJECT)
EOF
```

Then start the app:

```bash
npm install
npx expo start --lan
```

### 3. Both Services Together

```bash
./scripts/run-dev.sh
```

## Secret Manager Secrets

| Secret Name | Purpose |
|-------------|---------|
| `github_EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `github_EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase Web App ID |
| `github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `meal-planner_oauth_client_id` | Google OAuth client ID (for sign-in) |
| `meal-planner_oauth_client_secret` | Google OAuth client secret |
| `meal-planner-database-name` | Firestore database name |
| `meal-planner-project-id` | GCP project ID |
| `gemini-api-key` | Gemini API key (for recipe enhancement) |

## Dev Mode (Without Firebase)

If you don't have access to GCP secrets, the app can run in "dev mode":

1. Only set `EXPO_PUBLIC_API_URL` in `.env`
2. The app will use a mock user (`dev@localhost`) instead of real authentication

This is handled by conditional Firebase initialization in `mobile/lib/firebase.ts`.

## Troubleshooting

### "Permission denied" on gcloud secrets

Make sure you're authenticated with an account that has access:

```bash
gcloud auth login
gcloud config set project <project-id>
```

### Firebase auth/invalid-api-key error

The `.env` file is missing or has incorrect Firebase credentials. Re-run the secret fetching commands above.

### API not reachable from mobile

1. Ensure the API is running on `0.0.0.0` (not `127.0.0.1`)
2. Use your machine's LAN IP in `EXPO_PUBLIC_API_URL`
3. Check that both devices are on the same network

### Port already in use

```bash
# Kill existing processes
pkill -f "uvicorn"
pkill -f "expo"
pkill -f "node.*metro"
```
