# Storage module outputs

output "bucket_name" {
  description = "The name of the recipe images bucket"
  value       = google_storage_bucket.recipe_images.name
}

output "bucket_url" {
  description = "The URL of the bucket"
  value       = google_storage_bucket.recipe_images.url
}

output "public_url_prefix" {
  description = "The public URL prefix for accessing objects"
  value       = "https://storage.googleapis.com/${google_storage_bucket.recipe_images.name}"
}
