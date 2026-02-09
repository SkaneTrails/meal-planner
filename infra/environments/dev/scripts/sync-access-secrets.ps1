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

param(
    [string]$Repo
)

$ErrorActionPreference = "Stop"
$accessDir = Join-Path $PSScriptRoot ".." "access"

# Detect repo from git remote if not provided
if (-not $Repo) {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl -match '[:/]([^/]+/[^/.]+?)(\.git)?$') {
        $Repo = $Matches[1]
    } else {
        Write-Host "Error: Could not detect repository. Pass -Repo owner/name" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Syncing access files to GitHub Secrets" -ForegroundColor Cyan
Write-Host "Repository: $Repo" -ForegroundColor Gray
Write-Host ""

# Verify gh CLI is authenticated
try {
    gh auth status 2>&1 | Out-Null
} catch {
    Write-Host "Error: gh CLI not authenticated. Run 'gh auth login' first." -ForegroundColor Red
    exit 1
}

# Helper: read file, strip comments and blank lines, return as single string
function Get-CleanContent {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) {
        Write-Host "  File not found: $FilePath" -ForegroundColor Yellow
        return ""
    }

    $lines = Get-Content $FilePath |
        Where-Object { $_.Trim() -ne "" -and -not $_.TrimStart().StartsWith("#") } |
        ForEach-Object { $_.Trim() }

    return ($lines -join "`n")
}

# Sync each access file
$files = @(
    @{ name = "superusers.txt"; secret = "TF_SUPERUSERS" },
    @{ name = "users.txt";      secret = "TF_USERS" }
)

$synced = 0
foreach ($file in $files) {
    $path = Join-Path $accessDir $file.name
    $content = Get-CleanContent -FilePath $path

    if ($content -eq "") {
        Write-Host "  Skipping $($file.name) (empty or not found)" -ForegroundColor Yellow
        continue
    }

    $emails = ($content -split "`n").Count
    Write-Host "  $($file.name): $emails email(s)" -ForegroundColor Gray

    # Write to temp file to avoid PowerShell escaping issues with gh
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmpFile -Value $content -NoNewline
        gh secret set $file.secret --repo $Repo --body (Get-Content $tmpFile -Raw)
        Write-Host "  Stored as $($file.secret)" -ForegroundColor Green
        $synced++
    } finally {
        Remove-Item $tmpFile -ErrorAction SilentlyContinue
    }
}

# Also sync tfvars (non-sensitive Terraform variables)
$tfvarsPath = Join-Path $PSScriptRoot ".." "terraform.tfvars"
if (Test-Path $tfvarsPath) {
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Copy-Item $tfvarsPath $tmpFile
        gh secret set TF_VARS_FILE --repo $Repo --body (Get-Content $tmpFile -Raw)
        Write-Host "  terraform.tfvars stored as TF_VARS_FILE" -ForegroundColor Green
        $synced++
    } finally {
        Remove-Item $tmpFile -ErrorAction SilentlyContinue
    }

    # Extract region and set as a separate secret for Docker/deploy steps
    $regionLine = Get-Content $tfvarsPath | Where-Object {
        $_.Trim() -ne "" -and
        -not $_.TrimStart().StartsWith("#") -and
        $_ -match '^\s*region\s*='
    } | Select-Object -First 1

    if ($regionLine -and $regionLine -match '"([^"]+)"') {
        $region = $Matches[1]
        gh secret set GCP_REGION --repo $Repo --body $region
        Write-Host "  Region '$region' stored as GCP_REGION" -ForegroundColor Green
        $synced++
    } else {
        Write-Host "  Warning: Could not extract region from terraform.tfvars" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Skipping terraform.tfvars (not found)" -ForegroundColor Yellow
}

# Also sync backend config (bucket + prefix for terraform init -backend-config)
$backendPath = Join-Path $PSScriptRoot ".." "backend.tf"
if (Test-Path $backendPath) {
    $backendContent = Get-Content $backendPath -Raw

    if ($backendContent -match 'backend\s+"gcs"\s*\{[^}]*bucket\s*=\s*"([^"]+)"') {
        $bucket = $Matches[1]
        gh secret set TF_BACKEND_BUCKET --repo $Repo --body $bucket
        Write-Host "  Backend bucket '$bucket' stored as TF_BACKEND_BUCKET" -ForegroundColor Green
        $synced++
    } else {
        Write-Host "  Warning: Could not extract bucket from backend.tf" -ForegroundColor Yellow
    }

    if ($backendContent -match 'backend\s+"gcs"\s*\{[^}]*prefix\s*=\s*"([^"]+)"') {
        $prefix = $Matches[1]
        gh secret set TF_BACKEND_PREFIX --repo $Repo --body $prefix
        Write-Host "  Backend prefix '$prefix' stored as TF_BACKEND_PREFIX" -ForegroundColor Green
        $synced++
    } else {
        Write-Host "  Warning: Could not extract prefix from backend.tf" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Skipping backend.tf (not found)" -ForegroundColor Yellow
}

Write-Host ""
if ($synced -gt 0) {
    Write-Host "Synced $synced secret(s) to GitHub" -ForegroundColor Green
} else {
    Write-Host "No files synced. Create access files first:" -ForegroundColor Yellow
    Write-Host "  mkdir -p access" -ForegroundColor White
    Write-Host "  echo 'your-email@example.com' > access/superusers.txt" -ForegroundColor White
}
Write-Host ""
Write-Host "These secrets are used by the terraform-deploy workflow in CI/CD." -ForegroundColor Gray
