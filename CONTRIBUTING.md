# Contributing

Thank you for your interest in contributing! This document covers the development
workflow. For local setup and environment configuration, see
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Getting Started

### Prerequisites

- Python 3.14+ and [UV](https://github.com/astral-sh/uv)
- Node.js 20+ and [pnpm](https://pnpm.io/)
- Git and [gh CLI](https://cli.github.com/) (for PRs)

### Setup

```bash
# Clone or fork
git clone https://github.com/YOUR-USERNAME/meal-planner.git
cd meal-planner

# API dependencies
uv sync --extra dev
uv run pre-commit install

# Mobile dependencies
cd mobile
pnpm install
```

## Making Changes

### 1. Create a Feature Branch

Always create a new branch from `main`:

```bash
git switch main
git pull
git switch -c feat/your-feature-name
```

**Branch naming conventions:**

- `feat/feature-name` — New features
- `fix/bug-description` — Bug fixes
- `chore/task-description` — Maintenance tasks
- `docs/description` — Documentation changes

### 2. Write Tests First

All API and mobile auth/hook changes must have corresponding tests.

```bash
# API tests (pytest)
uv run pytest --cov=api --cov-report=term-missing

# Mobile tests (Vitest)
cd mobile && pnpm test
```

**Exceptions:** Terraform, config files, pure UI styling.

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>
```

**Commit types:**

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `chore:` — Maintenance (dependencies, config)
- `refactor:` — Code refactoring (no behavior change)
- `test:` — Adding or updating tests
- `ci:` — CI/CD changes
- `perf:` — Performance improvements

### 4. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
gh pr create
```

## Code Style

### Python

- **Formatter/Linter**: Ruff (configured in `pyproject.toml`)
- **Line length**: 120 characters
- **Type hints**: Use modern syntax (`list[str]` not `List[str]`)
- **Models**: Dataclasses with `@dataclass` decorator
- **Self-documenting code**: Avoid inline comments

```bash
uv run ruff check --fix
uv run ruff format
```

### TypeScript/React

- **Formatter/Linter**: Biome (configured in `mobile/biome.json` and `mobile/package.json` scripts)
- **Components**: Arrow function components
- **Hooks**: Custom hooks in `lib/hooks/`, tested in `__tests__/`
- **Styling**: NativeWind (Tailwind for React Native)

```bash
cd mobile
pnpm run lint
pnpm run format
```

## Further Reading

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Environment setup, API endpoints, troubleshooting
- [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) — Infrastructure bootstrap, CI/CD, and Renovate
