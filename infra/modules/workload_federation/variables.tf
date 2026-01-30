variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "github_repository_owner" {
  description = "GitHub repository owner (organization or user)"
  type        = string
}

variable "github_repository" {
  description = "Full GitHub repository path (owner/repo)"
  type        = string
}

variable "service_account_id" {
  description = "Service account ID to allow WIF impersonation (format: projects/{project}/serviceAccounts/{email})"
  type        = string
}
