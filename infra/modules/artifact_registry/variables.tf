variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the repository"
  type        = string
}

variable "repository_name" {
  description = "Name of the Artifact Registry repository"
  type        = string
  default     = "meal-planner"
}

variable "artifactregistry_api_service" {
  description = "Artifact Registry API service resource (for dependency)"
  type        = any
}
