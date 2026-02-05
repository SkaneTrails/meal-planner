# IAM Module - Grant permissions to users
#
# This module assigns custom IAM roles to users for accessing the Meal Planner project.
# User emails come from environments/dev/access/users.txt and superusers.txt
#
# Custom roles defined in custom_roles.tf:
# 1. Infrastructure Manager - Create/manage infrastructure (can be revoked after setup)
# 2. App User - Runtime data access (permanent)

# Project-level IAM bindings for users
locals {
  # Combine users and superusers, removing duplicates
  all_users = distinct(concat(var.users, var.superusers))

  # Transform user list into member format
  user_members = [for email in local.all_users : "user:${email}"]

  # Built-in roles needed to create custom roles
  # These must be granted BEFORE custom roles can be created
  prerequisite_roles = [
    "roles/iam.roleAdmin",                   # Required to create custom IAM roles
    "roles/resourcemanager.projectIamAdmin", # Required to grant IAM bindings
  ]

  # Custom roles to grant to all users
  # NOTE: Infrastructure Manager role should be revoked after initial setup
  user_roles = [
    "projects/${var.project}/roles/mealPlannerInfraManager", # Temporary: Create/manage infrastructure
    "projects/${var.project}/roles/mealPlannerAppUser",      # Permanent: Runtime data access
    "roles/viewer",                                          # Read-only access to all resources
  ]
}

# -----------------------------------------------------------------------------
# GitHub Actions Service Accounts
# -----------------------------------------------------------------------------

# Service account for GitHub Actions to deploy to Firebase Hosting
resource "google_service_account" "github_actions_firebase" {
  project      = var.project
  account_id   = "github-actions-firebase"
  display_name = "GitHub Actions Firebase Deploy"
  description  = "Service account for GitHub Actions to deploy web app to Firebase Hosting"

  depends_on = [var.iam_api_service]
}

# Grant Firebase Hosting Admin role to the service account
resource "google_project_iam_member" "github_actions_firebase_hosting" {
  project = var.project
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.github_actions_firebase.email}"

  depends_on = [google_service_account.github_actions_firebase]
}

# Service account for GitHub Actions to deploy to Cloud Run
resource "google_service_account" "github_actions_cloudrun" {
  project      = var.project
  account_id   = "github-actions-cloudrun"
  display_name = "GitHub Actions Cloud Run Deploy"
  description  = "Service account for GitHub Actions to deploy API to Cloud Run"

  depends_on = [var.iam_api_service]
}

# Grant Cloud Run Admin role to deploy services
resource "google_project_iam_member" "github_actions_cloudrun_admin" {
  project = var.project
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions_cloudrun.email}"

  depends_on = [google_service_account.github_actions_cloudrun]
}

# Grant Artifact Registry Writer role to push images
resource "google_project_iam_member" "github_actions_cloudrun_artifact_registry" {
  project = var.project
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions_cloudrun.email}"

  depends_on = [google_service_account.github_actions_cloudrun]
}

# Grant Service Account User role (required to deploy Cloud Run with custom SA)
resource "google_project_iam_member" "github_actions_cloudrun_sa_user" {
  project = var.project
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_actions_cloudrun.email}"

  depends_on = [google_service_account.github_actions_cloudrun]
}

# Grant Secret Manager access to Firebase service account (for fetching secrets in workflow)
resource "google_project_iam_member" "github_actions_firebase_secretmanager" {
  project = var.project
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.github_actions_firebase.email}"

  depends_on = [google_service_account.github_actions_firebase]
}

# -----------------------------------------------------------------------------
# Local Development Service Account
# -----------------------------------------------------------------------------

# Service account for local development (avoids ADC OAuth client issues)
resource "google_service_account" "local_dev" {
  project      = var.project
  account_id   = "local-dev"
  display_name = "Local Development"
  description  = "Service account for local development, used via impersonation (no key download needed)"

  depends_on = [var.iam_api_service]
}

# Grant Firestore access to local dev service account
resource "google_project_iam_member" "local_dev_firestore" {
  project = var.project
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.local_dev.email}"

  depends_on = [google_service_account.local_dev]
}

# Grant Storage access to local dev service account (for recipe images)
resource "google_project_iam_member" "local_dev_storage" {
  project = var.project
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.local_dev.email}"

  depends_on = [google_service_account.local_dev]
}

# Grant Secret Manager access to local dev service account (for fetching secrets)
resource "google_project_iam_member" "local_dev_secrets" {
  project = var.project
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.local_dev.email}"

  depends_on = [google_service_account.local_dev]
}

# Grant prerequisite roles needed to create custom roles
resource "google_project_iam_binding" "prerequisite_roles" {
  for_each = length(local.all_users) > 0 ? toset(local.prerequisite_roles) : toset([])

  project = var.project
  role    = each.value
  members = local.user_members

  depends_on = [var.iam_api_service]
}

# Grant each role to all users (including superusers)
resource "google_project_iam_binding" "user_access" {
  for_each = length(local.all_users) > 0 ? toset(local.user_roles) : toset([])

  project = var.project
  role    = each.value
  members = local.user_members

  # Explicit dependencies: ensure IAM API is enabled and custom roles exist
  depends_on = [
    var.iam_api_service,
    google_project_iam_custom_role.infrastructure_manager,
    google_project_iam_custom_role.app_user,
  ]
}
