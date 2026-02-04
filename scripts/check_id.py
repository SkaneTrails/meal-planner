"""Check if same ID exists in both databases."""

from google.cloud import firestore

PROJECT_ID = "REDACTED_PROJECT_ID"
default_db = firestore.Client(project=PROJECT_ID)
mp_db = firestore.Client(project=PROJECT_ID, database="meal-planner")

# Count enhanced in each database
default_enhanced = 0
default_not_enhanced = 0
mp_enhanced = 0
mp_not_enhanced = 0

for doc in default_db.collection("recipes").stream():
    d = doc.to_dict()
    if d.get("enhanced") or d.get("improved"):
        default_enhanced += 1
    else:
        default_not_enhanced += 1

for doc in mp_db.collection("recipes").stream():
    d = doc.to_dict()
    if d.get("enhanced") or d.get("improved"):
        mp_enhanced += 1
    else:
        mp_not_enhanced += 1

print("=== Enhanced counts ===")
print(f"(default): {default_enhanced} enhanced, {default_not_enhanced} not enhanced")
print(f"meal-planner: {mp_enhanced} enhanced, {mp_not_enhanced} not enhanced")
