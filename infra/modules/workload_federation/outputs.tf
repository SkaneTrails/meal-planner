output "workload_identity_provider" {
  description = "Full path to the Workload Identity Provider (for GitHub Actions auth)"
  value       = "projects/${var.project}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id}"
}

output "pool_name" {
  description = "Workload Identity Pool resource name"
  value       = google_iam_workload_identity_pool.github.name
}
