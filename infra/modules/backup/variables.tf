variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "backup_bucket_name" {
  description = "Name for the Cloud Storage bucket to store Firestore backups"
  type        = string
}

variable "backup_bucket_location" {
  description = "Location for the backup bucket (e.g., EU for multi-region Europe)"
  type        = string
  default     = "EU"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups before auto-deletion (free tier: keep under 5GB)"
  type        = number
  default     = 30
}

variable "firestore_database_names" {
  description = "List of Firestore database names to backup (pass from firestore module output)"
  type        = list(string)
}

variable "function_region" {
  description = "Region for Cloud Functions (must support gen2 functions)"
  type        = string
  default     = "europe-west1"
}

variable "scheduler_region" {
  description = "Region for Cloud Scheduler"
  type        = string
  default     = "europe-west1"
}

variable "backup_schedule" {
  description = "Cron schedule for backups (default: nightly at 3 AM UTC)"
  type        = string
  default     = "0 3 * * *"
}

# API service dependencies
variable "storage_api_service" {
  description = "Cloud Storage API service resource for depends_on (from apis module)"
  type        = any
}

variable "cloudfunctions_api_service" {
  description = "Cloud Functions API service resource for depends_on (from apis module)"
  type        = any
}

variable "cloudbuild_api_service" {
  description = "Cloud Build API service resource for depends_on (from apis module)"
  type        = any
}

variable "cloudscheduler_api_service" {
  description = "Cloud Scheduler API service resource for depends_on (from apis module)"
  type        = any
}

variable "run_api_service" {
  description = "Cloud Run API service resource for depends_on (from apis module)"
  type        = any
}
