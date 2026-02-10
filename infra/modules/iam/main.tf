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

# Grant Secret Manager access to Firebase service account (for fetching secrets in workflow)
resource "google_project_iam_member" "github_actions_firebase_secretmanager" {
  project = var.project
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.github_actions_firebase.email}"

  depends_on = [google_service_account.github_actions_firebase]
}

# -----------------------------------------------------------------------------
# GitHub Actions Terraform Service Account
# -----------------------------------------------------------------------------

# Service account for GitHub Actions to run terraform apply
resource "google_service_account" "github_actions_terraform" {
  project      = var.project
  account_id   = "github-actions-terraform"
  display_name = "GitHub Actions Terraform Deploy"
  description  = "Service account for GitHub Actions to run terraform plan/apply"

  depends_on = [var.iam_api_service]
}

# Editor role covers most resource CRUD (Cloud Run, Functions, Storage, Firestore, APIs, etc.)
resource "google_project_iam_member" "github_actions_terraform_editor" {
  project = var.project
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_actions_terraform.email}"

  depends_on = [google_service_account.github_actions_terraform]
}

# NOTE: roles/iam.roleAdmin and roles/resourcemanager.projectIamAdmin for the
# terraform SA are granted via the prerequisite_roles binding above (which uses
# iam_binding). Do NOT add separate iam_member resources for those roles — mixing
# iam_binding (authoritative) with iam_member (additive) on the same role causes
# them to fight, stripping the SA's permissions on every apply.

# Remove old iam_member resources from state without destroying them in GCP.
# The prerequisite_roles binding now manages these roles for the terraform SA.
removed {
  from = google_project_iam_member.github_actions_terraform_iam_admin
  lifecycle { destroy = false }
}

removed {
  from = google_project_iam_member.github_actions_terraform_project_iam
  lifecycle { destroy = false }
}

# Service Account Admin to create/manage other service accounts
resource "google_project_iam_member" "github_actions_terraform_sa_admin" {
  project = var.project
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.github_actions_terraform.email}"

  depends_on = [google_service_account.github_actions_terraform]
}

# Secret Manager Admin to create/manage secrets
resource "google_project_iam_member" "github_actions_terraform_secrets" {
  project = var.project
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.github_actions_terraform.email}"

  depends_on = [google_service_account.github_actions_terraform]
}

# Firebase Admin to manage Firebase resources (auth, hosting)
resource "google_project_iam_member" "github_actions_terraform_firebase" {
  project = var.project
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.github_actions_terraform.email}"

  depends_on = [google_service_account.github_actions_terraform]
}

# IAM Workload Identity Pool Admin to manage WIF pools/providers
resource "google_project_iam_member" "github_actions_terraform_wif" {
  project = var.project
  role    = "roles/iam.workloadIdentityPoolAdmin"
  member  = "serviceAccount:${google_service_account.github_actions_terraform.email}"

  depends_on = [google_service_account.github_actions_terraform]
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
# Uses iam_binding (authoritative) — must include ALL members for these roles,
# including the terraform SA. Mixing iam_binding + iam_member on the same role
# causes them to fight (binding strips members that only iam_member knows about).
resource "google_project_iam_binding" "prerequisite_roles" {
  for_each = toset(local.prerequisite_roles)

  project = var.project
  role    = each.value
  members = concat(local.user_members, [
    "serviceAccount:${google_service_account.github_actions_terraform.email}",
  ])

  depends_on = [
    var.iam_api_service,
    google_service_account.github_actions_terraform,
  ]
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
