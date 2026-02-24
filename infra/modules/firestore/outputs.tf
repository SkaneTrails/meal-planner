output "database" {
  description = "The Firestore database resource"
  value       = google_firestore_database.meal_planner
}

output "database_name" {
  description = "The Firestore database name"
  value       = google_firestore_database.meal_planner.name
}

output "database_names" {
  description = "List of all Firestore database names managed by this module"
  value       = [google_firestore_database.meal_planner.name]
}
