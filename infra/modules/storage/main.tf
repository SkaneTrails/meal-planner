# Google Cloud Storage bucket for recipe images
#
# This bucket stores user-uploaded recipe images with public read access.
# Images are organized by recipe ID: recipes/{recipe_id}/{uuid}.{ext}

resource "google_storage_bucket" "recipe_images" {
  name          = var.bucket_name
  location      = var.location
  storage_class = "STANDARD"
  project       = var.project

  # Free tier: First 5 GB storage free per month
  # Keep costs low with lifecycle rules

  # Uniform bucket-level access (recommended for public buckets)
  uniform_bucket_level_access = true

  # Enable object versioning for accidental deletion protection
  versioning {
    enabled = false # Disable for cost savings in dev
  }

  # CORS configuration for web/mobile uploads
  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "OPTIONS"]
    response_header = ["Content-Type", "Content-Length", "Content-MD5"]
    max_age_seconds = 3600
  }

  # Lifecycle rule to delete old versions (if versioning enabled later)
  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [var.storage_api_service]
}

# Make the bucket publicly readable
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.recipe_images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
