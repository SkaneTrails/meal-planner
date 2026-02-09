# Meal Planner Infrastructure - Development Environment

Terraform configuration for deploying the Meal Planner infrastructure to GCP.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) >= 1.12
2. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (gcloud CLI)
3. [Docker](https://docs.docker.com/get-docker/) (for building the API image)
4. GCP project with billing enabled (free tier is sufficient)
5. User with **Owner** role on the project (for initial setup)

## Bootstrap (New Project)

Follow these phases in order for a brand new GCP project.

### Phase 1: Authenticate

```bash
gcloud auth login
gcloud auth application-default login
```

### Phase 2: State Bucket

Terraform needs a GCS bucket to store its state remotely. The `init/` directory
solves this chicken-and-egg problem.

```bash
cd infra/environments/dev/init

# Configure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set your project ID

# Create the state bucket
terraform init
terraform apply

# Import the bucket into the main project
cd ..
./import_tfstate_bucket.ps1   # Windows
# ./import_tfstate_bucket.sh  # Linux/macOS

# Initialize with GCS backend (answer "yes" to migrate state)
terraform init
```

See [init/README.md](../infra/environments/dev/init/README.md) for detailed instructions.

### Phase 3: Access Files

Create the gitignored access files. **Superusers get both GCP IAM access AND
app-level superuser access** (Terraform writes Firestore `superusers` documents).
This is how the first admin bootstraps the app — they can then create households
and invite members through the UI.

```bash
mkdir -p access

# Your email (must match your gcloud auth login)
# This grants: GCP IAM roles + Firestore superuser document (app access)
echo "your-email@example.com" > access/superusers.txt

# Additional developers who need GCP Console/CLI access only (optional)
echo "teammate@example.com" > access/users.txt
```

| File                    | GCP IAM roles | App superuser (Firestore) |
| ----------------------- | :-----------: | :-----------------------: |
| `access/superusers.txt` |      ✅       |            ✅             |
| `access/users.txt`      |      ✅       |            ❌             |

### Phase 4: Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` (see `terraform.tfvars.example` for all options):

```hcl
project                   = "your-gcp-project-id"
region                    = "europe-west1"
firestore_location        = "eur3"                          # Multi-region Europe
firestore_database_name   = "meal-planner"
recipe_images_bucket_name = "your-project-recipe-images"    # Must be globally unique
```

### Phase 5: First Apply (Infrastructure)

```bash
terraform plan    # Review what will be created
terraform apply   # Create everything
```

This creates all GCP resources: APIs, IAM roles, Firestore database + indexes,
Artifact Registry, Cloud Storage bucket, Secret Manager, Firebase Auth,
Workload Identity Federation for GitHub Actions, Cloud Run service (placeholder),
and Cloud Function for recipe scraping.

> **Expected:** Cloud Run will use a placeholder image since no Docker image has
> been pushed yet. That's normal — it gets a real image in Phase 6.

### Phase 5b: Gemini API Key (Optional)

AI recipe enhancement requires a Google Gemini API key. This is free:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and create an API key
2. Add it to the Secret Manager secret that Terraform created:

```bash
echo -n "your-api-key" | gcloud secrets versions add gemini-api-key --data-file=-
```

Skip this step if you don't need AI enhancement — the app works fine without it.

### Phase 6: First Docker Image

Build and push the API image so Cloud Run has something to serve:

```bash
# Authenticate Docker with Artifact Registry (use your region from terraform.tfvars)
gcloud auth configure-docker REGION-docker.pkg.dev

# Build and push (from repo root, replace REGION and PROJECT with your values)
cd ../../..
IMAGE="REGION-docker.pkg.dev/PROJECT/meal-planner/meal-planner-api:latest"
docker build -t "$IMAGE" .
docker push "$IMAGE"

# Re-apply so Cloud Run picks up the image
cd infra/environments/dev
terraform apply
```

### Phase 7: Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/) and add your GCP project
2. Enable Authentication > Sign-in method > Google
3. Run the OAuth client setup script:

```bash
# From infra/environments/dev/
./scripts/create-oauth-client.ps1   # Windows
# ./scripts/create-oauth-client.sh  # Linux/macOS
```

4. Update `terraform.tfvars`:

```hcl
oauth_secrets_exist         = true
firebase_authorized_domains = ["your-cloudrun-url.run.app"]
```

5. Apply again:

```bash
terraform apply
```

### Phase 8: GitHub Actions CI/CD

For automated deployments on push to `main`:

1. Add GitHub repository secrets:
   - `GCP_PROJECT_ID` — your project ID
   - `GCP_PROJECT_NUMBER` — from GCP Console > Project Dashboard

2. Sync access files and Terraform variables to GitHub secrets:

```bash
# From infra/environments/dev/
./scripts/sync-access-secrets.ps1   # Windows
# ./scripts/sync-access-secrets.sh  # Linux/macOS
```

The script auto-detects the repository from `git remote`. To override:

```bash
./scripts/sync-access-secrets.ps1 -Repo owner/repo   # Windows
# ./scripts/sync-access-secrets.sh owner/repo         # Linux/macOS
```

This uploads `access/superusers.txt`, `access/users.txt`, and `terraform.tfvars`
as GitHub secrets (`TF_SUPERUSERS`, `TF_USERS`, `TF_VARS_FILE`, `GCP_REGION`,
`TF_BACKEND_BUCKET`, `TF_BACKEND_PREFIX`) so the CI/CD workflow can run
`terraform apply` with the correct configuration.

**Re-run this script whenever you add or remove users from the access files.**

3. Terraform already created the necessary service accounts and Workload
   Identity Federation in Phase 5. No additional GCP setup needed.

4. Push to `main` with changes in `api/`, `functions/`, `infra/`, or `Dockerfile`
   to trigger auto-deploy via Terraform.

### Phase 9: App Access

Add your first app user:

```bash
# Your email is already in Firestore superusers (from access/superusers.txt)
# Sign in via the app → create a household → invite members
```

## Day-to-Day Operations

### Applying Changes

```bash
cd infra/environments/dev
terraform plan
terraform apply
```

### What CI/CD Handles Automatically

| Trigger                                                                  | Workflow               | What it deploys                                                                             |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| Push to `main` (changes in `api/`, `infra/`, `functions/`, `Dockerfile`) | `terraform-deploy.yml` | Docker image build + full `terraform apply` (Cloud Run, Cloud Function, indexes, IAM, etc.) |
| Push to `main` (changes in `mobile/`)                                    | `firebase-hosting.yml` | Expo web build to Firebase Hosting                                                          |

### What Requires Manual `terraform apply`

- One-time bootstrap operations (Phase 1–7)

## Modules

| Module                | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `apis`                | Enable required GCP APIs                  |
| `iam`                 | Custom roles, user permissions, CI/CD SAs |
| `firestore`           | Firestore database and composite indexes  |
| `artifact_registry`   | Docker image repository for Cloud Run     |
| `cloud_run`           | API service (FastAPI)                     |
| `cloud_function`      | Recipe scraping function                  |
| `storage`             | GCS bucket for recipe images              |
| `secrets`             | Secret Manager (Gemini API key)           |
| `firebase`            | Firebase Auth, Hosting, OAuth config      |
| `workload_federation` | Keyless GitHub Actions → GCP auth         |

## Files

| File/Directory     | Description                                |
| ------------------ | ------------------------------------------ |
| `init/`            | Bootstrap scripts for state bucket         |
| `access/`          | User emails for GCP IAM (gitignored)       |
| `scripts/`         | OAuth client + access sync scripts         |
| `main.tf`          | Root module, wires up all submodules       |
| `variables.tf`     | Input variable definitions                 |
| `versions.tf`      | Terraform and provider version constraints |
| `backend.tf`       | GCS backend config (generated by `init/`)  |
| `outputs.tf`       | Output values (URLs, resource IDs)         |
| `terraform.tfvars` | Your local config (gitignored)             |

## Phase 10: Renovate (Dependency Updates)

[Renovate](https://github.com/apps/renovate) keeps dependencies across the entire project
up to date automatically — Python packages, npm modules, GitHub Actions, pre-commit
hooks, and Docker images.

### Quick setup

1. Install the [Renovate GitHub App](https://github.com/apps/renovate) on your fork
2. Renovate reads the existing [renovate.json](../renovate.json) config and starts opening PRs
3. A **Dependency Dashboard** issue is created in your repo for an overview of all updates

### What happens automatically

- **Minor, patch, pin, and digest updates** are auto-merged (squash) after passing CI
- All updates wait a **3-day stability window** before being proposed
- PRs are rate-limited to **2/hour, 5 concurrent** to avoid noise

### What needs manual review

- **Major version bumps** — these get a PR but won't auto-merge
- **Tailwind CSS** is pinned to v3 in `mobile/` (NativeWind 4 compatibility)

### Grouping

Updates are grouped to reduce PR noise:

- Python testing tools (pytest, coverage, etc.)
- Linting tools (ruff, pre-commit, deptry)
- GitHub Actions
- Pre-commit hooks

No additional configuration is needed — the [renovate.json](../renovate.json) in this
repo has everything.

## Free Tier Limits

All resources stay within GCP free tier:

- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Cloud Run**: 2M requests/month, 360K vCPU-seconds
- **Cloud Functions**: 2M invocations/month
- **Cloud Storage**: 5 GB, 5K Class A ops/month
- **Artifact Registry**: 500 MB
- **Secret Manager**: 6 active secret versions
