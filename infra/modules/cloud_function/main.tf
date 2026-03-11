# Cloud Function for Recipe Scraping
#
# Deploys a Python Cloud Function that:
# - Scrapes recipes from URLs using recipe-scrapers library
# - Returns JSON with title, ingredients, instructions, etc.
# - Runs in isolation for fault tolerance and scaling

# Storage bucket for function source code
resource "google_storage_bucket" "function_source" {
  project  = var.project
  name     = "${var.project}-function-source"
  location = var.region

  # Free tier friendly - delete old versions
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  uniform_bucket_level_access = true
}

# Service account for the Cloud Function
resource "google_service_account" "function" {
  project      = var.project
  account_id   = var.service_account_name
  display_name = "Recipe Scraper Cloud Function"
  description  = "Service account for recipe scraping Cloud Function"
}

# Archive the function source code (excludes virtualenv and cache)
data "archive_file" "function_source" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/scrape_recipe.zip"
  excludes    = [".venv", "__pycache__", "*.pyc"]
}

# Upload source to GCS
resource "google_storage_bucket_object" "function_source" {
  name   = "scrape_recipe-${data.archive_file.function_source.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.function_source.output_path
}

# Cloud Function (2nd gen - uses Cloud Run under the hood)
resource "google_cloudfunctions2_function" "scrape_recipe" {
  project  = var.project
  name     = var.function_name
  location = var.region

  description = "Scrapes recipes from URLs using recipe-scrapers library"

  build_config {
    runtime     = var.runtime
    entry_point = var.entry_point

    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.function_source.name
      }
    }
  }

  service_config {
    # Free tier optimized
    min_instance_count = 0
    max_instance_count = var.max_instances
    available_memory   = var.memory
    timeout_seconds    = var.timeout

    # Use dedicated service account
    service_account_email = google_service_account.function.email

    # Environment variables
    environment_variables = var.environment_variables
  }

  depends_on = [
    var.cloudfunctions_api_service,
    var.cloudbuild_api_service,
    var.run_api_service,
  ]
}

# Allow public access (the function validates requests internally)
resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_public_access ? 1 : 0

  project  = var.project
  location = var.region
  name     = google_cloudfunctions2_function.scrape_recipe.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
