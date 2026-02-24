# Firestore Backup Module
# Automated scheduled exports of Firestore to Cloud Storage
# Free tier compliant: Cloud Scheduler (3 free jobs), Cloud Storage (5 GB free)
#
# Architecture:
# Cloud Scheduler -> Cloud Functions -> Firestore Export -> Cloud Storage

# Cloud Storage bucket for storing Firestore exports
resource "google_storage_bucket" "firestore_backups" {
  project  = var.project
  name     = var.backup_bucket_name
  location = var.backup_bucket_location

  # Use standard storage class (free tier eligible)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # Versioning disabled intentionally: backup bucket stores Firestore exports
  # that are already timestamped. Versioning would create duplicate data and
  # risk exceeding the 5 GB Cloud Storage free tier limit.
  versioning {
    enabled = false
  }

  # Auto-delete old backups to stay within 5 GB free tier
  lifecycle_rule {
    condition {
      age = var.backup_retention_days
    }
    action {
      type = "Delete"
    }
  }

  force_destroy = false

  depends_on = [var.storage_api_service]
}

# Service account for the backup Cloud Function
resource "google_service_account" "backup_function" {
  project      = var.project
  account_id   = "meal-planner-firestore-backup"
  display_name = "Firestore Backup Cloud Function"
  description  = "Service account for scheduled Firestore backup exports"
}

resource "google_project_iam_member" "backup_datastore_export" {
  project = var.project
  role    = "roles/datastore.importExportAdmin"
  member  = "serviceAccount:${google_service_account.backup_function.email}"
}

resource "google_storage_bucket_iam_member" "backup_bucket_writer" {
  bucket = google_storage_bucket.firestore_backups.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backup_function.email}"
}

# Zip the Cloud Function source code
data "archive_file" "backup_function_source" {
  type        = "zip"
  output_path = "${path.module}/backup_function.zip"

  source {
    content  = file("${path.module}/function/main.py")
    filename = "main.py"
  }

  source {
    content  = file("${path.module}/function/requirements.txt")
    filename = "requirements.txt"
  }
}

# Upload function source to bucket
resource "google_storage_bucket_object" "backup_function_source" {
  name   = "backup-function-source-${data.archive_file.backup_function_source.output_md5}.zip"
  bucket = google_storage_bucket.firestore_backups.name
  source = data.archive_file.backup_function_source.output_path
}

# Cloud Function to trigger Firestore export
resource "google_cloudfunctions2_function" "firestore_backup" {
  project  = var.project
  name     = "meal-planner-firestore-backup"
  location = var.function_region

  description = "Exports Firestore database to Cloud Storage on schedule"

  build_config {
    runtime     = "python312"
    entry_point = "backup_firestore"

    source {
      storage_source {
        bucket = google_storage_bucket.firestore_backups.name
        object = google_storage_bucket_object.backup_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 540 # 9 minutes (export can take time)

    environment_variables = {
      PROJECT_ID     = var.project
      DATABASE_NAMES = join(",", var.firestore_database_names)
      BUCKET_NAME    = google_storage_bucket.firestore_backups.name
    }

    service_account_email = google_service_account.backup_function.email
  }

  depends_on = [
    var.cloudfunctions_api_service,
    var.cloudbuild_api_service,
    google_project_iam_member.backup_datastore_export,
    google_storage_bucket_iam_member.backup_bucket_writer,
  ]
}

resource "google_cloud_scheduler_job" "nightly_backup" {
  project     = var.project
  name        = "firestore-nightly-backup"
  description = "Triggers nightly Firestore backup to Cloud Storage"
  region      = var.scheduler_region

  # Run nightly at 3:00 AM UTC
  schedule  = var.backup_schedule
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.firestore_backup.url

    oidc_token {
      service_account_email = google_service_account.backup_function.email
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "60s"
  }

  depends_on = [var.cloudscheduler_api_service]
}

# Grant Cloud Scheduler permission to invoke the function
resource "google_cloud_run_service_iam_member" "scheduler_invoker" {
  project  = var.project
  location = var.function_region
  service  = google_cloudfunctions2_function.firestore_backup.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.backup_function.email}"

  depends_on = [var.run_api_service]
}
