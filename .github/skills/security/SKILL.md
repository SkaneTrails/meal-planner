---
name: security
description: Security best practices, OWASP guidelines, and preventing accidental exposure of sensitive data
---

# Skill: Security

You are the security expert. The developer may not be aware of security implications. **Challenge bad practices proactively** - do not assume the developer knows the risks.

---

## Activation Context

This skill activates when:

- Creating or modifying authentication/authorization code
- Handling user input, API endpoints, or database queries
- Working with secrets, API keys, or credentials
- Creating new files that might contain sensitive data
- Reviewing `.gitignore` or adding new config files
- Any code that handles PII (personally identifiable information)

---

## Core Principle: Assume Nothing, Challenge Everything

**You are the expert.** When you detect a security concern:

1. **Stop and explain** - Do not silently fix or ignore
2. **State the risk** - What could go wrong and how severe
3. **Recommend the fix** - Provide the secure alternative
4. **Block if critical** - Refuse to proceed for high-severity issues

**Anti-pattern:** Quietly fixing a SQL injection without explaining why.

**Correct pattern:** "This query is vulnerable to SQL injection. An attacker could [specific impact]. I'm using parameterized queries instead. Here's why that's safer..."

---

## 1. Core Security Principles

These principles apply to every security decision. Reference them when challenging code.

### Zero Trust

**"Never trust, always verify."**

- Don't trust requests just because they come from "inside" the network
- Don't trust data just because it's from your own database
- Don't trust users just because they're authenticated
- Don't trust CI/CD pipelines — they run arbitrary code and have powerful credentials
- Don't trust previous builds — verify freshly, pin explicitly

**Challenge when:**
- Code assumes internal services are safe
- Requests between services skip authentication
- "It's only called by our frontend" justifies missing validation
- Workflow has no `permissions:` block (gets broad default GITHUB_TOKEN scope)
- Third-party GitHub Actions are referenced by mutable tag instead of SHA digest
- Pipeline secrets are available to steps that don't need them

### Least Privilege

**"Grant only the minimum permissions needed."**

- Service accounts should have narrow scopes
- API tokens should be scoped to specific operations
- Users should only access their own data

**Challenge when:**
- Service account has `roles/owner` or `roles/editor`
- API key has full access when read-only would suffice
- Database user can write to tables it only needs to read
- IAM binding is project-level when it could be resource-scoped (e.g., `serviceAccountUser`)

**This project examples:**
```terraform
# WRONG - overly broad
resource "google_project_iam_member" "sa" {
  role   = "roles/editor"  # Too broad!
}

# CORRECT - minimal scope
resource "google_project_iam_member" "sa" {
  role   = "roles/cloudfunctions.invoker"  # Only what's needed
}
```

### Defense in Depth

**"Multiple layers of security."**

- Don't rely on a single control
- If one layer fails, others should catch it
- Combine: authentication + authorization + validation + encryption

**Challenge when:**
- "The firewall will block that" (single layer)
- "Users can't reach that endpoint" (security by obscurity)
- Input validation only on frontend (bypassed by API calls)

### Fail Secure

**"When in doubt, deny."**

- Errors should result in denied access, not granted
- Missing permissions = no access (not default access)
- Parse errors should reject, not proceed

**Pattern to enforce:**
```python
# WRONG - fail open
try:
    user = verify_token(token)
except:
    user = AnonymousUser()  # Grants access on error!

# CORRECT - fail secure
try:
    user = verify_token(token)
except:
    raise HTTPException(401, "Authentication failed")
```

**Dev bypass anti-pattern:**
```python
# WRONG - env var alone controls auth bypass (could leak to production)
if os.getenv("SKIP_AUTH", "").lower() == "true":
    return dev_user

# CORRECT - fail secure by blocking in production
if os.getenv("SKIP_AUTH", "").lower() == "true":
    if os.getenv("K_SERVICE"):  # Cloud Run always sets this
        raise RuntimeError("Auth bypass not allowed in production")
    return dev_user
```

**Challenge when:**
- `SKIP_AUTH` or similar dev bypass has no production guard
- Default case grants access instead of denying
- Error handling catches broadly and proceeds

### Separation of Duties

**"No single person/service should have complete control."**

- Production secrets accessible to limited people
- Deployments require review
- Admin actions are logged

**This project:** Uses GitHub PR reviews before merging to main.

---

## 2. Secrets & Sensitive Data

### Never Commit

