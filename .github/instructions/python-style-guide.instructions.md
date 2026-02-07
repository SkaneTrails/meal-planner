---
applyTo: "**/*.py"
---

# Python Style Guide

## Core Principles

Write code that is self-documenting, maintainable, and follows modern Python best practices. Prioritize readability and explicitness over cleverness.

## File Organization

### Size Limits

- **Maximum 500 lines per module**
- **Maximum 50 lines per function/method**
- When approaching limits, extract related functionality into separate modules
- Split large modules by logical domain boundaries (models, services, utilities)

### Module Structure

```python
"""Module docstring explaining purpose."""

# 1. Standard library imports
from typing import Any
import json

# 2. Third-party imports
from pydantic import BaseModel
from google.cloud import firestore

# 3. Local imports
from api.models import Recipe
from api.services import parser

# 4. Constants
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# 5. Classes and functions
class RecipeService:
    ...

def parse_ingredients(text: str) -> list[str]:
    ...
```

### When to Split Files

- Multiple unrelated classes in one file → separate by class
- Helper functions >100 lines total → extract to `utils.py` or domain-specific module
- Mixed concerns (models + business logic) → separate into `models/` and `services/`
- Deeply nested packages → keep to 2-3 levels maximum

## Code Structure

### Type Hints

- **Required on all function signatures** (parameters and return types)
- Use modern syntax: `list[str]` not `List[str]`, `dict[str, Any]` not `Dict[str, Any]`
- For complex types, use type aliases:

```python
RecipeDict = dict[str, Any]
IngredientList = list[str]

def parse_recipe(data: RecipeDict) -> IngredientList:
    ...
```

### Dataclasses Over Dictionaries

- Use `@dataclass` for structured data
- Use `field(default_factory=list)` for mutable defaults
- Add computed properties with `@property` decorator

```python
from dataclasses import dataclass, field

@dataclass
class Recipe:
    title: str
    ingredients: list[str] = field(default_factory=list)
    servings: int = 4

    @property
    def ingredient_count(self) -> int:
        return len(self.ingredients)
```

### Functions

- **Single responsibility** - one function does one thing
- **Maximum 50 lines** - extract helper functions if longer
- **Avoid side effects** - pure functions where possible
- **Early returns** for guard clauses:

```python
def process_recipe(recipe_id: str | None) -> Recipe | None:
    if recipe_id is None:
        return None

    if not recipe_id.isdigit():
        return None

    # Main logic here
    return fetch_recipe(recipe_id)
```

### Error Handling

- **Explicit exception types** - catch specific exceptions, not bare `except:`
- **Fail fast** - validate inputs early, raise exceptions for invalid state
- **Let exceptions propagate** unless you can meaningfully handle them
- Use custom exceptions for domain errors:

```python
class RecipeNotFoundError(Exception):
    """Raised when recipe doesn't exist in database."""
    pass

def get_recipe(recipe_id: str) -> Recipe:
    recipe = db.get(recipe_id)
    if recipe is None:
        raise RecipeNotFoundError(f"Recipe {recipe_id} not found")
    return recipe
```

### Async/Await

- Default to **sync** unless I/O-bound operations require async
- When using async, be consistent - don't mix sync and async in same module
- Use `asyncio.gather()` for parallel async operations
- Mark async functions clearly: `async def fetch_recipe(...)`

## Naming Conventions

- **Modules**: `snake_case.py` (e.g., `recipe_parser.py`)
- **Classes**: `PascalCase` (e.g., `RecipeService`)
- **Functions/variables**: `snake_case` (e.g., `parse_ingredients`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Private members**: `_leading_underscore` (e.g., `_internal_helper`)
- **Boolean variables**: Use verb prefixes (`is_valid`, `has_image`, `can_edit`)

## Documentation

### Docstrings

- **Google style** for consistency
- **Required for**:
  - Public classes (purpose, attributes)
  - Public functions (what it does, args, returns, raises)
  - Modules (top-level purpose)
- **Not required for**:
  - Private functions (if name is self-explanatory)
  - Simple property getters
  - Dataclass fields (use inline type comments if needed)

```python
def parse_ingredients(text: str, servings: int = 4) -> list[str]:
    """Parse ingredient text into structured list.

    Args:
        text: Raw ingredient text from recipe
        servings: Number of servings to scale for

    Returns:
        List of parsed ingredient strings

    Raises:
        ValueError: If text is empty or servings < 1
    """
    ...
```

### Comments

- **Avoid inline comments** - code should be self-documenting
- **When necessary**: Explain _why_, not _what_
- **Acceptable use cases**:
  - Non-obvious algorithmic choices
  - Workarounds for external API quirks
  - TODO markers (with ticket reference): `# TODO(#123): Fix edge case`

## Testing

### Test File Organization

- Mirror source structure: `api/services/parser.py` → `tests/test_parser.py`
- Group related tests in classes: `class TestIngredientParser:`
- Test file naming: `test_*.py`

### Test Structure

- **Arrange-Act-Assert** pattern
- **One assertion per test** (where practical)
- **Descriptive names**: `test_parse_ingredients_with_fractions_converts_to_decimal`
- **Use fixtures** for common setup (pytest fixtures)
- **Mock external services** - never call real APIs in tests

```python
def test_parse_ingredients_handles_empty_input():
    """Should return empty list when given empty string."""
    result = parse_ingredients("")
    assert result == []

def test_parse_ingredients_extracts_quantities():
    """Should extract numeric quantities from ingredient text."""
    result = parse_ingredients("2 cups flour")
    assert result[0].quantity == 2
    assert result[0].unit == "cups"
```

## Code Smells to Avoid

- **Long parameter lists** (>4 params) → use dataclass or kwargs dict
- **Deeply nested conditionals** (>3 levels) → extract to helper functions
- **Duplicate code blocks** (>10 lines) → extract to shared function
- **God classes** (>300 lines) → split by responsibility
- **Magic numbers** → extract to named constants
- **Mutable default arguments** → use `None` and assign inside function
- **Global state** → use dependency injection or explicit parameters

## Separation of Concerns

### Models (`models/`)

- Data structures only (dataclasses, Pydantic models)
- No business logic
- Validation rules (via Pydantic validators)

### Services (`services/`)

- Business logic and orchestration
- Interact with external APIs, databases
- Return models, raise domain exceptions

### Routers (`routers/`)

- HTTP request/response handling
- Input validation (basic)
- Call services, return JSON

### Storage (`storage/`)

- Database operations only
- CRUD operations on Firestore/database
- Return models or None

## Dependencies

- **Minimize external dependencies** - prefer standard library when sufficient
- **Pin versions** in `pyproject.toml`
- **Group by purpose** (dev, test, production)
- **Document why** - add comment for non-obvious dependencies

## Refactoring Triggers

When you encounter these patterns, refactor immediately:

- Function exceeds 50 lines → extract helpers
- Module exceeds 500 lines → split by domain
- Duplicate logic in 3+ places → create shared function
- Class has >10 methods → split into multiple classes
- Conditional complexity >3 levels → extract to functions
- Test setup >20 lines → create fixture or factory

## Pre-Commit Checklist

- [ ] Ruff passes: `uv run ruff check`
- [ ] Tests pass: `uv run pytest --cov=api`
- [ ] Type hints on all new functions
- [ ] Docstrings on all public functions/classes
- [ ] No magic numbers (extract to constants)
- [ ] No duplicate code blocks >10 lines
- [ ] File size <500 lines
- [ ] Function size <50 lines
