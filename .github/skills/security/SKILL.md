---
name: security
description: Security best practices, OWASP guidelines, and preventing accidental exposure of sensitive data
---

# Skill: Security

You are the security expert. **Challenge bad practices proactively** — do not assume the developer knows the risks.

---

## Activation Context

- Creating or modifying auth/authz code, API endpoints, database queries
- Handling secrets, API keys, credentials, PII
- Creating files that might contain sensitive data
- Reviewing `.gitignore`, config files, Dockerfiles
- CI/CD workflow changes

---

## Challenge Pattern

When you detect a security concern:

1. **Stop and explain** the risk with specific impact
2. **Recommend the fix** with secure alternative
3. **Block if critical** — refuse to proceed for high-severity issues

Do not silently fix security issues — the developer needs to understand why.

---

## Core Security Principles

When making security decisions, apply these frameworks:

| Principle | Application | Challenge When |
|-----------|-------------|----------------|
| **Zero Trust** | Never trust, always verify | Workflow has no `permissions:` block; Actions not SHA-pinned; assumes "internal = safe" |
| **Least Privilege** | Grant minimum needed | IAM is project-level vs resource-scoped; SA has `roles/editor` |
| **Defense in Depth** | Multiple security layers | Single control point; frontend-only validation |
| **Fail Secure** | Errors deny access | See dedicated section below |
| **Separation of Duties** | No single point of control | One person can deploy to prod without review |

---

## Project Security Status

**This is the most actionable section.** Keep it current as issues are fixed.

| Risk | Current Mitigation | Open Gaps |
|------|-------------------|-----------|
| A01: Broken Access Control | `household_id` checks on recipe endpoints | Grocery endpoint skips recipe visibility check |
| A03: Injection | Pydantic validation, Firestore parameterized queries | `update_recipe` allows arbitrary field names |
| A04: Insecure Design | Feature flags, input validation | No rate limiting; `SKIP_AUTH` has no production guard (`K_SERVICE` check needed) |
| A05: Security Misconfiguration | CORS via env var | No security headers middleware; localhost CORS in prod config |
| A06: Vulnerable Components | Renovate + Trivy + lockfile pinning | No `pip-audit` in main test pipeline |
| A09: Logging & Monitoring | Logger on auth failures | No security event audit trail |
| A10: SSRF | URL scheme + IP blocklist validation | Cloud Function CORS is `*` |
| Supply Chain | SHA-pinned actions, image digests, release quarantine | — |
| Container | Multi-stage build, pinned base images | **Runs as root** (no `USER` directive); no `.dockerignore` |
| LLM01: Prompt Injection | Structured prompts from `config/prompts/` | No input sanitization before Gemini |
| LLM06: Sensitive Info | Never send PII to Gemini | `created_by` email could leak via `model_dump()` |

For detailed OWASP Top 10 and LLM Top 10 patterns, see [references/OWASP.md](references/OWASP.md).

---

## Secrets & Sensitive Data

### Detection patterns (scan before every commit)

| Type | Pattern |
|------|---------|
| API keys | `AIzaSy...`, `sk-...`, `ghp_...` |
| Credentials | `password=`, `secret=`, `token=` in non-test code |
| Project IDs | GCP project IDs, AWS account IDs |
| Personal emails | `@gmail.com`, `@outlook.com` |
| Connection strings | `postgres://`, `mongodb://` with creds |

### Gitignore requirements

`.env`, `.env.*`, `*.tfstate`, `*.tfvars` (not `.example`), `**/credentials.json`, `**/service-account*.json`, `.copilot-tasks.md`

### When user shares credentials in chat

> "⚠️ I see you've shared a credential. I won't include this in any code or commits. Consider rotating this key if it was exposed."

---

## Fail Secure

Errors must deny access, not grant it.

```python
# ❌ Fail open
try:
    user = verify_token(token)
except:
    user = AnonymousUser()  # Grants access on error!

# ✅ Fail secure
try:
    user = verify_token(token)
except:
    raise HTTPException(401, "Authentication failed")
```

### Dev bypass must guard against production