| Type | Examples | Detection Pattern |
| ---- | -------- | ----------------- |
| API keys | `AIzaSy...`, `sk-...`, `ghp_...` | Regex: `[A-Za-z0-9_-]{20,}` in code |
| Passwords | `password=`, `secret=` | Grep for `password`, `secret`, `token` in non-test code |
| Project IDs | GCP project IDs, AWS account IDs | Grep for specific project patterns |
| Personal emails | `user@domain.com` | Grep for `@gmail`, `@outlook`, etc. |
| IP addresses | Production server IPs | Grep for IP patterns in config |
| Database URLs | Connection strings | Grep for `postgres://`, `mongodb://`, `firestore` with creds |

### Before Committing Any New File

Ask: **"Does this file contain environment-specific or sensitive data?"**

If yes:
1. Add to `.gitignore`
2. Create a `.example` template with placeholder values
3. Document in README or skill how to populate

### Files That MUST Be Gitignored

```gitignore
# Environment files
.env
.env.*
*.env

# Terraform state and variables
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example

# IDE and local config
.vscode/settings.json
.idea/

# Credentials
**/credentials.json
**/service-account*.json
**/*-key.json

# Local development
.copilot-tasks.md
```

### When User Provides Sensitive Info

If a user pastes an API key, password, or credential in chat:

> "⚠️ I see you've shared a credential. I won't include this in any code or commits. Consider rotating this key if it was exposed."

---

## 3. OWASP References

For detailed OWASP Top 10 and LLM Top 10 checklists with code patterns, see [references/OWASP.md](references/OWASP.md).

**Quick reference - common risks in this project:**

| Risk | This Project's Mitigation | Gaps |
|------|--------------------------|------|
| A01: Broken Access Control | `household_id` checks on recipe endpoints | Grocery endpoint skips recipe visibility check |
| A02: Cryptographic Failures | Firebase Auth handles passwords | N/A |
| A03: Injection | Pydantic validation, Firestore parameterized queries | `update_recipe` allows arbitrary field names |
| A04: Insecure Design | Feature flags, input validation | No rate limiting on API; no `SKIP_AUTH` production guard |
| A05: Security Misconfiguration | CORS via env var | No security headers middleware |
| A09: Logging & Monitoring | Logger on auth failures | No security event audit trail |
| A06: Vulnerable Components | Renovate + Trivy scanning + lockfile pinning | No `pip-audit` in main test pipeline |
| A10: SSRF | Recipe URL scraping - validate schemes + IP blocklist | Cloud Function CORS is `*` |
| Supply Chain | SHA-pinned actions, image digests, release quarantine | Docker container runs as root; no `.dockerignore` |
| LLM01: Prompt Injection | Structured prompts from `config/prompts/` | No input sanitization before Gemini |
| LLM06: Sensitive Info | Never send PII to Gemini | `created_by` email could leak via `model_dump()` |

---

## 4. Project-Specific Data Prevention

### Before Every Commit

Scan for project-specific patterns:

```bash
# Patterns that should NOT appear in committed files
grep -r "<your-project-id>" .github/ --include="*.md"
grep -r "@gmail.com\\|@outlook.com" . --include="*.md" --include="*.py"
grep -r "AIzaSy[A-Za-z0-9_-]{33}" . --include="*.ts" --include="*.py"
```

### When Creating Config Files

| File Type | Should Contain | Should NOT Contain |
| --------- | -------------- | ----------------- |
| `.example` files | Placeholder values, structure | Actual values |
| Skills/Instructions | Generic patterns | Specific project IDs, URLs |
| Workflows | Environment variable references | Hardcoded secrets |
| Documentation | `<placeholder>` syntax | Real credentials |

### Placeholder Standards

Use consistent placeholder format:
- `<project-id>` - not an actual ID
- `your-api-key` - clearly fake
- `example@example.com` - reserved domain
- `192.0.2.1` - documentation IP range (RFC 5737)

---

## 5. Code Review Security Checklist

When reviewing code, check:

- [ ] **Auth:** Does every sensitive endpoint require authentication?
- [ ] **Authz:** Does it verify the user can access this specific resource?
- [ ] **Input:** Is all user input validated before use?
- [ ] **Output:** Is data properly escaped before display?
- [ ] **Secrets:** Are there any hardcoded credentials?
- [ ] **Logging:** Are security events logged (without sensitive data)?
- [ ] **Errors:** Do error messages leak implementation details?
- [ ] **Dependencies:** Are there known vulnerabilities?

---

## 6. Incident Response

If sensitive data is accidentally committed:

1. **Do NOT just delete the file** - Git history retains it
2. **Rotate the credential immediately** - assume it's compromised
3. **Use git-filter-repo** to remove from history (complex, may need force push)
4. **Notify affected parties** if user data was exposed

```bash
# Check if secret is in git history
git log -p --all -S "secret-value" --source

# If found, credential MUST be rotated
```

