output "firestore_service" {
  description = "Firestore API service resource"
  value       = google_project_service.firestore
}

output "secretmanager_service" {
  description = "Secret Manager API service resource"
  value       = google_project_service.secretmanager
}

output "iam_service" {
  description = "IAM API service resource"
  value       = google_project_service.iam
}

output "cloudfunctions_service" {
  description = "Cloud Functions API service resource"
  value       = google_project_service.cloudfunctions
}

output "cloudbuild_service" {
  description = "Cloud Build API service resource"
  value       = google_project_service.cloudbuild
}

output "run_service" {
  description = "Cloud Run API service resource"
  value       = google_project_service.run
}

output "artifactregistry_service" {
  description = "Artifact Registry API service resource"
  value       = google_project_service.artifactregistry
}

output "firebase_service" {
  description = "Firebase API service resource"
  value       = google_project_service.firebase
}

output "identitytoolkit_service" {
  description = "Identity Toolkit (Firebase Auth) API service resource"
  value       = google_project_service.identitytoolkit
}

output "iamcredentials_service" {
  description = "IAM Credentials API service resource (for Workload Identity Federation)"
  value       = google_project_service.iamcredentials
}

output "storage_service" {
  description = "Cloud Storage API service resource"
  value       = google_project_service.storage
}
