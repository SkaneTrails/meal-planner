# Enable required GCP APIs for the Meal Planner application
# This module should be called first before any other modules

resource "google_project_service" "firestore" {
  project = var.project
  service = "firestore.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  project = var.project
  service = "secretmanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "cloudresourcemanager" {
  project = var.project
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  project = var.project
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

# Cloud Functions for recipe scraping
resource "google_project_service" "cloudfunctions" {
  project = var.project
  service = "cloudfunctions.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild" {
  project = var.project
  service = "cloudbuild.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "run" {
  project = var.project
  service = "run.googleapis.com"

  disable_on_destroy = false
}

# Artifact Registry for container images (Cloud Run deployments)
resource "google_project_service" "artifactregistry" {
  project = var.project
  service = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

# Firebase APIs for authentication
resource "google_project_service" "firebase" {
  project = var.project
  service = "firebase.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "identitytoolkit" {
  project = var.project
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

# IAM Credentials API for Workload Identity Federation
resource "google_project_service" "iamcredentials" {
  project = var.project
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false
}

# Cloud Storage API for recipe images
resource "google_project_service" "storage" {
  project = var.project
  service = "storage.googleapis.com"

  disable_on_destroy = false
}
