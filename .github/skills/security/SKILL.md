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

**Challenge when:**
- Code assumes internal services are safe
- Requests between services skip authentication
- "It's only called by our frontend" justifies missing validation

### Least Privilege

**"Grant only the minimum permissions needed."**

- Service accounts should have narrow scopes
- API tokens should be scoped to specific operations
- Users should only access their own data

**Challenge when:**
- Service account has `roles/owner` or `roles/editor`
- API key has full access when read-only would suffice
- Database user can write to tables it only needs to read

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
|------|----------|-------------------|
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

## 3. OWASP Top 10 Checklist

### A01: Broken Access Control

**Challenge when:**
- API endpoint doesn't verify user owns the resource
- Missing authentication on sensitive routes
- Direct object references without ownership check

**Example challenge:**
> "This endpoint returns recipe by ID but doesn't check if the user has access to it. An attacker could enumerate IDs to access other users' recipes. Add ownership verification."

**Pattern to enforce:**
```python
# WRONG - no ownership check
@router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str):
    return await storage.get_recipe(recipe_id)

# CORRECT - verify ownership
@router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str, user: User = Depends(get_current_user)):
    recipe = await storage.get_recipe(recipe_id)
    if recipe.household_id != user.household_id:
        raise HTTPException(403, "Access denied")
    return recipe
```

### A02: Cryptographic Failures

**Challenge when:**
- Storing passwords in plain text
- Using weak hashing (MD5, SHA1)
- Transmitting sensitive data over HTTP
- Hardcoded encryption keys

**This project uses Firebase Auth** - password handling is delegated. But verify:
- All API calls use HTTPS
- Tokens are validated server-side
- No sensitive data in URL parameters

### A03: Injection

**Challenge when:**
- String concatenation in queries
- User input in shell commands
- Template injection in rendered content

**Pattern to enforce:**
```python
# WRONG - SQL injection risk
query = f"SELECT * FROM users WHERE id = '{user_id}'"

# CORRECT - parameterized
query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))
```

For Firestore (this project):
```python
# WRONG - user controls field name
doc_ref.update({user_input: value})

# CORRECT - validate field names
ALLOWED_FIELDS = ["title", "ingredients", "instructions"]
if field not in ALLOWED_FIELDS:
    raise ValueError("Invalid field")
```

### A04: Insecure Design

**Challenge when:**
- No rate limiting on authentication
- Missing CSRF protection on state-changing operations
- Unlimited file upload sizes
- No input length limits

**This project should have:**
- Rate limiting on login attempts (Firebase handles this)
- Request size limits on API
- Validation on all user inputs

### A05: Security Misconfiguration

**Challenge when:**
- Debug mode in production
- Default credentials
- Unnecessary features enabled
- Missing security headers

**Check for:**
```python
# WRONG - debug in production
app = FastAPI(debug=True)  # Only for development!

# CORRECT - environment-based
app = FastAPI(debug=os.getenv("DEBUG", "false").lower() == "true")
```

**Required headers (add via middleware):**
```python
# Security headers
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
```

### A06: Vulnerable Components

**Challenge when:**
- Outdated dependencies with known CVEs
- Using deprecated libraries
- Ignoring security advisories

**Actions:**
- Check `uv.lock` / `package-lock.json` for outdated packages
- Run `npm audit` / `pip-audit` periodically
- Enable Dependabot/Renovate for automatic updates

### A07: Authentication Failures

**Challenge when:**
- Weak password policies
- Missing MFA option
- Session doesn't expire
- Tokens stored insecurely

**This project uses Firebase Auth** - most is handled. Verify:
- Token validation on every API request
- Token expiry is enforced
- Refresh token rotation

### A08: Data Integrity Failures

**Challenge when:**
- Deserializing untrusted data
- Missing integrity checks on downloads
- Unsigned updates

**Pattern to enforce:**
```python
# WRONG - trusting user-provided data shape
data = json.loads(request.body)
recipe = Recipe(**data)  # What if data has extra fields?

# CORRECT - explicit validation
data = json.loads(request.body)
recipe = RecipeCreate.model_validate(data)  # Pydantic validates
```

### A09: Logging & Monitoring Failures

**Challenge when:**
- No logging of security events
- Sensitive data in logs
- No alerting on failures

**Never log:**
- Passwords or tokens
- Full credit card numbers
- Personal health information

**Always log:**
- Authentication failures
- Authorization failures
- Input validation failures

### A10: Server-Side Request Forgery (SSRF)

**Challenge when:**
- User-provided URLs are fetched server-side
- No URL validation

**This project risk:** Recipe URL scraping

**Pattern to enforce:**
```python
# WRONG - fetch any URL
response = requests.get(user_provided_url)

# CORRECT - validate URL
parsed = urlparse(user_provided_url)
if parsed.scheme not in ("http", "https"):
    raise ValueError("Invalid URL scheme")
# Consider: blocklist internal IPs (10.x, 192.168.x, 127.x, metadata endpoints)
```

---

## 4. OWASP LLM Top 10 (for Gemini AI)

This project uses Gemini for recipe enhancement. LLM-specific security risks apply.

### LLM01: Prompt Injection

