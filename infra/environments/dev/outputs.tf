# Outputs for the development environment

output "artifact_registry_url" {
  description = "The Artifact Registry URL for pushing container images"
  value       = module.artifact_registry.repository_url
}

output "firestore_database" {
  description = "The Firestore database name"
  value       = module.firestore.database_name
}

output "cloud_run_url" {
  description = "The Cloud Run service URL"
  value       = module.cloud_run.service_url
}

output "google_sign_in_enabled" {
  description = "Whether Google Sign-In is configured (OAuth credentials provided)"
  value       = module.firebase.google_sign_in_enabled
}

output "hosting_url" {
  description = "Firebase Hosting URL for the web app"
  value       = module.firebase.hosting_url
}

# GitHub Actions configuration
output "github_actions_workload_identity_provider" {
  description = "Workload Identity Provider path for GitHub Actions auth"
  value       = module.workload_federation.workload_identity_provider
}

output "github_actions_service_account" {
  description = "Service account email for GitHub Actions Firebase deployment"
  value       = module.iam.github_actions_firebase_email
}
