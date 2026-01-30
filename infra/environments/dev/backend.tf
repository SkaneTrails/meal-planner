# Backend configuration for Terraform state
#
# This file uses the same GCS bucket as skane-trails-checker but with a different prefix.
# Both apps share the same GCP project.
#
# NOTE: The bucket name below is a placeholder. Replace with your actual bucket name.
# You can reuse an existing state bucket or create a new one.

terraform {
  backend "gcs" {
    # Replace with your actual bucket name
    # If sharing a bucket with other projects, use a unique prefix
    bucket = "YOUR_TFSTATE_BUCKET_NAME"
    prefix = "meal-planner/terraform/state"
  }
}
