output "function_url" {
  description = "The HTTPS trigger URL for the Cloud Function"
  value       = google_cloudfunctions2_function.scrape_recipe.service_config[0].uri
}

output "function_name" {
  description = "The name of the Cloud Function"
  value       = google_cloudfunctions2_function.scrape_recipe.name
}

output "service_account_email" {
  description = "The service account email used by the function"
  value       = google_service_account.function.email
}
