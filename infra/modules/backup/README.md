# Firestore Backup Module

Automated scheduled backups of Firestore database to Cloud Storage.

## Free Tier Compliance

This module is designed to stay within GCP free tier limits:

| Service             | Free Tier            | This Module                    |
| ------------------- | -------------------- | ------------------------------ |
| **Cloud Scheduler** | 3 jobs/month         | 1 job                          |
| **Cloud Functions** | 2M invocations/month | ~30/month (nightly)            |
| **Cloud Storage**   | 5 GB                 | ~30 MB (with 30-day retention) |
| **Cloud Build**     | 120 min/day          | ~1 min (initial deploy only)   |

## Architecture

```
Cloud Scheduler (weekly cron)
        │
        ▼
Cloud Functions (Python 3.12)
        │
        ▼
Firestore Admin API (export)
        │
        ▼
Cloud Storage Bucket (backups)
```

## How It Works

1. **Cloud Scheduler** triggers the Cloud Function nightly (3 AM UTC by default)
2. **Cloud Function** calls the Firestore Admin API to export the database
3. **Firestore** exports all collections to the Cloud Storage bucket
4. **Lifecycle policy** auto-deletes backups older than 30 days to stay within free tier

## Resources Created

- `google_storage_bucket.firestore_backups` - Backup storage bucket
- `google_service_account.backup_function` - Service account for the function
- `google_cloudfunctions2_function.firestore_backup` - Gen2 Cloud Function
- `google_cloud_scheduler_job.weekly_backup` - Weekly trigger
- IAM bindings for export permissions

## Backup Format

Firestore exports create a folder structure in Cloud Storage:

```
gs://BUCKET_NAME/
  └── YYYY-MM-DD-HHMMSS/
      ├── all_namespaces/
      │   └── kind_*/
      │       └── output-*
      └── all_namespaces_kind_*.export_metadata
```

## Restoring from Backup

To restore from a backup, use `gcloud`:

```bash
# List available backups
gsutil ls gs://YOUR_BUCKET_NAME/

# Restore from a specific backup (DESTRUCTIVE - overwrites existing data)
gcloud firestore import gs://YOUR_BUCKET_NAME/BACKUP_FOLDER_NAME
```

**Warning**: Importing overwrites existing documents with the same IDs.

## Manual Backup Trigger

To trigger a backup manually:

```bash
# Using gcloud
gcloud functions call firestore-backup --region=europe-west1

# Or trigger the scheduler job immediately
gcloud scheduler jobs run firestore-weekly-backup --location=europe-west1
```

## Variables

| Name                       | Description            | Default                   |
| -------------------------- | ---------------------- | ------------------------- |
| `project`                  | GCP project ID         | (required)                |
| `backup_bucket_name`       | Backup bucket name     | (required)                |
| `backup_bucket_location`   | Bucket location        | `EU`                      |
| `backup_retention_days`    | Days to keep backups   | `30`                      |
| `firestore_database_names` | Databases to backup    | (required)                |
| `function_region`          | Cloud Functions region | `europe-west1`            |
| `scheduler_region`         | Cloud Scheduler region | `europe-west1`            |
| `backup_schedule`          | Cron schedule          | `0 3 * * *` (nightly 3AM) |

## Required APIs

The following APIs must be enabled (handled by the `apis` module):

- `storage.googleapis.com` - Cloud Storage
- `cloudfunctions.googleapis.com` - Cloud Functions
- `cloudbuild.googleapis.com` - Cloud Build (for function deployments)
- `cloudscheduler.googleapis.com` - Cloud Scheduler
- `run.googleapis.com` - Cloud Run (gen2 functions run on Cloud Run)