**Challenge when:**
- User input is concatenated into prompts
- No separation between system instructions and user content

**This project risk:** Recipe text could contain malicious instructions.

**Pattern to enforce:**
```python
# WRONG - user content mixed with instructions
prompt = f"Enhance this recipe: {user_recipe_text}"

# CORRECT - clear separation, structured input
prompt = f"""
<system>You are a recipe enhancement assistant. Only modify cooking instructions.</system>
<user_content>{sanitize(user_recipe_text)}</user_content>
<task>Improve the recipe techniques while preserving ingredients.</task>
"""
```

**Defenses:**
- Treat all user content as untrusted data
- Use structured prompt templates from `config/prompts/`
- Validate LLM output before using (don't execute returned code)

### LLM02: Insecure Output Handling

**Challenge when:**
- LLM output is directly rendered as HTML/JS
- LLM output is used in database queries
- LLM output is executed as code

**Pattern to enforce:**
```python
# WRONG - trusting LLM output
html_content = llm_response  # Could contain <script> tags

# CORRECT - sanitize output
from markupsafe import escape
html_content = escape(llm_response)
```

### LLM03: Training Data Poisoning

**Not directly applicable** - using Gemini API, not training custom models.

### LLM04: Model Denial of Service

**Challenge when:**
- No limits on prompt size
- No rate limiting on LLM calls
- Expensive operations triggered by user input

**Defenses:**
- Limit input text length before sending to Gemini
- Rate limit enhancement requests per user
- Set timeout on API calls

### LLM05: Supply Chain Vulnerabilities

**Challenge when:**
- Using untrusted model providers
- No verification of model responses

**This project:** Uses Google's Gemini API - trusted provider. Verify:
- API key is properly secured
- Using official `google-genai` SDK

### LLM06: Sensitive Information Disclosure

**Challenge when:**
- Sending PII to LLM APIs
- LLM responses contain user data from training

**Pattern to enforce:**
```python
# WRONG - sending user email to LLM
prompt = f"Recipe by {user.email}: {recipe}"

# CORRECT - anonymize before sending
prompt = f"Recipe: {recipe}"  # No PII
```

**This project should:**
- Never send user emails, IDs, or household info to Gemini
- Only send recipe content (ingredients, instructions)

### LLM07: Insecure Plugin Design

**Not applicable** - not using LLM plugins/tools.

### LLM08: Excessive Agency

**Challenge when:**
- LLM can trigger actions (database writes, API calls)
- No human approval for LLM-initiated actions

**This project:** Recipe enhancement is read-then-write with human review:
1. LLM generates enhanced recipe (safe - just text)
2. Human reviews via `recipe_reviewer.py`
3. Human approves upload

**If adding automated enhancement:** Add approval step or strict output validation.

### LLM09: Overreliance

**Challenge when:**
- LLM output used without verification
- No fallback when LLM fails

**Pattern to enforce:**
```python
# WRONG - blind trust
enhanced_recipe = await gemini.enhance(recipe)
await save_recipe(enhanced_recipe)  # What if it's garbage?

# CORRECT - validate
enhanced_recipe = await gemini.enhance(recipe)
if not validate_recipe_structure(enhanced_recipe):
    logger.warning("LLM produced invalid recipe")
    return original_recipe  # Fallback
```

### LLM10: Model Theft

**Not applicable** - using Gemini API, not hosting custom models.

---

## 5. Project-Specific Data Prevention

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
|-----------|----------------|-------------------|
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

## 6. Code Review Security Checklist

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

## 7. Incident Response

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

## 8. Security Anti-Patterns to Challenge

| Anti-Pattern | Challenge With |
|--------------|----------------|
| "It's just internal" | Internal networks get breached. Defense in depth. |
| "No one will guess that URL" | Security through obscurity fails. Add proper auth. |
| "We'll add security later" | Security debt compounds. Add it now. |
| "The framework handles it" | Verify the framework config. Defaults aren't always secure. |
| "It's encrypted" | Encryption without key management is theater. Where's the key? |
| "Only admins use this" | Admin accounts get compromised. Verify anyway. |

---

## 9. Technology-Specific Guidance

### Firebase/Firestore

- Verify security rules are not `allow read, write: if true`
- Check that `firebase.json` doesn't expose admin endpoints
- Ensure API keys are restricted by referrer/IP in Cloud Console

### FastAPI

- Use `Depends()` for auth on all routes
- Enable CORS only for needed origins
- Use Pydantic for all input validation

### React Native/Expo

- Don't store tokens in AsyncStorage without encryption
- Validate deep links to prevent open redirects
- Be cautious with WebViews - they can bypass security

### Terraform

- Never commit `.tfvars` with real values
- Use Secret Manager for sensitive variables
- Enable audit logging on GCP resources

---

## 10. When to Escalate

**Stop and refuse to proceed when:**

- User asks to commit credentials to repo
- Code would expose user data without authorization
- Authentication is being bypassed "for testing"
- Security controls are being disabled without justification

**Response pattern:**
> "I can't implement this as requested because [specific risk]. The secure alternative is [solution]. If you need to proceed differently, please explain the use case so I can suggest a safe approach."
