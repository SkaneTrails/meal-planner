variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "users" {
  description = "List of user email addresses to grant access to"
  type        = list(string)
  default     = []
}

variable "superusers" {
  description = "List of superuser email addresses (also get IAM access)"
  type        = list(string)
  default     = []
}

variable "iam_api_service" {
  description = "IAM API service resource (for dependency ordering)"
  type        = any
}

variable "play_publisher_account_id" {
  description = "Account ID of the service account EAS Submit uses to publish to Google Play"
  type        = string
  default     = "mp-play-publisher"
}
