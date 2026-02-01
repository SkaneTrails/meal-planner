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

variable "firebase_authorized_domains" {
  description = "Additional authorized domains for Firebase OAuth (e.g., Cloud Run URLs)"
  type        = list(string)
  default     = []
}

variable "cloud_run_allowed_origins" {
  description = "Comma-separated list of allowed CORS origins for Cloud Run API"
  type        = string
  default     = ""
}

# OAuth secrets - created by scripts/create-oauth-client.ps1 or .sh
# Set to true after running the script
variable "oauth_secrets_exist" {
  description = "Whether OAuth secrets exist in Secret Manager (set to true after running create-oauth-client script)"
  type        = bool
  default     = false
}

# Recipe enhancement with Gemini AI
# Add API key: echo -n "YOUR_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
variable "enable_recipe_enhancement" {
  description = "Enable recipe enhancement feature (requires Gemini API key in Secret Manager)"
  type        = bool
  default     = false
}

# GitHub repository info for Workload Identity Federation
variable "github_repository_owner" {
  description = "GitHub repository owner (organization or user)"
  type        = string
  default     = "SkaneTrails"
}

variable "github_repository" {
  description = "Full GitHub repository path (owner/repo)"
  type        = string
  default     = "SkaneTrails/meal-planner"
}
