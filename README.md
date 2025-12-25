# My Project

> TODO: Replace this with your project description

## Features

- Feature 1
- Feature 2
- Feature 3

## Quick Start

### Prerequisites

- Python 3.14+
- [UV package manager](https://github.com/astral-sh/uv)

### Installation

```bash
# Install UV (if not already installed)
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Clone and set up
git clone https://github.com/YOUR-USERNAME/my-project.git
cd my-project
uv sync --extra dev  # Install all dependencies including dev tools
```

### Running the App

```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows

# Run the application
uv run python app/main.py
```

### Development

```bash
# Install pre-commit hooks
uv run pre-commit install

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app --cov-report=html

# Run linting
uv run ruff check --fix
uv run ruff format
```

## Project Structure

```
├── app/                    # Application code
│   ├── __init__.py
│   └── main.py
├── tests/                  # Test files
│   ├── conftest.py
│   └── test_*.py
├── docs/                   # Documentation
├── .github/
│   ├── workflows/          # CI/CD workflows
│   └── copilot-instructions.md
├── pyproject.toml          # Project configuration
├── renovate.json           # Dependency update configuration
└── README.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
