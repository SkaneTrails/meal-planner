variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "gemini_secret_id" {
  description = "Secret Manager secret ID for Gemini API key"
  type        = string
  default     = "gemini-api-key"
}

variable "secretmanager_api_service" {
  description = "Secret Manager API service (for dependency ordering)"
  type        = any
}
