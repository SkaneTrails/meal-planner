# Create OAuth 2.0 Client for Firebase Auth
# This script creates an OAuth client and stores the credentials in Secret Manager
#
# Prerequisites:
# - gcloud CLI authenticated
# - Project ID set

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$DisplayName = "Meal Planner Mobile"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating OAuth 2.0 client for project: $ProjectId" -ForegroundColor Cyan

# Check if OAuth brand exists, create if not
Write-Host "Checking OAuth consent screen..." -ForegroundColor Yellow
$brand = gcloud iap oauth-brands list --project=$ProjectId --format="value(name)" 2>$null

if (-not $brand) {
    Write-Host "Creating OAuth consent screen..." -ForegroundColor Yellow
    # Get user email for support email
    $userEmail = gcloud config get-value account
    gcloud iap oauth-brands create --application_title="Meal Planner" --support_email=$userEmail --project=$ProjectId
    $brand = gcloud iap oauth-brands list --project=$ProjectId --format="value(name)"
}

Write-Host "Brand: $brand" -ForegroundColor Green

# Create OAuth client
Write-Host "Creating OAuth client..." -ForegroundColor Yellow
$clientJson = gcloud iap oauth-clients create $brand --display_name="$DisplayName" --format=json --project=$ProjectId | ConvertFrom-Json

$clientId = $clientJson.name -replace ".*/", ""
$clientSecret = $clientJson.secret

Write-Host "Client ID: $clientId" -ForegroundColor Green

# Store in Secret Manager
Write-Host "Storing credentials in Secret Manager..." -ForegroundColor Yellow

# Create secrets if they don't exist
$secrets = @(
    @{ id = "firebase-oauth-client-id"; value = $clientId },
    @{ id = "firebase-oauth-client-secret"; value = $clientSecret }
)

foreach ($secret in $secrets) {
    # Check if secret exists
    $exists = gcloud secrets describe $secret.id --project=$ProjectId 2>$null
    if (-not $exists) {
        gcloud secrets create $secret.id --project=$ProjectId --replication-policy=automatic
    }

    # Add new version
    $secret.value | gcloud secrets versions add $secret.id --project=$ProjectId --data-file=-
    Write-Host "Stored: $($secret.id)" -ForegroundColor Green
}

Write-Host ""
Write-Host "OAuth client created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "The credentials are stored in Secret Manager. Terraform will read them automatically." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: terraform apply" -ForegroundColor White
Write-Host "2. Run: terraform output -json firebase_config" -ForegroundColor White
