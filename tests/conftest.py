"""Pytest configuration and fixtures."""

import os
from collections.abc import Callable, Generator

from dotenv import load_dotenv

load_dotenv()

# Set test defaults for env vars required by the app.
# In CI (no .env file), these ensure the app can be imported.
# Locally, load_dotenv() above will have already set these from .env.
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8081")
os.environ.setdefault("SCRAPE_FUNCTION_URL", "http://localhost:8001")
os.environ.setdefault("GCS_BUCKET_NAME", "test-bucket")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "test-project")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from api.auth.models import AuthenticatedUser  # noqa: E402
from api.models.recipe import Recipe  # noqa: E402

type TestClientFactory = Callable[..., Generator[TestClient]]


def _create_test_client(
    app: FastAPI,
    *,
    uid: str = "test_user",
    email: str = "test@example.com",
    household_id: str | None = "test_household",
    role: str = "member",
) -> Generator[TestClient]:
    """Create a TestClient with mocked Firebase auth."""
    from api.auth.firebase import require_auth

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(uid=uid, email=email, household_id=household_id, role=role)

    app.dependency_overrides[require_auth] = mock_auth
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def create_test_client() -> TestClientFactory:
    """Factory fixture for creating TestClients with mocked Firebase auth.

    Usage in per-file fixtures::

        @pytest.fixture
        def client(create_test_client) -> Generator[TestClient]:
            yield from create_test_client(app)

        @pytest.fixture
        def superuser_client(create_test_client) -> Generator[TestClient]:
            yield from create_test_client(app, role="superuser")
    """
    return _create_test_client


@pytest.fixture
def sample_recipe() -> Recipe:
    """Provide a sample recipe for tests."""
    return Recipe(
        id="test_carbonara_123",
        title="Spaghetti Carbonara",
        url="https://example.com/carbonara",
        ingredients=[
            "400g spaghetti",
            "200g guanciale or pancetta",
            "4 egg yolks",
            "100g pecorino romano",
            "Black pepper",
        ],
        instructions=[
            "Cook pasta in salted water until al dente",
            "Fry guanciale until crispy",
            "Mix egg yolks with pecorino",
            "Combine pasta with guanciale, remove from heat",
            "Add egg mixture and toss quickly",
            "Season with black pepper and serve",
        ],
        image_url="https://example.com/carbonara.jpg",
        servings=4,
        prep_time=10,
        cook_time=20,
    )


@pytest.fixture
def sample_ingredients() -> list[str]:
    """Provide sample ingredients for tests."""
    return ["2 cups flour", "1 cup sugar", "3 eggs", "1/2 cup butter", "1 tsp vanilla extract"]
