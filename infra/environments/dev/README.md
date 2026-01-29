# Meal Planner Infrastructure - Development Environment

This directory contains the Terraform configuration for deploying the Meal Planner infrastructure to GCP.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) >= 1.12
2. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (gcloud CLI)
3. GCP project with billing enabled
4. User with Owner or Editor role (for initial setup)

## Setup

### 1. Authenticate with GCP

```bash
gcloud auth application-default login
```

### 2. Configure Variables

```bash
# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
# - project: Your GCP project ID
# - region: GCP region (e.g., europe-west1)
# - firestore_location: Firestore location (e.g., eur3)
```

### 3. Configure Backend (State Storage)

Edit `backend.tf` and replace `YOUR_TFSTATE_BUCKET_NAME` with your GCS bucket name.

If you don't have a state bucket, create one:

```bash
gsutil mb -l EU gs://your-unique-bucket-name
gsutil versioning set on gs://your-unique-bucket-name
```

### 4. Add User Access

Create `access/users.txt` with email addresses (one per line):

```bash
mkdir -p access
echo "your-email@example.com" > access/users.txt
```

### 5. Initialize and Apply

```bash
terraform init
terraform plan
terraform apply
```

## Modules

| Module      | Purpose                           |
| ----------- | --------------------------------- |
| `apis`      | Enable required GCP APIs          |
| `iam`       | Custom roles and user permissions |
| `firestore` | Firestore database and indexes    |

## Free Tier Limits

This infrastructure stays within GCP free tier:

- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Secret Manager**: 6 active secret versions
- **Cloud Functions**: 2M invocations/month (future use)
- **Cloud Run**: 2M requests/month (future use)

## Files

| File               | Description                                |
| ------------------ | ------------------------------------------ |
| `main.tf`          | Root module, wires up all submodules       |
| `variables.tf`     | Input variable definitions                 |
| `versions.tf`      | Terraform and provider version constraints |
| `backend.tf`       | GCS backend configuration for state        |
| `terraform.tfvars` | Your local config (gitignored)             |
| `access/users.txt` | User emails for IAM (gitignored)           |
