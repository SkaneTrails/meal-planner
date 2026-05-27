# Workload Identity Federation for GitHub Actions
#
# Enables keyless authentication from GitHub Actions to GCP.
# This is more secure than using service account keys.

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "Workload Identity Pool for GitHub Actions CI/CD"
  disabled                  = false
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"
  description                        = "OIDC identity provider for GitHub Actions"
  disabled                           = false

  # Only allow tokens from our repo owner + explicitly listed external repos
  attribute_condition = length(var.external_repo_bindings) == 0 ? (
    "assertion.repository_owner == '${var.github_repository_owner}'"
    ) : (
    join(" || ", concat(
      ["assertion.repository_owner == '${var.github_repository_owner}'"],
      [for key, binding in var.external_repo_bindings : "assertion.repository == '${binding.repository}'"]
    ))
  )

  attribute_mapping = {
    "google.subject"                  = "assertion.sub"
    "attribute.actor"                 = "assertion.actor"
    "attribute.repository"            = "assertion.repository"
    "attribute.repository_owner"      = "assertion.repository_owner"
    "attribute.repository_visibility" = "assertion.repository_visibility"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions service accounts to be impersonated via WIF
resource "google_service_account_iam_member" "workload_identity_user" {
  for_each = var.service_account_ids

  service_account_id = each.value
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

# Allow external repositories to impersonate their assigned service accounts via WIF
resource "google_service_account_iam_member" "external_repo_wif" {
  for_each = var.external_repo_bindings

  service_account_id = each.value.service_account_id
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${each.value.repository}"
}
