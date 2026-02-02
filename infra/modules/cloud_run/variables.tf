variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "meal-planner-api"
}

variable "service_account_name" {
  description = "Service account ID for Cloud Run"
  type        = string
  default     = "meal-planner-api"
}

variable "image_url" {
  description = "Container image URL (e.g., region-docker.pkg.dev/project/repo/image:tag)"
  type        = string
}

variable "firestore_database" {
  description = "Firestore database name"
  type        = string
  default     = "meal-planner"
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = ""
}

# Free tier optimized defaults
variable "cpu" {
  description = "CPU allocation (e.g., '1' for 1 vCPU)"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory allocation (e.g., '512Mi')"
  type        = string
  default     = "512Mi"
}

variable "max_instances" {
  description = "Maximum number of instances (1 for free tier)"
  type        = number
  default     = 1
}

variable "concurrency" {
  description = "Maximum concurrent requests per instance"
  type        = number
  default     = 80
}

variable "request_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 60
}

variable "run_api_service" {
  description = "Cloud Run API service resource (for dependency)"
  type        = any
}

variable "allow_public_access" {
  description = "Allow unauthenticated access (allUsers). Only enable after auth middleware is wired."
  type        = bool
  default     = false
}

# Gemini API configuration
variable "gemini_secret_id" {
  description = "Secret Manager secret ID for Gemini API key"
  type        = string
  default     = ""
}

variable "gemini_secret_name" {
  description = "Full resource name of the Gemini API key secret (e.g., projects/PROJECT/secrets/SECRET)"
  type        = string
  default     = ""
}

variable "enable_recipe_enhancement" {
  description = "Enable recipe enhancement feature (requires gemini_secret_name)"
  type        = bool
  default     = false
}

variable "scrape_function_url" {
  description = "URL of the recipe scraping Cloud Function"
  type        = string
  default     = ""
}