---

## 7. Security Anti-Patterns to Challenge

| Anti-Pattern | Challenge With |
| ------------ | -------------- |
| "It's just internal" | Internal networks get breached. Defense in depth. |
| "No one will guess that URL" | Security through obscurity fails. Add proper auth. |
| "We'll add security later" | Security debt compounds. Add it now. |
| "The framework handles it" | Verify the framework config. Defaults aren't always secure. |
| "It's encrypted" | Encryption without key management is theater. Where's the key? |
| "Only admins use this" | Admin accounts get compromised. Verify anyway. |
| "It's just CI/CD" | Pipelines hold deploy keys and cloud credentials. They ARE production. |
| "It runs in a container" | Containers aren't sandboxes. Non-root, minimal base, no secrets in layers. |

---

## 8. Technology-Specific Guidance

### Firebase/Firestore

- Verify security rules are not `allow read, write: if true`
- Check that `firebase.json` doesn't expose admin endpoints
- Ensure API keys are restricted by referrer/IP in Cloud Console

### FastAPI

- Use `Depends()` for auth on all routes
- Enable CORS only for needed origins
- Use Pydantic for all input validation
- Add security headers via middleware (`X-Content-Type-Options`, `X-Frame-Options`)
- Set request body size limits on endpoints accepting large payloads (HTML, images)
- Never trust `SKIP_AUTH` / `SKIP_ALLOWLIST` env vars in production — verify they are absent from Cloud Run config

### Multi-Tenant Data Isolation

**Critical for this project.** Every data access path must enforce household isolation:

- **Storage layer**: All read/write operations must accept `household_id` and filter accordingly
- **Router layer**: Extract `household_id` from authenticated user, pass to storage
- **Cross-tenant references**: When loading related data (e.g., recipe IDs from meal plans for grocery lists), verify the loaded records belong to the same household
- **Superuser bypass**: Must be explicit and auditable — never silently skip tenant checks

**Challenge when:**
- A query loads data by document ID without verifying `household_id`
- Meal plan references recipe IDs that could belong to another household
- Batch operations skip per-record ownership checks

### Cloud Function Security

- Prefer authenticated invocation (`allUsers` invoker only when necessary)
- When using public access, the function must validate the request origin or caller
- CORS on Cloud Functions should restrict origins (not `*`) in production

### React Native/Expo

- Don't store tokens in AsyncStorage without encryption
- Validate deep links to prevent open redirects
- Be cautious with WebViews - they can bypass security

#### AsyncStorage Security

