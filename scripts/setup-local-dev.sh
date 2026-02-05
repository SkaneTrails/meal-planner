#!/bin/bash
# Setup local development environment for Meal Planner
# Uses service account impersonation (no key files needed)
#
# Usage: ./setup-local-dev.sh <project-id>

set -e

# Check for required argument
if [ -z "$1" ]; then
    echo "Usage: $0 <project-id>"
    echo "Example: $0 my-project-123"
    exit 1
fi

# Configuration
PROJECT="$1"
SA_EMAIL="local-dev@$PROJECT.iam.gserviceaccount.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../infra/environments/dev"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "=== Meal Planner Local Development Setup ==="
echo ""

# Check gcloud is authenticated
echo "Checking gcloud authentication..."
ACCOUNT=$(gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null || true)
if [ -z "$ACCOUNT" ]; then
    echo "ERROR: Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi
echo "Authenticated as: $ACCOUNT"

# Check if service account exists
echo ""
echo "Checking if local-dev service account exists..."
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT" >/dev/null 2>&1; then
    echo "Service account doesn't exist. Running Terraform..."
    pushd "$TERRAFORM_DIR" > /dev/null
    if ! terraform init -upgrade; then
        echo "ERROR: terraform init failed. Aborting setup."
        popd > /dev/null
        exit 1
    fi
    if ! terraform apply -auto-approve; then
        echo "ERROR: terraform apply failed. Aborting setup."
        popd > /dev/null
        exit 1
    fi
    popd > /dev/null
else
    echo "Service account exists: $SA_EMAIL"
fi

# Grant current user permission to impersonate the service account
echo ""
echo "Granting impersonation permission to $ACCOUNT..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --member="user:$ACCOUNT" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project="$PROJECT" 2>/dev/null || echo "WARNING: Could not grant impersonation permission. You may need to do this manually."

# Setup ADC with impersonation
echo ""
echo "Setting up Application Default Credentials with impersonation..."
gcloud auth application-default login --impersonate-service-account="$SA_EMAIL"

echo "ADC configured with service account impersonation."

# Update .env file if needed
echo ""
echo "Checking .env file..."

if [ -f "$ENV_FILE" ]; then
    # Remove any existing GOOGLE_APPLICATION_CREDENTIALS (not needed with impersonation)
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS" "$ENV_FILE"; then
        echo "Removing GOOGLE_APPLICATION_CREDENTIALS from .env (not needed with impersonation)..."
        sed -i.bak '/GOOGLE_APPLICATION_CREDENTIALS/d' "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    fi

    # Ensure GOOGLE_CLOUD_PROJECT is set and matches the provided project
    if ! grep -q "GOOGLE_CLOUD_PROJECT" "$ENV_FILE"; then
        echo "Adding GOOGLE_CLOUD_PROJECT to .env..."
        echo "" >> "$ENV_FILE"
        echo "# GCP project ID for Firestore" >> "$ENV_FILE"
        echo "GOOGLE_CLOUD_PROJECT=$PROJECT" >> "$ENV_FILE"
    else
        CURRENT_PROJECT=$(grep -E '^GOOGLE_CLOUD_PROJECT=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2-)
        if [ "$CURRENT_PROJECT" != "$PROJECT" ]; then
            echo "Updating GOOGLE_CLOUD_PROJECT in .env from '$CURRENT_PROJECT' to '$PROJECT'..."
            sed -i.bak "s/^GOOGLE_CLOUD_PROJECT=.*/GOOGLE_CLOUD_PROJECT=$PROJECT/" "$ENV_FILE"
            rm -f "$ENV_FILE.bak"
        fi
    fi
    echo ".env is configured."
else
    echo "Creating .env file..."
    cat > "$ENV_FILE" << EOF
# GCP project ID for Firestore
GOOGLE_CLOUD_PROJECT=$PROJECT

# Recipe scraping Cloud Function URL
SCRAPE_FUNCTION_URL=https://scrape-recipe-vt7bvshx5q-ew.a.run.app

# Skip Firebase authentication for local development
SKIP_AUTH=true
EOF
    echo "Created .env"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "You can now start the API:"
echo "  uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "Note: ADC uses service account impersonation - no key files on disk!"
echo "To refresh credentials, re-run this script or:"
echo "  gcloud auth application-default login --impersonate-service-account=$SA_EMAIL"
