output "database" {
  description = "The Firestore database resource"
  value       = google_firestore_database.meal_planner
}

output "database_name" {
  description = "The Firestore database name"
  value       = google_firestore_database.meal_planner.name
}
