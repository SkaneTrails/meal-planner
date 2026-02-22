# Meal Planner - AI Coding Agent Instructions

## ⚠️ FIRST: Read Working Context

**At conversation start, ALWAYS:**
1. Read `.copilot-tasks.md` using `read_file`
2. Check for active tasks on current branch
3. Skim Failure Tracking table for patterns relevant to current topic
4. Acknowledge what you found before proceeding

This file is gitignored (local-only, never committed). Ignoring it loses track of work.

**On failure:** Log to Failure Tracking table in `.copilot-tasks.md`; when count reaches 3, promote to permanent documentation.

### ⚠️ Two Todo Systems — Do NOT Confuse Them

| | `.copilot-tasks.md` | `manage_todo_list` tool |
| --- | --- | --- |
| **Purpose** | Persistent project backlog across conversations | Ephemeral progress tracker within a single session |
| **Lifetime** | Permanent — local file (gitignored) | Gone when conversation ends |
| **Content** | Open issues, deferred work, failure tracking | Steps for the current task only |
| **When to update** | Branch changes, tasks complete, issues discovered | Breaking down multi-step work in progress |

**Never** use `manage_todo_list` as a substitute for updating `.copilot-tasks.md`. They serve completely different purposes.

---

## Important: Collaboration Guidelines

You are collaborating with a human who may make changes between your edits:

