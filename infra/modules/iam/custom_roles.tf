# Custom IAM Roles for Meal Planner
#
# Two roles:
# 1. Infrastructure Manager - Create and manage all infrastructure (Firestore, Secret Manager, etc.)
# 2. App User - Runtime access to read/write data and invoke services

# Infrastructure Manager Role
# Grants permissions needed to create and manage infrastructure via Terraform
resource "google_project_iam_custom_role" "infrastructure_manager" {
  role_id     = "mealPlannerInfraManager"
  title       = "Meal Planner Infrastructure Manager"
  description = "Permissions to create and manage Firestore, Secret Manager, and related infrastructure. Used by developers during setup and CI/CD pipelines."

  permissions = [
    # Firestore/Datastore permissions
    "datastore.databases.create",
    "datastore.databases.delete",
    "datastore.databases.get",
    "datastore.databases.list",
    "datastore.databases.update",
    "datastore.indexes.create",
    "datastore.indexes.delete",
    "datastore.indexes.get",
    "datastore.indexes.list",
    "datastore.indexes.update",

    # Secret Manager permissions
    "secretmanager.secrets.create",
    "secretmanager.secrets.delete",
    "secretmanager.secrets.get",
    "secretmanager.secrets.list",
    "secretmanager.secrets.update",
    "secretmanager.versions.add",
    "secretmanager.versions.destroy",
    "secretmanager.versions.disable",
    "secretmanager.versions.enable",
    "secretmanager.versions.get",
    "secretmanager.versions.list",

    # Cloud Storage permissions (for state bucket)
    "storage.buckets.create",
    "storage.buckets.delete",
    "storage.buckets.get",
    "storage.buckets.list",
    "storage.buckets.update",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
    "storage.objects.list",

    # Cloud Run permissions (API deployment)
    "run.services.create",
    "run.services.delete",
    "run.services.get",
    "run.services.list",
    "run.services.update",

    # Cloud Functions permissions (recipe scraping)
    "cloudfunctions.functions.create",
    "cloudfunctions.functions.delete",
    "cloudfunctions.functions.get",
    "cloudfunctions.functions.list",
    "cloudfunctions.functions.update",

    # Artifact Registry permissions
    "artifactregistry.repositories.create",
    "artifactregistry.repositories.delete",
    "artifactregistry.repositories.get",
    "artifactregistry.repositories.list",

    # IAM permissions (to manage user access)
    "iam.roles.get",
    "iam.roles.list",
    "resourcemanager.projects.get",

    # Service management
    "serviceusage.services.enable",
    "serviceusage.services.get",
    "serviceusage.services.list",
  ]

  project = var.project

  # Must wait for prerequisite roles to be granted
  depends_on = [google_project_iam_binding.prerequisite_roles]
}

# App User Role
# Grants permissions needed to run the apps and access data
resource "google_project_iam_custom_role" "app_user" {
  role_id     = "mealPlannerAppUser"
  title       = "Meal Planner App User"
  description = "Runtime permissions to read/write Firestore data, access secrets, and invoke Cloud Run/Functions. Used by app users during normal operation."

  permissions = [
    # Firestore data access
    "datastore.entities.create",
    "datastore.entities.delete",
    "datastore.entities.get",
    "datastore.entities.list",
    "datastore.entities.update",
    "datastore.databases.get",
    "datastore.indexes.get",
    "datastore.indexes.list",

    # Secret Manager read access
    "secretmanager.secrets.get",
    "secretmanager.secrets.list",
    "secretmanager.versions.access",
    "secretmanager.versions.get",
    "secretmanager.versions.list",

    # Cloud Run invoke (for API)
    "run.services.get",
    "run.routes.invoke",

    # Cloud Functions invoke (for recipe scraping)
    "cloudfunctions.functions.get",
    "cloudfunctions.functions.invoke",
  ]

  project = var.project

  # Must wait for prerequisite roles to be granted
  depends_on = [google_project_iam_binding.prerequisite_roles]
}
