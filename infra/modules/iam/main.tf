# IAM Module - Grant permissions to users
#
# This module assigns custom IAM roles to users for accessing the Meal Planner project.
# All personal user emails should be defined in environments/dev/access/users.txt
#
# Custom roles defined in custom_roles.tf:
# 1. Infrastructure Manager - Create/manage infrastructure (can be revoked after setup)
# 2. App User - Runtime data access (permanent)

# Project-level IAM bindings for users
locals {
  # Transform user list into member format
  user_members = [for email in var.users : "user:${email}"]

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
# Grant prerequisite roles needed to create custom roles
resource "google_project_iam_binding" "prerequisite_roles" {
  for_each = length(var.users) > 0 ? toset(local.prerequisite_roles) : toset([])

  project = var.project
  role    = each.value
  members = local.user_members

  depends_on = [var.iam_api_service]
}

# Grant each role to all users
resource "google_project_iam_binding" "user_access" {
  for_each = length(var.users) > 0 ? toset(local.user_roles) : toset([])

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