- **Always re-verify** file contents before making changes - don't assume previous state
- **If your previous changes are gone**, do not re-add them without checking with the user first
- **Read before editing** - the human may have modified, moved, or intentionally removed content
- **Verify suggestions** - when given review comments or suggestions, verify they are correct against actual code before applying
- **Compare alternatives** - when the user suggests a different approach, analyze both options and explain the tradeoffs
- **Troubleshoot step-by-step** - when debugging, suggest one fix at a time and wait for results
- **Assess test coverage for bugs** - when a bug is reported, assess whether a test should be added to catch it. Explain why existing tests missed it (e.g., mocking strategy, missing coverage) and propose a targeted test if appropriate
- **Track iterations** - when a command/approach fails, IMMEDIATELY log to Failure Tracking table in `.copilot-tasks.md` BEFORE retrying with a different approach
- **Plan before large changes** - for complex changes (3+ files), propose a high-level plan first
- **Communicate scope decisions** - if splitting work (e.g., backend-first, then mobile), state the plan upfront and ask if the approach works before starting. Never silently defer work and present it as complete
- **Never work directly on main** - Always create a feature branch for changes
- **Avoid parallel branches that touch the same files** - Before creating a new branch, check for open PRs (`gh pr list`). If an open PR modifies the same high-churn files (e.g., `setup.ts` mock themes, shared imports), either stack the new branch on top of that PR's branch or wait for it to merge. See `pr-review-workflow` skill for details
- **Before editing Copilot config** - read `copilot-self-improvement` skill before modifying `copilot-instructions.md`, `*.instructions.md`, skills, or `copilot-references.md`
- **After pulling from main** - check `git diff HEAD@{1} --name-only` for changes to `.github/copilot-instructions.md`, `.github/skills/**`, `*.instructions.md`, `.github/agents/**`, or `.copilot-tasks.md`. If any changed, re-read them before continuing work — they may contain updated instructions, new skills, or task state changes from another session
- **Never use `--no-verify`** - NEVER pass `--no-verify` or `-n` to `git commit` or `git push`. Pre-commit hooks exist for a reason — bypassing them lets broken code, lint violations, and security issues slip through. If hooks fail, fix the underlying issue
- **Never use `git commit --amend` after hook failure** - When a pre-commit hook fails and auto-fixes files (e.g., Biome), the original `git commit` never creates a commit. Running `--amend` then modifies the *previous* commit (often a merge commit), corrupting history. Instead: `git add -A && git commit -m "style: apply auto-fixes"` as a separate commit. To avoid the issue entirely, run formatters before committing: `npx biome check --write .`
- **Before committing** - quick security scan: grep staged files for API keys (`AIzaSy`, `sk-`, `ghp_`), emails (`@gmail.com`, `@outlook.com`), project IDs. If found, read `security` skill before proceeding
- **Update `.copilot-tasks.md` as you work** - mark tasks complete immediately, don't batch updates
- **Never fabricate project IDs or secrets** - NEVER guess or invent GCP project IDs, API keys, or other environment values. Always read from `.env` (`GOOGLE_CLOUD_PROJECT`) or ask the user. Fabricated IDs waste time and erode trust
- **Use existing scripts first** - before writing inline Python or ad-hoc commands, check `tools/` and `scripts/` and skill documentation for existing tools that do what you need (e.g., `recipe_manager.py` for Firestore recipe/user/household operations)
- **PowerShell backtick escaping** - NEVER include backtick characters in ANY `gh` CLI string argument — not just `--body`, but also `-f "body=..."`, `-f "query=..."`, commit messages, or any inline string. PowerShell interprets `` ` `` as escape characters, causing `Unicode escape sequence is not valid` errors. **Workarounds:** (1) Write content to a temp file, use `-F "body=@file.md"` or `--body-file`, then delete the file. (2) For short replies without markdown formatting, just omit backticks entirely (e.g., write `useSetMeal` not `` `useSetMeal` ``)
- **PowerShell pipeline commands hang** - NEVER use `Get-ChildItem | ForEach-Object`, `Select-String` pipelines, or nested PowerShell commands for workspace scanning — they hang indefinitely on Windows. Use `grep_search`, `file_search`, `list_dir`, or `semantic_search` tools instead. For simple line counts or file checks, use `read_file` or single-file terminal commands.
- **Never run inline Python in PowerShell** - NEVER use `python -c "..."` or `uv run python -c "..."` in the terminal. PowerShell mangles parentheses, quotes, and special characters inside string arguments, causing `SyntaxError: '(' was never closed` and similar parse errors. **Always** write the code to a temporary `.py` file (in `tmp/`) and execute it with `python tmp/script.py`. Delete the file afterward if it was single-use.
- **Zero tolerance for errors** - There is no such thing as a "pre-existing" error. If you encounter a compile error, type error, lint violation, or any other issue — fix it immediately, regardless of when it was introduced. A merge to main must never contain known bugs. Never dismiss an error as "not related to my changes" or "pre-existing." If you see it, you own it.

## Keeping Documentation Current

> **🚨 BLOCKING REQUIREMENT: Update docs BEFORE pushing.**

### Pre-Push Checklist (MANDATORY)

- [ ] **Architecture changes** → Update `copilot-instructions.md` Architecture section
- [ ] **New/changed scripts** → Update `docs/DEVELOPMENT.md` and `copilot-instructions.md`
- [ ] **New directories** → Update project structure in BOTH docs
- [ ] **New dependencies** → Document in `copilot-instructions.md` Key Dependencies
- [ ] **New API endpoints** → Update `docs/DEVELOPMENT.md` API section
- [ ] **User-facing changes** → Update `README.md`
- [ ] **New skills** → Add to skills table in `copilot-instructions.md`

## Project Overview

**Meal Planner** is a recipe collector and weekly meal planner app. It allows users to:

1. **Import recipes** from URLs - automatically extracts ingredients, instructions, and images
2. **Plan weekly meals** - organize recipes into a weekly calendar
3. **Generate grocery lists** - combine ingredients from planned meals

## Architecture

The project is a multi-platform meal planning system with three main interfaces:

| Platform | Directory | Stack | Purpose |
| -------- | --------- | ----- | ------ |
| Mobile | `mobile/` | React Native + Expo | iOS/Android + Web app |
| API | `api/` | FastAPI | REST backend |
| Functions | `functions/` | Google Cloud Functions | Serverless recipe scraping |

### Application Structure

```
api/                     # FastAPI REST backend
├── main.py              # FastAPI app entry point
├── models/              # Pydantic models
│   ├── recipe.py
│   ├── meal_plan.py
│   └── grocery_list.py
├── routers/             # API route handlers
│   ├── recipes.py       # Includes /enhance endpoint (disabled)
│   ├── meal_plans.py
│   └── grocery.py
├── services/            # Business logic
│   ├── ingredient_parser.py
│   ├── prompt_loader.py      # Loads modular prompts from config/
│   └── recipe_enhancer.py    # Gemini AI enhancement service
└── storage/             # Firestore persistence

