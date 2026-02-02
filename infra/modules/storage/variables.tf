# Storage module variables

variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "bucket_name" {
  description = "Name for the recipe images bucket (must be globally unique)"
  type        = string
}

variable "location" {
  description = "GCS bucket location (region or multi-region)"
  type        = string
  default     = "US" # Multi-region for better availability in free tier
}

variable "cors_origins" {
  description = "CORS allowed origins for web/mobile uploads"
  type        = list(string)
  default     = ["*"]
}

variable "storage_api_service" {
  description = "Reference to storage API service for dependency ordering"
  type        = string
  default     = null
}
