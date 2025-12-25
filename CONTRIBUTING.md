# Contributing

Thank you for your interest in contributing! This document explains how to contribute to the project.

## Getting Started

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)
- Git

### Setup

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/my-project.git
cd my-project

# Install dependencies
uv sync

# Install pre-commit hooks
uv run pre-commit install
```

## Making Changes

### 1. Create a Feature Branch

Always create a new branch from `main`:

```bash
git checkout main
git pull
git checkout -b feat/your-feature-name
```

**Branch naming conventions:**

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `chore/task-description` - Maintenance tasks
- `docs/description` - Documentation changes

### 2. Make Your Changes

- Write clear, self-documenting code
- Add tests for new functionality (aim for 70%+ coverage)
- Update documentation if needed
- Follow the code style guidelines below

### 3. Test Your Changes

```bash
# Run tests
uv run pytest

# Check coverage
uv run pytest --cov=app --cov-report=html

# Run linting
uv run ruff check --fix
uv run ruff format
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]

[optional footer]
```

**Commit types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `chore:` - Maintenance (dependencies, config)
- `refactor:` - Code refactoring (no behavior change)
- `test:` - Adding or updating tests
- `ci:` - CI/CD changes
- `perf:` - Performance improvements

**Examples:**

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve null pointer in data parser"
git commit -m "docs: update installation instructions"
```

### 5. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

Then create a pull request on GitHub.

## Code Style

### Python

- **Formatter**: Ruff (configured in `pyproject.toml`)
- **Line length**: 120 characters
- **Quotes**: Double quotes
- **Imports**: Sorted by isort rules via Ruff

### General Guidelines

- Write self-documenting code with clear variable and function names
- Avoid inline comments unless explaining complex logic
- Keep functions small and focused
- Use type hints where practical

## Testing

- All new code should have tests
- Aim for 70%+ coverage on new modules
- Use pytest fixtures for setup/teardown
- Mock external dependencies

```bash
# Run specific test file
uv run pytest tests/test_my_feature.py -v

# Run with coverage report
uv run pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Ask in pull request comments

Thank you for contributing! 🎉
