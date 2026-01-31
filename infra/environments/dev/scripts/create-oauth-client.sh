#!/bin/bash
# Create OAuth 2.0 Client for Firebase Auth
# This script creates an OAuth client and stores the credentials in Secret Manager
#
# Prerequisites:
# - gcloud CLI authenticated
# - Project ID set
#
# Usage: ./create-oauth-client.sh <project-id> [display-name]

set -e

PROJECT_ID="${1:?Error: Project ID required}"
DISPLAY_NAME="${2:-Meal Planner Mobile}"

echo -e "\033[36mCreating OAuth 2.0 client for project: $PROJECT_ID\033[0m"

# Check if OAuth brand exists, create if not
echo -e "\033[33mChecking OAuth consent screen...\033[0m"
BRAND=$(gcloud iap oauth-brands list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null || true)

if [ -z "$BRAND" ]; then
    echo -e "\033[33mCreating OAuth consent screen...\033[0m"
    USER_EMAIL=$(gcloud config get-value account)
    gcloud iap oauth-brands create \
        --application_title="Meal Planner" \
        --support_email="$USER_EMAIL" \
        --project="$PROJECT_ID"
    BRAND=$(gcloud iap oauth-brands list --project="$PROJECT_ID" --format="value(name)")
fi

echo -e "\033[32mBrand: $BRAND\033[0m"

# Create OAuth client
echo -e "\033[33mCreating OAuth client...\033[0m"
CLIENT_JSON=$(gcloud iap oauth-clients create "$BRAND" \
    --display_name="$DISPLAY_NAME" \
    --format=json \
    --project="$PROJECT_ID")

CLIENT_ID=$(echo "$CLIENT_JSON" | jq -r '.name | split("/") | last')
CLIENT_SECRET=$(echo "$CLIENT_JSON" | jq -r '.secret')

echo -e "\033[32mClient ID: $CLIENT_ID\033[0m"

# Store in Secret Manager
echo -e "\033[33mStoring credentials in Secret Manager...\033[0m"

store_secret() {
    local secret_id="$1"
    local secret_value="$2"

    # Check if secret exists
    if ! gcloud secrets describe "$secret_id" --project="$PROJECT_ID" &>/dev/null; then
        gcloud secrets create "$secret_id" --project="$PROJECT_ID" --replication-policy=automatic
    fi

    # Add new version
    echo -n "$secret_value" | gcloud secrets versions add "$secret_id" --project="$PROJECT_ID" --data-file=-
    echo -e "\033[32mStored: $secret_id\033[0m"
}

store_secret "firebase-oauth-client-id" "$CLIENT_ID"
store_secret "firebase-oauth-client-secret" "$CLIENT_SECRET"

echo ""
echo -e "\033[32mOAuth client created successfully!\033[0m"
echo ""
echo -e "\033[36mThe credentials are stored in Secret Manager. Terraform will read them automatically.\033[0m"
echo ""
echo -e "\033[33mNext steps:\033[0m"
echo "1. Run: terraform apply"
echo "2. Run: terraform output -json firebase_config"