config/prompts/          # Gemini AI prompts (see recipe-improvement skill)

mobile/                  # React Native mobile app
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation screens
│   ├── recipe/[id].tsx  # Recipe detail screen
│   ├── add-recipe.tsx   # Add recipe screen
│   └── select-recipe.tsx
├── components/          # Reusable UI components
├── lib/                 # Utilities, hooks, API client
│   ├── api.ts           # REST API client
│   ├── hooks/           # React Query hooks
│   └── types.ts         # TypeScript types
├── test/                # Test setup, helpers, RN mocks
└── package.json

functions/scrape_recipe/ # Cloud Function for recipe scraping

scripts/                 # CLI tools
├── setup-local-dev.ps1  # Local dev setup (Windows) - configures GCP auth
├── setup-local-dev.sh   # Local dev setup (macOS/Linux)
├── recipe_enhancer.py   # Gemini AI recipe enhancement
├── validate_gemini.py   # Validate enhanced recipes
├── upload_enhanced_recipe.py  # Re-upload corrupted enhanced recipes from JSON
├── batch_test.py        # Batch testing for enhancer
├── test_gemini.py       # Gemini API test script
├── run-api.sh           # Start FastAPI server
├── run-dev.sh           # Start all dev services
└── run-function.sh      # Run Cloud Function locally

tools/                   # Interactive CLI tools
├── admin_commands.py    # User & household management commands
└── recipe_manager.py    # Admin tool: recipes, users, households

infra/                   # Terraform infrastructure
├── environments/
│   └── dev/             # Development environment
│       ├── main.tf      # Root module
│       ├── variables.tf
│       ├── versions.tf
│       ├── backend.tf   # GCS state backend
│       └── access/      # User emails (gitignored)
└── modules/
    ├── apis/            # Enable GCP APIs
    ├── iam/             # Custom roles and permissions
    ├── firestore/       # Database and indexes
    ├── storage/         # GCS bucket for recipe images
    ├── cloud_function/  # Cloud Function for recipe scraping
    └── secrets/         # Secret Manager for API keys
```

### Key Dependencies

| Component | Key Packages |
| --------- | ------------ |
| API (`api/`) | fastapi, uvicorn, pydantic, google-cloud-firestore, google-cloud-storage, google-genai, recipe-scrapers, pillow |
| Mobile (`mobile/`) | expo, expo-router, @tanstack/react-query, nativewind, vitest, @testing-library/react |
| Functions (`functions/`) | functions-framework, recipe-scrapers |

### Data Flow

1. User pastes recipe URL → mobile fetches HTML (client-side to avoid IP blocking)
2. Mobile sends HTML + URL to API `/recipes/parse` → proxies to Cloud Function
3. Recipe saved to Firestore → user plans meals → grocery list generated
4. (Optional) `recipe_enhancer.py` enhances recipes with Gemini AI
5. (Optional) User uploads custom recipe image → stored in GCS bucket

### Firestore Schema

See `firestore.instructions.md` for the full recipe document schema. Key points:

- Single database: `meal-planner` for all recipes, meal plans, and grocery lists
- All fields at top level (one exception: `original` nested snapshot for enhanced recipes)
- `created_at` required for queries
- `instructions` must be `list[str]`, not a single string
- Enhanced recipes have `enhanced=True` and original data preserved in `original` nested field

### Skills (AI Agent Instructions)

Skills in `.github/skills/` provide domain-specific instructions:

| Skill                      | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `local-development/`       | GCP secrets, .env setup, starting servers, troubleshooting      |
| `recipe-improvement/`      | Cooking techniques, equipment optimization, dietary preferences |
| `pr-review-workflow/`      | PR creation, review comments, CI status, GitHub API patterns    |
| `working-context/`         | Track tasks and discovered issues across conversations          |
| `copilot-self-improvement/`| Meta-skill for maintaining Copilot config, skills, instructions |
| `security/`                | OWASP top 10, secrets handling, preventing sensitive data leaks |

## Development Workflows

For local development setup, environment configuration, and troubleshooting, see the `local-development` skill.

**Quick reference:**
- API: `uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload`
- Mobile: `cd mobile && npx expo start --web`

### Code Quality Tools

- **Package manager**: UV (Astral's fast Python package manager)
- **Linter/Formatter**: Ruff (configured in `pyproject.toml`)
- **Pre-commit hooks**: `.pre-commit-config.yaml`
- **Testing**: pytest (API), Vitest (mobile — `forks` pool on Windows, auto-configured in `vitest.config.ts`)
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`

