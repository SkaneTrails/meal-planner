# Development Guide

## Setup

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)

### Installation

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone https://github.com/YOUR-USERNAME/my-project.git
cd my-project
uv sync --extra dev
```

### Pre-commit Hooks

```bash
uv run pre-commit install
```

## Development Workflow

### Running Tests

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=app --cov-report=html

# Specific file
uv run pytest tests/test_main.py -v
```

### Linting

```bash
# Check and fix
uv run ruff check --fix
uv run ruff format

# Check only
uv run ruff check
uv run ruff format --check
```

### Type Checking

```bash
uv run ty check app/
```

## Project Structure

```
├── app/                    # Application code
│   ├── __init__.py
│   └── main.py
├── tests/                  # Test files
│   ├── __init__.py
│   ├── conftest.py        # Shared fixtures
│   └── test_*.py
├── docs/                   # Documentation
├── .github/
│   ├── workflows/         # CI/CD
│   └── copilot-instructions.md
├── pyproject.toml         # Project config
└── renovate.json          # Dependency updates
```

## Adding Dependencies

```bash
# Production dependency
uv add package-name

# Development dependency
uv add --optional dev package-name

# Test dependency
uv add --optional test package-name
```

## Troubleshooting

### Common Issues

**UV not found:**

```bash
# Reload shell or source profile
source ~/.bashrc  # or ~/.zshrc
```

**Pre-commit fails:**

```bash
# Update hooks
uv run pre-commit autoupdate

# Run manually
uv run pre-commit run --all-files
```
