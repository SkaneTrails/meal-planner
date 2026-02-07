---
applyTo: "**/*.tf"
---

# Terraform Instructions

These conventions apply when editing `.tf` files in this project.

## Core Principles

- **All infrastructure must be declared in Terraform** - no manual resource creation via console or CLI
- **`gcloud` and `gsutil` commands** are only for troubleshooting, never for creating or modifying infrastructure
- **Free tier compliance** - All resources must stay within GCP free tier limits

## Naming Conventions

- **Resource names** (buckets, databases, service accounts) must be defined in `terraform.tfvars` or `variables.tf`, never hardcoded in resource blocks
- Environment-specific values go in `infra/environments/{dev,prod}/terraform.tfvars`
- Shared module variables go in `infra/modules/*/variables.tf` with sensible defaults

## Project Structure

```
infra/
├── environments/
│   └── dev/             # Development environment
│       ├── main.tf      # Root module (calls modules)
│       ├── variables.tf # Input variables
│       ├── versions.tf  # Provider versions
│       ├── backend.tf   # GCS state backend
│       └── access/      # User emails (gitignored)
└── modules/
    ├── apis/            # Enable GCP APIs
    ├── iam/             # Custom roles and permissions
    └── firestore/       # Database and indexes
```

## Common Patterns

### Adding a New Resource

1. Add variable in `variables.tf` with description and default
2. Add value in `terraform.tfvars` (if environment-specific)
3. Reference via `var.resource_name` in resource blocks

### Adding a New Module

1. Create directory under `infra/modules/<name>/`
2. Add `main.tf`, `variables.tf`, `outputs.tf`
3. Call from environment's `main.tf`