AsyncStorage is **unencrypted** on both iOS and Android. Never store:
- Authentication tokens (use Firebase Auth's built-in token management)
- Passwords or secrets
- Sensitive user data

Acceptable uses:
- User preferences (language, favorites)
- UI state (checked items, collapsed sections)
- Cache keys that reference server-side data

If you must store sensitive data locally, use:
- `expo-secure-store` for credentials (Keychain on iOS, Keystore on Android)
- React Native encrypted storage libraries

#### URL Validation (Linking.openURL)

When opening user-provided URLs, validate scheme:

```tsx
// WRONG - opens any URL including javascript:, file://, etc.
Linking.openURL(userUrl);

// CORRECT - validate scheme first
const openSafeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL scheme');
    }
    Linking.openURL(url);
  } catch {
    showNotification('Error', 'Invalid URL');
  }
};
```

#### Deep Link Validation

When handling deep links (e.g., `mealplanner://recipe/123`):
- Validate route parameters against expected patterns
- Don't trust path segments for navigation without validation
- Sanitize IDs before using in API calls

#### Console Logging in Production

Remove or disable console.log in production builds:
- Logs may contain sensitive data (URLs, request details)
- Logs are visible in device logs on Android
- Use environment-based logging levels

### Terraform

- Never commit `.tfvars` with real values
- Use Secret Manager for sensitive variables
- Enable audit logging on GCP resources

#### IAM: Resource-Level vs Project-Level Bindings

**Always prefer resource-level IAM bindings over project-level.**

Project-level `google_project_iam_member` grants access to *all* resources of that type in the project. Resource-level bindings (e.g., `google_service_account_iam_member`, `google_storage_bucket_iam_member`) scope access to a single resource.

**Critical role: `roles/iam.serviceAccountUser`**

This role allows impersonating a service account. At project level, it grants impersonation of *every* SA in the project — a privilege escalation vector.

```terraform
# WRONG - can impersonate ANY service account in the project
resource "google_project_iam_member" "sa_user" {
  role   = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${google_service_account.deployer.email}"
}

# CORRECT - can only impersonate the specific runtime SA
resource "google_service_account_iam_member" "sa_user" {
  service_account_id = "projects/${var.project}/serviceAccounts/${module.cloud_run.service_account_email}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
```

**Challenge when:**
- `roles/iam.serviceAccountUser` is granted at project level (GCP-0011)
- `roles/editor` or `roles/owner` is used when a narrow role exists
- IAM bindings use `google_project_iam_member` for roles that can be scoped to a resource

**Other roles that should be resource-scoped when possible:**
- `roles/storage.objectAdmin` → scope to specific bucket
- `roles/secretmanager.secretAccessor` → scope to specific secret
- `roles/cloudfunctions.invoker` → scope to specific function

### CI/CD Pipeline Security

Pipelines are high-privilege environments — they hold deploy credentials, can push code, and run arbitrary commands. Apply the same rigor as production infrastructure.

#### Workflow Permissions (Least-Privilege GITHUB_TOKEN)

Every workflow MUST declare explicit `permissions:` to restrict GITHUB_TOKEN scope:

```yaml
# WRONG - inherits broad default permissions
on: push
jobs:
  test:
    runs-on: ubuntu-latest

# CORRECT - explicit minimal permissions
permissions:
  contents: read
on: push
jobs:
  test:
    runs-on: ubuntu-latest
```

**Challenge when:**
- A workflow has no `permissions:` block
- Permissions are broader than needed (e.g., `contents: write` for a read-only job)
- `id-token: write` is granted without Workload Identity Federation usage

#### Third-Party Action Trust

All GitHub Actions MUST be pinned to SHA digests, not mutable tags:

```yaml
# WRONG - tag can be force-pushed with malicious code
- uses: actions/checkout@v4

# CORRECT - immutable SHA with human-readable comment
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v4.3.0
```

**This project:** Renovate's `helpers:pinGitHubActionDigests` preset handles this automatically.

**Challenge when:**
- An action is referenced by tag (e.g., `@v4`) instead of SHA
- A new action is added from an untrusted publisher
- An action has write permissions to the repository or deployments

#### Pipeline Secrets Exposure

- Never echo secrets or env vars in CI logs
- Use `::add-mask::` to redact sensitive values that appear in logs
- Write secrets to temp files (not env vars) when tools need them, then clean up
- Gate deploy steps behind branch/environment protection rules

### Supply Chain Security

Dependency supply chain attacks are a top-tier risk. Multiple layers of defense:

| Layer | Mechanism | This Project |
|-------|-----------|-------------|
| Lockfiles | Pin exact versions at install time | `uv.lock`, `pnpm-lock.yaml` with `--frozen` flags |
| Update quarantine | Delay adopting new versions | Renovate `minimumReleaseAge: 3 days` |
| Auto-merge policy | Only minor/patch auto-merge | Renovate config — majors require manual review |
| Image pinning | Pin Docker/OCI images to digest | `python:3.14-slim@sha256:...` in Dockerfile |
| Vulnerability scanning | Detect known CVEs | Trivy on PRs + weekly schedule |
| License compliance | Block copyleft in proprietary code | Trivy SBOM + license check |

**Challenge when:**
- A new dependency is added without justification
- A Dockerfile uses a tag (`:latest`, `:3.14`) without SHA digest
- Lockfile changes are large or unexpected (could indicate dependency confusion)
- A dependency is imported but never used in code

### Docker / Containers

- **Always run as non-root** — add `USER` directive:
  ```dockerfile
  RUN addgroup --system app && adduser --system --ingroup app app
  USER app
  ```
- **Use multi-stage builds** — build deps in one stage, copy only artifacts to slim runtime stage
- **Pin base images to SHA digest** — prevents silent upstream changes
- **Add `.dockerignore`** — exclude `.git/`, `tests/`, `.env`, `data/`, `*.md` from build context
- **No secrets in image layers** — use build-time mounts or runtime env vars
- **Minimize attack surface** — slim/distroless base images, no unnecessary packages

**Challenge when:**
- Dockerfile has no `USER` directive (runs as root)
- Base image uses a mutable tag without digest
- `COPY . .` without a `.dockerignore` (pulls in secrets, tests, git history)
- Secrets are passed as `ARG` or `ENV` during build (visible in layer history)

---

## 9. When to Escalate

**Stop and refuse to proceed when:**

- User asks to commit credentials to repo
- Code would expose user data without authorization
- Authentication is being bypassed "for testing"
- Security controls are being disabled without justification

**Response pattern:**
> "I can't implement this as requested because [specific risk]. The secure alternative is [solution]. If you need to proceed differently, please explain the use case so I can suggest a safe approach."
