# Cloud Run Service for Meal Planner API
#
# Deploys the FastAPI application with:
# - Scale to zero (free tier friendly)
# - Firebase Auth (validated in application code)
# - Firestore access via service account

# Service account for Cloud Run
resource "google_service_account" "api" {
  project      = var.project
  account_id   = var.service_account_name
  display_name = "Meal Planner API Service Account"
  description  = "Service account for Cloud Run API with Firestore access"
}

# Grant Firestore access to the service account
resource "google_project_iam_member" "firestore_user" {
  project = var.project
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Firebase Auth access (to verify tokens)
resource "google_project_iam_member" "firebase_auth" {
  project = var.project
  role    = "roles/firebaseauth.viewer"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Secret Manager access for Gemini API key
resource "google_secret_manager_secret_iam_member" "gemini_api_key" {
  count = var.gemini_secret_id != "" ? 1 : 0

  project   = var.project
  secret_id = var.gemini_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "api" {
  project  = var.project
  name     = var.service_name
  location = var.region

  # Allow unauthenticated access - Firebase Auth is validated in code
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    # Use the dedicated service account
    service_account = google_service_account.api.email

    # Scale to zero for free tier
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image_url

      # Resource limits for free tier
      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = true # Allow CPU to be throttled when idle
      }

      # Environment variables
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project
      }

      env {
        name  = "FIRESTORE_DATABASE"
        value = var.firestore_database
      }

      dynamic "env" {
        for_each = var.allowed_origins != "" ? [1] : []
        content {
          name  = "ALLOWED_ORIGINS"
          value = var.allowed_origins
        }
      }

      # Recipe enhancement feature flag
      dynamic "env" {
        for_each = var.enable_recipe_enhancement ? [1] : []
        content {
          name  = "ENABLE_RECIPE_ENHANCEMENT"
          value = "true"
        }
      }

      # Gemini API key from Secret Manager
      dynamic "env" {
        for_each = var.gemini_secret_name != "" ? [1] : []
        content {
          name = "GOOGLE_API_KEY"
          value_source {
            secret_key_ref {
              secret  = var.gemini_secret_name
              version = "latest"
            }
          }
        }
      }

      # Health check
      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 0
        period_seconds        = 10
        timeout_seconds       = 3
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds    = 30
        timeout_seconds   = 3
        failure_threshold = 3
      }
    }

    # Request timeout
    timeout = "${var.request_timeout}s"

    # Concurrency per instance
    max_instance_request_concurrency = var.concurrency
  }

  # Traffic routing
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    var.run_api_service,
    google_project_iam_member.firestore_user,
    google_project_iam_member.firebase_auth,
  ]
}

# Allow unauthenticated access (Firebase Auth is handled in application code)
# Only enabled when allow_public_access = true (after auth middleware is wired)
resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_public_access ? 1 : 0

  project  = var.project
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
