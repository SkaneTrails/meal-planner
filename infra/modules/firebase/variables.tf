variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "firestore_database" {
  description = "Firestore database name"
  type        = string
  default     = "(default)"
}

variable "authorized_domains" {
  description = "Additional authorized domains for OAuth redirects (e.g., Cloud Run URLs)"
  type        = list(string)
  default     = []
}

variable "firebase_api_service" {
  description = "Firebase API service resource (for dependency)"
  type        = any
}

variable "identitytoolkit_api_service" {
  description = "Identity Toolkit API service resource (for dependency)"
  type        = any
}

variable "secretmanager_api_service" {
  description = "Secret Manager API service resource (for dependency)"
  type        = any
}

variable "firestore_ready" {
  description = "Firestore readiness signal (for dependency)"
  type        = any
}

variable "superusers" {
  description = "List of superuser email addresses with global app access"
  type        = list(string)
  default     = []
}

# OAuth secrets - created by scripts/create-oauth-client.sh
# Set to true after running the script
variable "oauth_secrets_exist" {
  description = "Whether OAuth secrets exist in Secret Manager (set to true after running create-oauth-client script)"
  type        = bool
  default     = false
}

variable "api_url" {
  description = "Cloud Run API URL (without trailing /api)"
  type        = string
  default     = ""
}

variable "github_actions_sa_email" {
  description = "GitHub Actions service account email for per-secret IAM bindings"
  type        = string
  default     = ""
}
