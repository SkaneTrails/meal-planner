variable "project" {
  description = "GCP project ID for the Meal Planner application"
  type        = string
}

variable "location" {
  description = "GCS bucket location (regional or multi-regional)"
  type        = string
}
