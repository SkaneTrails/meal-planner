#!/usr/bin/env bash
# Sync Terraform access files to GitHub Secrets
#
# Reads access/superusers.txt and access/users.txt (gitignored, contain emails)
# and stores their content as GitHub secrets so CI/CD workflows can reconstruct
# them during terraform apply.
#
# Run this script whenever you add or remove users from the access files.
#
# Prerequisites:
# - gh CLI authenticated (gh auth login)
# - Access files exist in infra/environments/dev/access/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ACCESS_DIR="$SCRIPT_DIR/../access"
TFVARS_PATH="$SCRIPT_DIR/../terraform.tfvars"

# Detect repo from git remote if not provided as argument
if [[ -n "${1:-}" ]]; then
    REPO="$1"
else
    remote_url=$(git remote get-url origin 2>/dev/null || true)
    REPO=$(echo "$remote_url" | sed -E 's#.+[:/]([^/]+/[^/.]+?)(\.git)?$#\1#')
    if [[ -z "$REPO" || "$REPO" == "$remote_url" ]]; then
        echo "Error: Could not detect repository. Pass owner/name as argument." >&2
        exit 1
    fi
fi

echo "Syncing access files to GitHub Secrets"
echo "Repository: $REPO"
echo ""

# Verify gh CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "Error: gh CLI not authenticated. Run 'gh auth login' first." >&2
    exit 1
fi

# Helper: read file, strip comments and blank lines
clean_content() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        return 1
    fi
    grep -v '^\s*#' "$file" | grep -v '^\s*$' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

synced=0

# Sync each access file
declare -A FILES=(
    ["superusers.txt"]="TF_SUPERUSERS"
    ["users.txt"]="TF_USERS"
)

for filename in "${!FILES[@]}"; do
    secret="${FILES[$filename]}"
    filepath="$ACCESS_DIR/$filename"

    content=$(clean_content "$filepath" 2>/dev/null || true)
    if [[ -z "$content" ]]; then
        echo "  Skipping $filename (empty or not found)"
        continue
    fi

    emails=$(echo "$content" | wc -l | tr -d ' ')
    echo "  $filename: $emails email(s)"

    echo -n "$content" | gh secret set "$secret" --repo "$REPO"
    echo "  Stored as $secret"
    ((synced += 1))
done

# Also sync tfvars
if [[ -f "$TFVARS_PATH" ]]; then
    gh secret set TF_VARS_FILE --repo "$REPO" < "$TFVARS_PATH"
    echo "  terraform.tfvars stored as TF_VARS_FILE"
    ((synced += 1))
else
    echo "  Skipping terraform.tfvars (not found)"
fi

echo ""
if [[ $synced -gt 0 ]]; then
    echo "Synced $synced secret(s) to GitHub"
else
    echo "No files synced. Create access files first:"
    echo "  mkdir -p access"
    echo "  echo 'your-email@example.com' > access/superusers.txt"
fi
echo ""
echo "These secrets are used by the terraform-deploy workflow in CI/CD."
