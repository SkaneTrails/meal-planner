# Artifact Registry for storing container images
#
# This module creates an Artifact Registry repository for Docker images
# used by Cloud Run deployments.

resource "google_artifact_registry_repository" "api" {
  project       = var.project
  location      = var.region
  repository_id = var.repository_name
  description   = "Container images for Meal Planner API"
  format        = "DOCKER"

  # Clean up old images to stay within free tier
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 days
    }
  }

  depends_on = [var.artifactregistry_api_service]
}
