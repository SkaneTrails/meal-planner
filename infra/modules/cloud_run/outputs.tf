output "service_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.uri
}

output "service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.name
}

output "service_account_email" {
  description = "The service account email used by Cloud Run"
  value       = google_service_account.api.email
}
