# Terraform Bootstrap

This directory contains the initial Terraform configuration to bootstrap the infrastructure setup for Meal Planner.

## Purpose

Creates the GCS bucket for storing Terraform remote state. This is a one-time setup per environment.

## Prerequisites

1. **GCP Project**: Create a GCP project (free tier)

1. **gcloud CLI**: Installed and authenticated (`gcloud auth application-default login`)

1. **Terraform**: Version >= 1.12

1. **Permissions**: The following IAM roles are required to run this bootstrap:
   - **Storage Admin** (`roles/storage.admin`) - Create and manage GCS buckets
   - **Storage Object Admin** (`roles/storage.objectAdmin`) - Manage bucket objects and versioning
   - Alternatively, **Project Editor** (`roles/editor`) or **Project Owner** (`roles/owner`) includes these permissions

   These permissions are needed to:
   - Create the GCS bucket for Terraform state
   - Enable versioning on the bucket
   - Configure bucket lifecycle policies
   - Set IAM policies on the bucket

## Setup Steps

### 1. Configure Variables

Copy the example tfvars file and update with your project ID:

```bash
cd infra/environments/dev/init
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and replace `your-project-id-here` with your actual GCP project ID.

### 2. Initialize and Apply Bootstrap

```bash
terraform init
terraform plan
terraform apply
```

This will:

- Create a GCS bucket with a random ID for Terraform state (e.g., `a1b2c3d4e5f6g7h8-bucket-tfstate`)
- Generate `backend.tf` in the parent directory (`infra/environments/dev/`)
- Create import scripts for the state bucket

### 3. Import State Bucket

Move to the parent directory and import the bucket:

```bash
cd ..  # Now in infra/environments/dev/

# On Windows (PowerShell)
.\import_tfstate_bucket.ps1

# On Linux/macOS
./import_tfstate_bucket.sh
```

### 4. Migrate to Remote State

Initialize Terraform with the new GCS backend:

```bash
terraform init
```

Terraform will ask if you want to copy the existing state to the new backend. Answer `yes`.

### 5. Verify

Check that remote state is working:

```bash
terraform state list
```

You should see the `google_storage_bucket.tfstate` resource.

## What Gets Created

- **GCS Bucket**: `{random-id}-bucket-tfstate`
  - Location: EU (multi-regional)
  - Versioning: Enabled
  - Public access: Prevented
  - Lifecycle: Prevent destroy

## Generated Files

After running `terraform apply`, the following files are created in the parent directory:

- `backend.tf` - Terraform backend configuration
- `import_tfstate_bucket.sh` - Import script for Linux/macOS
- `import_tfstate_bucket.ps1` - Import script for Windows

## Cost

**This setup stays within GCP free tier:**

- GCS storage: First 5 GB free/month
- GCS operations: 5,000 Class A, 50,000 Class B operations free/month
- Terraform state files are typically < 1 MB

## Security Notes

- `terraform.tfvars` is gitignored (contains project-specific values)
- State bucket has prevent_destroy lifecycle to avoid accidental deletion
- Public access is enforced as prevented
- Versioning is enabled for state recovery

## Troubleshooting

### "Error: project does not exist"

Ensure you've created the GCP project and set the correct project ID in `terraform.tfvars`.

### "Error: insufficient permissions"

Your GCP account needs Project Owner or Editor role. Check with:

```bash
gcloud projects get-iam-policy YOUR-PROJECT-ID
```

### "Error: backend initialization required"

Run `terraform init` first to download provider plugins.

## Next Steps

After bootstrap is complete, you can proceed to set up the main infrastructure:

1. Enable required GCP APIs
1. Firestore database for recipes and meal plans
1. Secret Manager for API keys
1. Cloud Functions for recipe scraping