## Code Style

See `pyproject.toml` for tool configurations. Style guides in `*.instructions.md` load automatically per file type.

- **Self-documenting code**: Avoid inline comments - code should be readable without them
- **Test coverage**: All API code must be tested (see Test Requirements below)

## Test Requirements

> **🚨 All API and mobile auth/hook changes MUST have corresponding tests.**

### Coverage Standards

- **Overall threshold**: 95% enforced by `fail_under` in `pyproject.toml` — pytest-cov will fail the run if coverage drops below this
- **Per-file minimum**: Every file in `api/` must have ≥95% coverage — no file gets a pass for "bringing the average down"
- **`# pragma: no cover`**: Use for code that would only test mock wiring, not real logic (see `python-style-guide.instructions.md` Testing section for categories). Never use pragma to hide untested logic

### API (pytest)
- New API endpoints → `tests/test_api_*.py`
- New service functions → `tests/test_*.py`
- **New model fields** → Test storage layer mapping (`_doc_to_recipe`, `_doc_to_*`)
- Bug fixes → Include a test that covers the fixed behavior
- Run: `uv run pytest --cov=api --cov-report=term-missing`

### Mobile (Vitest)
- Hook logic (conditional fetching, enabled guards) → `mobile/lib/hooks/__tests__/*.test.ts`
- Auth/role-based behavior (permissions, navigation guards) → `mobile/app/__tests__/*.test.tsx`
- Utility functions (parsing, aggregation) → `mobile/lib/utils/__tests__/*.test.ts`
- Test utilities: `mobile/test/helpers.ts` (query wrapper, mock user factory)
- **Overall threshold**: 80% stmts / 70% branches enforced by `thresholds` in `vitest.config.ts`
- **Excluded from coverage**: Screen components, API client wrappers, theme constants, orchestration hooks (see `vitest.config.ts` coverage.exclude)
- **`createTestQueryClient()` caveat**: Uses `gcTime: 0` — cache entries with no active observer are GC'd immediately. For mutation `onSuccess` cache tests, create a dedicated `QueryClient` without `gcTime: 0`
- Run: `cd mobile && pnpm test` / `pnpm test:coverage`

### Pre-Commit Checklist
Before committing changes that add new functionality:
- [ ] **Zero compile/type errors** across the codebase — not just in files you touched
- [ ] Storage layer: Do mapping functions (`_doc_to_*`) include the new fields?
- [ ] Are those mappings tested with explicit assertions?
- [ ] Does API coverage pass? (`uv run pytest --cov=api` — threshold enforced by `pyproject.toml`)
- [ ] No single API file dropped below 95%? (check `--cov-report=term-missing` output)
- [ ] Does mobile coverage pass? (`cd mobile && pnpm test:coverage` — thresholds enforced by `vitest.config.ts`)

**Exceptions:** Terraform, config files, pure UI styling.

## When Making Changes

1. Create feature branch: `git switch -c feat/feature-name`
2. Write tests first (TDD)
3. Implement the feature
4. Run tests and linting: `uv run pytest --cov=api && uv run ruff check`
5. Commit with conventional message (`feat:`, `fix:`, `chore:`, etc.)
6. Push and create PR

## Recipe Enhancement

AI-powered recipe enhancement using Gemini. See `recipe-improvement` skill for prompt structure, CLI tools, and rules.
