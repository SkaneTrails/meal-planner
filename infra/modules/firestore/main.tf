# Firestore database for Meal Planner
# Single database: meal-planner (recipes, meal plans, grocery lists)
#
# Free tier: 1 GB storage, 50K reads/day, 20K writes/day

# Recipes database
resource "google_firestore_database" "meal_planner" {
  project     = var.project
  name        = var.database_name
  location_id = var.location_id
  type        = "FIRESTORE_NATIVE"

  # Free tier compatible settings
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"

  # Prevent accidental deletion of production data
  deletion_policy = "DELETE"

  depends_on = [var.firestore_api_service, var.iam_bindings_complete]
}

# Secret Manager secrets for local debugging and configuration
resource "google_secret_manager_secret" "database_name" {
  project   = var.project
  secret_id = "meal-planner-database-name"

  replication {
    auto {}
  }

  depends_on = [var.secretmanager_api_service]
}

resource "google_secret_manager_secret" "project_id" {
  project   = var.project
  secret_id = "meal-planner-project-id"

  replication {
    auto {}
  }

  depends_on = [var.secretmanager_api_service]
}

# Secret versions with actual values
resource "google_secret_manager_secret_version" "database_name" {
  secret      = google_secret_manager_secret.database_name.id
  secret_data = google_firestore_database.meal_planner.name
}

resource "google_secret_manager_secret_version" "project_id" {
  secret      = google_secret_manager_secret.project_id.id
  secret_data = var.project
}

# Firestore indexes for efficient querying

# Recipes collection - query by cuisine, category, tags
resource "google_firestore_index" "recipes_by_cuisine" {
  project    = var.project
  database   = google_firestore_database.meal_planner.name
  collection = "recipes"

  fields {
    field_path = "cuisine"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "recipes_by_category" {
  project    = var.project
  database   = google_firestore_database.meal_planner.name
  collection = "recipes"

  fields {
    field_path = "category"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "recipes_by_diet_label" {
  project    = var.project
  database   = google_firestore_database.meal_planner.name
  collection = "recipes"

  fields {
    field_path = "diet_label"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}

# Meal plans collection - query by week
resource "google_firestore_index" "meal_plans_by_week" {
  project    = var.project
  database   = google_firestore_database.meal_planner.name
  collection = "meal_plans"

  fields {
    field_path = "week_start"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }
}
