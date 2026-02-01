variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "gemini_secret_id" {
  description = "Secret Manager secret ID for Gemini API key"
  type        = string
  default     = "gemini-api-key"
}

variable "gemini_api_key_exists" {
  description = "Whether the Gemini API key secret version exists (set to true after adding the key)"
  type        = bool
  default     = false
}

variable "secretmanager_api_service" {
  description = "Secret Manager API service (for dependency ordering)"
  type        = any
}
