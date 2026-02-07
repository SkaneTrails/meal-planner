# OWASP Security Cheat Sheets

Reference material for the security skill. Read when working on authentication, authorization, input validation, or LLM integration.

---

## OWASP Top 10 Web Application Risks

### A01: Broken Access Control

**Challenge when:**
- API endpoint doesn't verify user owns the resource
- Missing authentication on sensitive routes
- Direct object references without ownership check

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

**Multi-tenant isolation pattern:**
```python
# WRONG - load by ID without tenant check (e.g., grocery list loading recipes from meal plan)
for recipe_id in meal_plan_recipe_ids:
    recipe = recipe_storage.get_recipe(recipe_id)  # No household check!
    process(recipe)

# CORRECT - verify each loaded record belongs to the household
for recipe_id in meal_plan_recipe_ids:
    recipe = recipe_storage.get_recipe(recipe_id)
    if recipe and (recipe.household_id == household_id or recipe.visibility == "shared" or recipe.household_id is None):
        process(recipe)
```

### A02: Cryptographic Failures

**Challenge when:**
- Storing passwords in plain text
- Using weak hashing (MD5, SHA1)
- Transmitting sensitive data over HTTP
- Hardcoded encryption keys

**This project uses Firebase Auth** - password handling is delegated. Verify:
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
- Dev-mode auth bypasses can leak to production

**This project should have:**
- Rate limiting on login attempts (Firebase handles this)
- Rate limiting on API endpoints (especially scrape/enhance - expensive operations)
- Request size limits on API (especially `/parse` HTML body, image uploads)
- Validation on all user inputs
- Guarantee that `SKIP_AUTH` / `SKIP_ALLOWLIST` are never set in Cloud Run environment

**Dev-mode bypass anti-pattern:**
```python
# RISKY - env var controls auth bypass
if os.getenv("SKIP_AUTH", "").lower() == "true":
    return dev_user

# SAFER - also verify not in production
if os.getenv("SKIP_AUTH", "").lower() == "true":
    if os.getenv("K_SERVICE"):  # Cloud Run sets this
        logger.critical("SKIP_AUTH enabled in Cloud Run!")
        raise RuntimeError("Auth bypass not allowed in production")
    return dev_user
```

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

## OWASP LLM Top 10 (for Gemini AI)

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

---

## Not Applicable to This Project

- **LLM03: Training Data Poisoning** - Using Gemini API, not training custom models
- **LLM07: Insecure Plugin Design** - Not using LLM plugins/tools
- **LLM10: Model Theft** - Using Gemini API, not hosting custom models
