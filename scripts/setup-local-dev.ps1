#!/usr/bin/env pwsh
# Setup local development environment for Meal Planner
# Uses service account impersonation (no key files needed)
#
# Usage: .\setup-local-dev.ps1 -ProjectId <your-gcp-project-id>

param(
    [Parameter(Mandatory=$true, HelpMessage="GCP Project ID (e.g., my-project-123)")]
    [string]$ProjectId
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT = $ProjectId
$SA_EMAIL = "local-dev@$PROJECT.iam.gserviceaccount.com"
$TERRAFORM_DIR = "$PSScriptRoot\..\infra\environments\dev"
$ENV_FILE = "$PSScriptRoot\..\.env"

Write-Host "=== Meal Planner Local Development Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check gcloud is authenticated
Write-Host "Checking gcloud authentication..." -ForegroundColor Yellow
$account = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
if (-not $account) {
    Write-Host "ERROR: Not authenticated with gcloud. Run: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "Authenticated as: $account" -ForegroundColor Green

# Check if service account exists
Write-Host ""
Write-Host "Checking if local-dev service account exists..." -ForegroundColor Yellow
$saExists = gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT 2>$null
if (-not $saExists) {
    Write-Host "Service account doesn't exist. Running Terraform..." -ForegroundColor Yellow
    Push-Location $TERRAFORM_DIR
    try {
        terraform init -upgrade
        terraform apply -auto-approve
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Terraform apply failed" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Service account exists: $SA_EMAIL" -ForegroundColor Green
}

# Grant current user permission to impersonate the service account
Write-Host ""
Write-Host "Granting impersonation permission to $account..." -ForegroundColor Yellow
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL `
    --member="user:$account" `
    --role="roles/iam.serviceAccountTokenCreator" `
    --project=$PROJECT 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not grant impersonation permission. You may need to do this manually." -ForegroundColor Yellow
} else {
    Write-Host "Impersonation permission granted." -ForegroundColor Green
}

# Setup ADC with impersonation
Write-Host ""
Write-Host "Setting up Application Default Credentials with impersonation..." -ForegroundColor Yellow
gcloud auth application-default login --impersonate-service-account=$SA_EMAIL

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to setup ADC with impersonation" -ForegroundColor Red
    exit 1
}
Write-Host "ADC configured with service account impersonation." -ForegroundColor Green

# Update .env file if needed
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Yellow

if (Test-Path $ENV_FILE) {
    $envContent = Get-Content $ENV_FILE -Raw

    # Remove any existing GOOGLE_APPLICATION_CREDENTIALS (not needed with impersonation)
    if ($envContent -match "GOOGLE_APPLICATION_CREDENTIALS") {
        Write-Host "Removing GOOGLE_APPLICATION_CREDENTIALS from .env (not needed with impersonation)..." -ForegroundColor Yellow
        $envContent = $envContent -replace "(?m)^.*GOOGLE_APPLICATION_CREDENTIALS.*\r?\n?", ""
        Set-Content $ENV_FILE $envContent.TrimEnd()
        # Reload after modification
        $envContent = Get-Content $ENV_FILE -Raw
    }

    # Ensure GOOGLE_CLOUD_PROJECT is set and matches the provided project
    if ($envContent -notmatch "GOOGLE_CLOUD_PROJECT") {
        Write-Host "Adding GOOGLE_CLOUD_PROJECT to .env..." -ForegroundColor Yellow
        Add-Content $ENV_FILE "`n# GCP project ID for Firestore`nGOOGLE_CLOUD_PROJECT=$PROJECT"
    } else {
        $projectMatch = [regex]::Match($envContent, "(?m)^GOOGLE_CLOUD_PROJECT=(.+)$")
        if ($projectMatch.Success) {
            $currentProject = $projectMatch.Groups[1].Value.Trim()
            if ($currentProject -ne $PROJECT) {
                Write-Host "Updating GOOGLE_CLOUD_PROJECT in .env from '$currentProject' to '$PROJECT'..." -ForegroundColor Yellow
                $envContent = [regex]::Replace($envContent, "(?m)^GOOGLE_CLOUD_PROJECT=.*$", "GOOGLE_CLOUD_PROJECT=$PROJECT")
                Set-Content $ENV_FILE $envContent.TrimEnd()
            }
        }
    }
    Write-Host ".env is configured." -ForegroundColor Green
} else {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
# GCP project ID for Firestore
GOOGLE_CLOUD_PROJECT=$PROJECT

# Recipe scraping Cloud Function URL
SCRAPE_FUNCTION_URL=https://scrape-recipe-vt7bvshx5q-ew.a.run.app

# Skip Firebase authentication for local development
SKIP_AUTH=true
"@ | Set-Content $ENV_FILE
    Write-Host "Created .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the API:" -ForegroundColor Green
Write-Host "  uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
Write-Host ""
Write-Host "Note: ADC uses service account impersonation - no key files on disk!" -ForegroundColor Cyan
Write-Host "To refresh credentials, re-run this script or:" -ForegroundColor Yellow
Write-Host "  gcloud auth application-default login --impersonate-service-account=$SA_EMAIL"
