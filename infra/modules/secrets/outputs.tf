output "gemini_api_key_secret_id" {
  description = "Secret Manager secret ID for Gemini API key"
  value       = google_secret_manager_secret.gemini_api_key.secret_id
}

output "gemini_api_key_secret_name" {
  description = "Full resource name of the Gemini API key secret"
  value       = google_secret_manager_secret.gemini_api_key.name
}
