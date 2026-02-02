# Secrets Module - Manage API keys and sensitive configuration
#
# This module creates Secret Manager secrets for external API keys.
# Secret values are added manually after creation using:
#   gcloud secrets versions add SECRET_NAME --data-file=-
#
# Usage:
#   After terraform apply, add the Gemini API key:
#   echo -n "your-api-key" | gcloud secrets versions add gemini-api-key --data-file=-

# Gemini API Key - Used for recipe enhancement
resource "google_secret_manager_secret" "gemini_api_key" {
  project   = var.project
  secret_id = var.gemini_secret_id

  replication {
    auto {}
  }

  labels = {
    purpose = "gemini-api"
    app     = "meal-planner"
  }

  depends_on = [var.secretmanager_api_service]
}

# Note: IAM binding for Cloud Run service account is in the cloud_run module
# to avoid circular dependencies (cloud_run creates the SA, needs the secret name)