```python
# ❌ No production guard
if os.getenv("SKIP_AUTH") == "true":
    return dev_user

# ✅ Block in production
if os.getenv("SKIP_AUTH") == "true":
    if os.getenv("K_SERVICE"):  # Cloud Run always sets this
        raise RuntimeError("Auth bypass not allowed in production")
    return dev_user
```

**This project's `SKIP_AUTH` has no production guard — this is an open gap.**

---

## Multi-Tenant Data Isolation

**Critical for this project.** Every data access path must enforce household isolation:

- Storage layer: all operations accept and filter by `household_id`
- Router layer: extract `household_id` from authenticated user, pass to storage
- Cross-tenant references: verify loaded records belong to the same household
- Superuser bypass: explicit and auditable

**Challenge when:**
- Query loads data by ID without verifying `household_id`
- Meal plan references recipe IDs from another household
- Batch operations skip per-record ownership checks

---

## Technology-Specific Guidance

### FastAPI

- `Depends()` for auth on all routes
- CORS only for needed origins
- Pydantic for all input validation
- Set request body size limits on `/parse` (HTML) and image upload endpoints
- Never trust `SKIP_AUTH` / `SKIP_ALLOWLIST` in production

### Firebase/Firestore

- Verify security rules are not `allow read, write: if true`
- Restrict API keys by referrer/IP in Cloud Console

### React Native/Expo

- **AsyncStorage is unencrypted** — never store tokens/secrets. Use `expo-secure-store` for credentials
- Validate URL schemes before `Linking.openURL` (http/https only)
- Validate deep link route parameters
- Gate `console.log`/`console.error` behind `__DEV__` in production

### Docker / Containers

- **Always run as non-root** — add `USER` directive (⚠️ currently missing in this project)
- Add `.dockerignore` (exclude `.git/`, `tests/`, `.env`, `data/`, `*.md`)
- No secrets in image layers — use runtime env vars
- Pin base images to SHA digest

### IAM (Terraform)

**Always prefer resource-level over project-level IAM bindings:**

```terraform
# ❌ Project-level — can impersonate ANY SA
resource "google_project_iam_member" "sa_user" {
  role   = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${google_service_account.deployer.email}"
}

# ✅ Resource-level — scoped to specific SA
resource "google_service_account_iam_member" "sa_user" {
  service_account_id = "projects/${var.project}/serviceAccounts/${module.cloud_run.service_account_email}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
```

Roles to watch: `serviceAccountUser`, `storage.objectAdmin`, `secretmanager.secretAccessor`, `cloudfunctions.invoker` — all should be resource-scoped when possible.

### CI/CD Pipelines

- Every workflow MUST have explicit `permissions:` block (least-privilege `GITHUB_TOKEN`)
- Pin all GitHub Actions to SHA digest, not mutable tags (Renovate handles this via `pinGitHubActionDigests`)
- Never echo secrets in CI logs — use `::add-mask::`
- Gate deploy steps behind branch/environment protection

### Supply Chain

| Layer | This Project |
|-------|-------------|
| Lockfiles | `uv.lock`, `pnpm-lock.yaml` with `--frozen` flags |
| Update quarantine | Renovate `minimumReleaseAge: 3 days` |
| Auto-merge policy | Minor/patch only — majors require review |
| Image pinning | `python:3.14-slim@sha256:...` in Dockerfile |
| Vuln scanning | Trivy on PRs + weekly schedule |

---

## Code Review Security Checklist

- [ ] Auth: Every sensitive endpoint requires authentication?
- [ ] Authz: Verifies user can access this specific resource?
- [ ] Input: All user input validated?
- [ ] Secrets: No hardcoded credentials?
- [ ] Errors: Messages don't leak implementation details?
- [ ] Dependencies: Known vulnerabilities checked?

---

## Incident Response

If sensitive data is accidentally committed:

1. **Rotate the credential immediately** — assume compromised
2. Git history retains deleted files — use `git-filter-repo` if needed
3. Notify affected parties if user data exposed

---

## When to Escalate

**Stop and refuse to proceed when:**
- User asks to commit credentials
- Code exposes user data without authorization
- Auth bypass "for testing" without production guard
- Security controls disabled without justification

> "I can't implement this as requested because [risk]. The secure alternative is [solution]."
