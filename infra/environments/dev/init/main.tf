resource "random_id" "default" {
  byte_length = 8
}

resource "google_storage_bucket" "backend" {
  name     = "${random_id.default.hex}-bucket-tfstate"
  location = var.location
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

resource "local_file" "backend" {
  file_permission = "0644"
  filename        = "${path.module}/../backend.tf"

  content = <<-EOT
  resource "google_storage_bucket" "tfstate" {
    name     = "${google_storage_bucket.backend.name}"
    location = "${var.location}"
    project  = "${var.project}"

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

  variable "tfstate_bucket" {
    type = string
    default = "${google_storage_bucket.backend.name}"
  }

  terraform {
    backend "gcs" {
      bucket = "${google_storage_bucket.backend.name}"
      prefix = "meal-planner/terraform/state"
    }
  }

  data "terraform_remote_state" "default" {
    backend = "gcs"
    config = {
      bucket = var.tfstate_bucket
      prefix = "meal-planner/terraform/state"
    }
  }
  EOT
}

resource "local_file" "import_script_bash" {
  filename        = "${path.module}/../import_tfstate_bucket.sh"
  file_permission = "0755"

  content = <<-EOT
    #!/bin/bash
    echo "Importing tfstate bucket into main Terraform project..."
    terraform import google_storage_bucket.tfstate ${google_storage_bucket.backend.name}
  EOT
}

resource "local_file" "import_script_powershell" {
  filename        = "${path.module}/../import_tfstate_bucket.ps1"
  file_permission = "0644"

  content = <<-EOT
    Write-Host "Importing tfstate bucket into main Terraform project..."
    terraform import google_storage_bucket.tfstate "${google_storage_bucket.backend.name}"
  EOT
}
