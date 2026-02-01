# Fetch secrets from Google Cloud Secret Manager and create .env file
#
# Usage:
#   .\scripts\setup-env.ps1
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - Access to the hikes-482104 project secrets

param(
    [string]$ProjectId = "hikes-482104"
)

$ErrorActionPreference = "Stop"

Write-Host "🔐 Fetching secrets from Google Cloud Secret Manager..." -ForegroundColor Cyan

# Function to fetch a secret
function Get-Secret {
    param([string]$SecretName)
    try {
        $value = gcloud secrets versions access latest --secret=$SecretName --project=$ProjectId 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️  Secret '$SecretName' not found, skipping" -ForegroundColor Yellow
            return $null
        }
        return $value
    } catch {
        Write-Host "  ⚠️  Failed to fetch '$SecretName': $_" -ForegroundColor Yellow
        return $null
    }
}

# Fetch all secrets
$secrets = @{
    "EXPO_PUBLIC_API_URL" = Get-Secret "github_EXPO_PUBLIC_API_URL"
    "EXPO_PUBLIC_FIREBASE_API_KEY" = Get-Secret "github_EXPO_PUBLIC_FIREBASE_API_KEY"
    "EXPO_PUBLIC_FIREBASE_APP_ID" = Get-Secret "github_EXPO_PUBLIC_FIREBASE_APP_ID"
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = Get-Secret "github_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" = Get-Secret "meal-planner_oauth_client_id"
}

# Derived values (not in Secret Manager)
$firebaseProjectId = "hikes-482104"

Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Cyan

$envContent = @"
# API endpoint (use localhost for local backend, or Cloud Run URL for production)
# To use local backend, change to: http://localhost:8000
EXPO_PUBLIC_API_URL=$($secrets["EXPO_PUBLIC_API_URL"] ?? "http://localhost:8000")

# Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=$($secrets["EXPO_PUBLIC_FIREBASE_API_KEY"])
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseProjectId}.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${firebaseProjectId}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseProjectId}.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($secrets["EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"])
EXPO_PUBLIC_FIREBASE_APP_ID=$($secrets["EXPO_PUBLIC_FIREBASE_APP_ID"])

# Google OAuth Client IDs (for Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$($secrets["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"])
"@

$envPath = Join-Path $PSScriptRoot ".." ".env"
$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ Created .env file at: $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: API URL is set to production. For local development, edit .env:" -ForegroundColor Yellow
Write-Host "   EXPO_PUBLIC_API_URL=http://localhost:8000"
