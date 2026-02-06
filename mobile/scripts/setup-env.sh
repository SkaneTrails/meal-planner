#!/usr/bin/env bash
# Fetch secrets from Google Cloud Secret Manager and create .env file
#
# Usage:
#   ./scripts/setup-env.sh
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - GOOGLE_CLOUD_PROJECT env var set

set -e

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT env var}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "🔐 Fetching secrets from Google Cloud Secret Manager..."

# Function to fetch a secret
get_secret() {
    local secret_name="$1"
    local value
    if value=$(gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT_ID" 2>/dev/null); then
        echo "$value"
    else
        echo "  ⚠️  Secret '$secret_name' not found, skipping" >&2
        echo ""
    fi
}

# Fetch all secrets
EXPO_PUBLIC_API_URL=$(get_secret "github_EXPO_PUBLIC_API_URL")
EXPO_PUBLIC_FIREBASE_API_KEY=$(get_secret "github_EXPO_PUBLIC_FIREBASE_API_KEY")
EXPO_PUBLIC_FIREBASE_APP_ID=$(get_secret "github_EXPO_PUBLIC_FIREBASE_APP_ID")
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(get_secret "github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$(get_secret "meal-planner_oauth_client_id")

# Derived values (not in Secret Manager)
FIREBASE_PROJECT_ID="$PROJECT_ID"

# Default API URL to localhost if not set
if [ -z "$EXPO_PUBLIC_API_URL" ]; then
    EXPO_PUBLIC_API_URL="http://localhost:8000"
fi

echo ""
echo "📝 Creating .env file..."

cat > "$ENV_FILE" << EOF
# API endpoint (use localhost for local backend, or Cloud Run URL for production)
# To use local backend, change to: http://localhost:8000
EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=${EXPO_PUBLIC_FIREBASE_API_KEY}
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_PROJECT_ID}.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${FIREBASE_PROJECT_ID}.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
EXPO_PUBLIC_FIREBASE_APP_ID=${EXPO_PUBLIC_FIREBASE_APP_ID}

# Google OAuth Client IDs (for Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}
EOF

echo ""
echo "✅ Created .env file at: $ENV_FILE"
echo ""
echo "📝 Note: API URL is set to production. For local development, edit .env:"
echo "   EXPO_PUBLIC_API_URL=http://localhost:8000"
