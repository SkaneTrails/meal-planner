#
# If pre-commit fails in the GitHub Action after updating a version, try running terraform init
# from a Google Cloud console and push the lockfile. This usually resolves the problem.
#
terraform {
  required_version = ">= 1.12"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.18.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.8.0"
    }

    local = {
      source  = "hashicorp/local"
      version = "~> 2.6.0"
    }
  }
}
