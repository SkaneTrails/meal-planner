variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
}

variable "firestore_location" {
  description = "Firestore location ID (e.g., eur3 for multi-region Europe)"
  type        = string
}

variable "firestore_database_name" {
  description = "Firestore database name for enhanced recipes"
  type        = string
  default     = "meal-planner"
}
