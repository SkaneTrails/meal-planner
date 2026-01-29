# Meal Planner Infrastructure - Development Environment
#
# Backend configuration is in backend.tf
# Version requirements in versions.tf
#
# Setup:
# 1. Copy terraform.tfvars.example to terraform.tfvars and fill in values
# 2. Create access/users.txt with user emails (one per line)
# 3. Run: terraform init && terraform apply

provider "google" {
  project = var.project
  region  = var.region
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
