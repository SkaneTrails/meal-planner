output "iam_bindings_complete" {
  description = "Marker output to ensure IAM bindings are complete before dependent resources"
  value       = google_project_iam_binding.user_access
}

output "infrastructure_manager_role" {
  description = "The infrastructure manager custom role"
  value       = google_project_iam_custom_role.infrastructure_manager
}

output "app_user_role" {
  description = "The app user custom role"
  value       = google_project_iam_custom_role.app_user
}
output "github_actions_firebase_service_account" {
  description = "Service account for GitHub Actions Firebase Hosting deployment"
  value       = google_service_account.github_actions_firebase
}

output "github_actions_firebase_email" {
  description = "Email of the GitHub Actions Firebase service account"
  value       = google_service_account.github_actions_firebase.email
}
