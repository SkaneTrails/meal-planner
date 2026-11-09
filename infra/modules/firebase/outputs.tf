output "web_app_id" {
  description = "The Firebase Web App ID"
  value       = google_firebase_web_app.mobile.app_id
}

output "android_app_id" {
  description = "The Firebase Android App ID (registers the Play signing fingerprints for Google Sign-In)"
  value       = google_firebase_android_app.mobile.app_id
}

output "google_sign_in_enabled" {
  description = "Whether Google Sign-In is configured"
  value       = var.oauth_secrets_exist
}

output "hosting_url" {
  description = "Firebase Hosting URL"
  value       = "https://${var.project}.web.app"
}
