variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "database_name" {
  description = "Firestore database name for enhanced recipes"
  type        = string
  default     = "meal-planner"
}

variable "location_id" {
  description = "Firestore location ID (e.g., eur3 for multi-region Europe)"
  type        = string
}

variable "firestore_api_service" {
  description = "Firestore API service resource (for dependency ordering)"
  type        = any
}

variable "secretmanager_api_service" {
  description = "Secret Manager API service resource (for dependency ordering)"
  type        = any
}

variable "iam_bindings_complete" {
  description = "IAM bindings marker (for dependency ordering)"
  type        = any
}
