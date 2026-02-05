# Meal Planner Infrastructure - Development Environment
#
# Backend configuration is in backend.tf
# Version requirements in versions.tf
#
# Setup:
# 1. Copy terraform.tfvars.example to terraform.tfvars and fill in values
# 2. Create access/superusers.txt with superuser emails (one per line)
# 3. Run: terraform init && terraform apply

provider "google" {
  project = var.project
  region  = var.region

  # Required for APIs that need a quota project (e.g., Identity Toolkit)
  user_project_override = true
  billing_project       = var.project
}

provider "google-beta" {
  project = var.project
  region  = var.region

  # Required for APIs that need a quota project (e.g., Identity Toolkit)
  user_project_override = true
  billing_project       = var.project
}

# Read user emails from access/users.txt (gitignored)
# Expected format: one email per line, lines starting with # are comments
locals {
  users_file_content = fileexists("${path.module}/access/users.txt") ? file("${path.module}/access/users.txt") : ""
  users_lines        = split("\n", trimspace(local.users_file_content))
  users = compact([
    for line in local.users_lines :
    trimspace(line)
    if trimspace(line) != "" && !startswith(trimspace(line), "#")
  ])

  # Read superusers from access/superusers.txt (gitignored)
  # Superusers have global access and can manage households
  superusers_file_content = fileexists("${path.module}/access/superusers.txt") ? file("${path.module}/access/superusers.txt") : ""
  superusers_lines        = split("\n", trimspace(local.superusers_file_content))
  superusers = compact([
    for line in local.superusers_lines :
    trimspace(line)
    if trimspace(line) != "" && !startswith(trimspace(line), "#")
  ])
}

# Enable required APIs first
module "apis" {
  source = "../../modules/apis"

  project = var.project
}

# IAM module - Grant permissions to users and service accounts
module "iam" {
  source = "../../modules/iam"

  project = var.project
  users   = local.users

  # Implicit dependency on APIs module through output reference
  iam_api_service = module.apis.iam_service
}

# Firestore database - Store recipes, meal plans, grocery lists
module "firestore" {
  source = "../../modules/firestore"

  project       = var.project
  database_name = var.firestore_database_name
  location_id   = var.firestore_location

  # Implicit dependencies through API service references
  firestore_api_service     = module.apis.firestore_service
  secretmanager_api_service = module.apis.secretmanager_service

  # Ensure IAM permissions are in place before creating Firestore resources
  iam_bindings_complete = module.iam.iam_bindings_complete
}

# Secrets - External API keys (Gemini, etc.)
module "secrets" {
  source = "../../modules/secrets"

  project = var.project

  secretmanager_api_service = module.apis.secretmanager_service
}

# Artifact Registry - Store container images for Cloud Run
module "artifact_registry" {
  source = "../../modules/artifact_registry"

  project         = var.project
  region          = var.region
  repository_name = "meal-planner"

  artifactregistry_api_service = module.apis.artifactregistry_service
}

# Firebase - Authentication for mobile app
module "firebase" {
  source = "../../modules/firebase"

  project            = var.project
  firestore_database = var.firestore_database_name

  # Add Cloud Run URL after first deployment
  authorized_domains = var.firebase_authorized_domains

  # Superusers with global app access (from access/superusers.txt)
  superusers = local.superusers

  # OAuth credentials are read from Secret Manager
  # Set to true after running: ./scripts/create-oauth-client.ps1
  oauth_secrets_exist = var.oauth_secrets_exist

  # API URL for GitHub Actions secrets (stored in Secret Manager)
  api_url = module.cloud_run.service_url

  # GitHub Actions SA for per-secret IAM bindings (least privilege)
  github_actions_sa_email = module.iam.github_actions_firebase_email

  firebase_api_service        = module.apis.firebase_service
  identitytoolkit_api_service = module.apis.identitytoolkit_service
  secretmanager_api_service   = module.apis.secretmanager_service
  firestore_ready             = module.firestore.database
}

# Cloud Run - API service (only deployed after image is pushed)
# Uncomment after first image push to Artifact Registry

module "cloud_run" {
  source = "../../modules/cloud_run"

  project            = var.project
  region             = var.region
  service_name       = "meal-planner-api"
  image_url          = "${module.artifact_registry.repository_url}/api:latest"
  firestore_database = var.firestore_database_name
  allowed_origins    = var.cloud_run_allowed_origins
  gcs_bucket_name    = module.storage.bucket_name

  # Allow public access - Firebase Auth is validated in application code
  allow_public_access = true

  # Recipe enhancement with Gemini
  enable_recipe_enhancement = var.enable_recipe_enhancement
  gemini_secret_id          = module.secrets.gemini_api_key_secret_id
  gemini_secret_name        = module.secrets.gemini_api_key_secret_name

  # Scrape function URL
  scrape_function_url = module.cloud_function.function_url

  run_api_service = module.apis.run_service
}

# Cloud Storage - Recipe images
module "storage" {
  source = "../../modules/storage"

  project     = var.project
  bucket_name = var.recipe_images_bucket_name
  location    = var.region # Keep in same region as other resources

  # Allow CORS from any origin (mobile and web apps)
  cors_origins = ["*"]

  storage_api_service = module.apis.storage_service
}

# Cloud Function - Recipe scraping
module "cloud_function" {
  source = "../../modules/cloud_function"

  project      = var.project
  region       = var.region
  source_dir   = "${path.root}/../../../functions/scrape_recipe"

  # Allow public access - the function handles its own validation
  allow_public_access = true

  cloudfunctions_api_service = module.apis.cloudfunctions_service
  cloudbuild_api_service     = module.apis.cloudbuild_service
  run_api_service            = module.apis.run_service
}

# Workload Identity Federation - Keyless auth from GitHub Actions
module "workload_federation" {
  source = "../../modules/workload_federation"

  project                 = var.project
  github_repository_owner = var.github_repository_owner
  github_repository       = var.github_repository
  service_account_ids = {
    firebase = module.iam.github_actions_firebase_service_account.id
    cloudrun = module.iam.github_actions_cloudrun_service_account.id
  }
}
