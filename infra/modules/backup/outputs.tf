output "backup_bucket_name" {
  description = "Name of the Cloud Storage bucket storing Firestore backups"
  value       = google_storage_bucket.firestore_backups.name
}

output "backup_bucket_url" {
  description = "URL of the backup bucket"
  value       = google_storage_bucket.firestore_backups.url
}

output "backup_function_url" {
  description = "URL of the backup Cloud Function"
  value       = google_cloudfunctions2_function.firestore_backup.url
}

output "backup_function_name" {
  description = "Name of the backup Cloud Function"
  value       = google_cloudfunctions2_function.firestore_backup.name
}

output "scheduler_job_name" {
  description = "Name of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.nightly_backup.name
}

output "backup_service_account_email" {
  description = "Email of the backup service account"
  value       = google_service_account.backup_function.email
}
