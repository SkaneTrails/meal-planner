# Project Name - AI Coding Agent Instructions

## Important: Collaboration Guidelines

You are collaborating with a human who may make changes between your edits:

- **Always re-verify** file contents before making changes - don't assume previous state
- **If your previous changes are gone**, do not re-add them without checking with the user first
- **Read before editing** - the human may have modified, moved, or intentionally removed content
- **Verify suggestions** - when given review comments or suggestions, verify they are correct against actual code before applying
- **Compare alternatives** - when the user suggests a different approach, analyze both options and explain the tradeoffs
- **Troubleshoot step-by-step** - when debugging, suggest one fix at a time and wait for results
- **Plan before large changes** - for complex changes (3+ files), propose a high-level plan first
- **Never work directly on main** - Always create a feature branch for changes

## Keeping Instructions Current

When reviewing PRs, check if changes affect this documentation:

- New/renamed/removed workflows in `.github/workflows/`
- Changes to code style tools (ruff, pre-commit hooks, etc.)
- New dependencies or architectural patterns
- Changes to testing patterns or conventions

If any of these change, suggest updating `.github/copilot-instructions.md` in your review.

## Project Overview

<!-- TODO: Add project description -->

A Python project using modern tooling and best practices.

## Development Workflows

### Running the App

```bash
# Using UV (recommended)
uv sync                          # Install dependencies
uv run python app/main.py        # Run the application

# Or activate venv first
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate          # Windows
python app/main.py
```

### Code Quality Tools

- **Package manager**: UV (Astral's fast Python package manager)
  - Run: `uv sync` to install dependencies, `uv add <package>` to add new ones
- **Linter/Formatter**: Ruff (configured in `pyproject.toml`)
  - Line length: 120 characters
  - Target: Python 3.14
  - Run: `uv run ruff check --fix` or via pre-commit hooks
- **Pre-commit hooks**: `.pre-commit-config.yaml` enforces formatting on commit
  - Install: `uv run pre-commit install`
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`, `deps:`, `perf:`

### Python Environment

- Requires Python 3.14+
- **Package manager**: UV
  - `pyproject.toml` defines dependencies with optional groups: test, dev
  - `uv.lock` ensures reproducible installs
- **Testing**: pytest with coverage
  - Run: `uv run pytest --cov=app`
  - Test fixtures in `tests/conftest.py`
  - Tests run in parallel with `pytest-xdist` (`-n auto`)

## Code Style

See `pyproject.toml` for tool configurations.

- **Ruff** for linting/formatting
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`, `deps:`, `perf:`
- Test files must match `test_*.py` pattern
- **Self-documenting code**: Avoid inline comments - code should be readable without them
- **Test coverage**: All new methods and modified functions must have corresponding tests

## Test-Driven Development (TDD)

**Strongly prefer TDD when implementing new features or modules.**

### When to Use TDD

- **New modules or classes** - Write tests first to define the interface
- **New functions with complex logic** - Test edge cases before implementation
- **Bug fixes** - Write a failing test that reproduces the bug, then fix it
- **Refactoring** - Ensure tests pass before and after refactoring

### TDD Workflow

1. **Write a failing test** - Define expected behavior
2. **Implement minimal code** - Just enough to make the test pass
3. **Refactor** - Clean up code while keeping tests green
4. **Repeat** - Add more tests for edge cases

### Test Organization

```python
class TestMyFeature:
    """Tests for MyFeature functionality."""

    def test_happy_path(self, mock_dependency):
        """Test the main success scenario."""
        # Arrange - set up test data
        # Act - call the function
        # Assert - verify results
        pass

    def test_edge_case_empty_input(self):
        """Test behavior with empty input."""
        pass

    def test_error_handling(self, mock_dependency):
        """Test proper error handling."""
        with pytest.raises(ValueError, match="Expected error message"):
            pass
```

### Running Tests

```bash
# Run all tests with coverage
uv run pytest -n=auto --cov=app --cov-report=term-missing

# Run specific test file
uv run pytest tests/test_my_feature.py -v

# Run specific test class or method
uv run pytest tests/test_my_feature.py::TestMyFeature::test_happy_path -v
```

## Code Quality Principles

### Warnings and Errors

- **NEVER suppress or filter warnings** - Always fix the root cause
- Warnings exist to prevent bugs and compatibility issues
- If a test emits a warning, investigate and fix the underlying problem
- Pytest is configured with `-W error` to treat all warnings as test failures

### Testing Philosophy

- Warnings treated as errors ensure code quality
- Fix issues at their source, not with configuration bandaids
- Test coverage targets 70%+ for business logic
- Exception paths must be tested

## When Making Changes

### Adding New Features

1. Create feature branch: `git checkout -b feat/feature-name`
2. Write tests first (TDD)
3. Implement the feature
4. Run tests and linting: `uv run pytest && uv run ruff check`
5. Commit with conventional commit message
6. Push and create PR

### Modifying Existing Code

- Test with existing test suite first
- Update tests if behavior changes
- Verify backward compatibility if applicable

### Common Gotchas

- **Session state**: Be aware of state management patterns in your framework
- **File paths**: Use `pathlib.Path` for cross-platform compatibility
- **Environment variables**: Never commit secrets; use `.env` files (gitignored)
