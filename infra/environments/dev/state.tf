# The tfstate bucket - managed here to prevent accidental deletion
resource "google_storage_bucket" "tfstate" {
  name     = var.tfstate_bucket_name
  location = "EU"
  project  = var.project

  force_destroy               = false
  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
