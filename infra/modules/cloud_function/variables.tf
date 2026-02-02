variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Function"
  type        = string
}

variable "function_name" {
  description = "Name of the Cloud Function"
  type        = string
  default     = "scrape-recipe"
}

variable "service_account_name" {
  description = "Service account ID for Cloud Function"
  type        = string
  default     = "scrape-recipe-function"
}

variable "source_dir" {
  description = "Path to the function source directory"
  type        = string
}

variable "runtime" {
  description = "Python runtime version"
  type        = string
  default     = "python312"
}

variable "entry_point" {
  description = "Function entry point"
  type        = string
  default     = "scrape_recipe_handler"
}

# Free tier optimized defaults
variable "memory" {
  description = "Memory allocation (e.g., '256M')"
  type        = string
  default     = "256M"
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 1
}

variable "timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Environment variables for the function"
  type        = map(string)
  default     = {}
}

variable "allow_public_access" {
  description = "Allow unauthenticated access (allUsers)"
  type        = bool
  default     = true
}

# API dependencies
variable "cloudfunctions_api_service" {
  description = "Cloud Functions API service resource (for dependency)"
  type        = any
}

variable "cloudbuild_api_service" {
  description = "Cloud Build API service resource (for dependency)"
  type        = any
}

variable "run_api_service" {
  description = "Cloud Run API service resource (for dependency)"
  type        = any
}
