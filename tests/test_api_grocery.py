"""Tests for api/routers/grocery.py."""

from collections.abc import Generator
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.models.grocery_list import GroceryCategory
from api.routers.grocery import router
from api.services.grocery_categories import CATEGORY_KEYWORDS

# Create a test app without auth for unit testing
app = FastAPI()
app.include_router(router)


@pytest.fixture
def client() -> Generator[TestClient]:
    """Create test client with mocked auth (user with household)."""
    from api.auth.firebase import require_auth

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(
            uid="test_user", email="test@example.com", household_id="test_household", role="member"
        )

    app.dependency_overrides[require_auth] = mock_auth

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


class TestCategoryKeywords:
    """Tests for category detection."""

    def test_produce_keywords_exist(self) -> None:
        """Should have produce keywords defined."""
        assert GroceryCategory.PRODUCE in CATEGORY_KEYWORDS
        assert "carrot" in CATEGORY_KEYWORDS[GroceryCategory.PRODUCE]
        assert "onion" in CATEGORY_KEYWORDS[GroceryCategory.PRODUCE]
        assert "tomato" in CATEGORY_KEYWORDS[GroceryCategory.PRODUCE]

    def test_dairy_keywords_exist(self) -> None:
        """Should have dairy keywords defined."""
        assert GroceryCategory.DAIRY in CATEGORY_KEYWORDS
        assert "milk" in CATEGORY_KEYWORDS[GroceryCategory.DAIRY]
        assert "cheese" in CATEGORY_KEYWORDS[GroceryCategory.DAIRY]

    def test_meat_seafood_keywords_exist(self) -> None:
        """Should have meat/seafood keywords defined."""
        assert GroceryCategory.MEAT_SEAFOOD in CATEGORY_KEYWORDS
        assert "chicken" in CATEGORY_KEYWORDS[GroceryCategory.MEAT_SEAFOOD]
        assert "salmon" in CATEGORY_KEYWORDS[GroceryCategory.MEAT_SEAFOOD]


@pytest.fixture
def client_no_household() -> Generator[TestClient]:
    """Create test client with mocked auth (superuser without household)."""
    from api.auth.firebase import require_auth

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(uid="superuser", email="super@example.com", household_id=None, role="superuser")

    app.dependency_overrides[require_auth] = mock_auth

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


class TestGenerateGroceryList:
    """Tests for GET /grocery endpoint."""

    def test_generate_empty_meal_plan(self, client: TestClient) -> None:
        """Should return empty list for empty meal plan."""
        with patch("api.routers.grocery.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])):
            response = client.get("/grocery")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.get("/grocery")

        assert response.status_code == 403
        assert "household" in response.json()["detail"].lower()

    def test_generate_with_custom_meals_only(self, client: TestClient) -> None:
        """Should skip custom meals (not recipes)."""
        meals = {"2025-01-15_lunch": "custom:Eating out"}
        with (
            patch("api.routers.grocery.meal_plan_storage.load_meal_plan", return_value=(meals, {}, [])),
            patch("api.routers.grocery._get_today", return_value=date(2025, 1, 15)),
        ):
            response = client.get("/grocery")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_generate_with_recipe(self, client: TestClient) -> None:
        """Should include ingredients from recipes."""
        meals = {"2025-01-15_dinner": "recipe123"}
        mock_recipe = MagicMock()
        mock_recipe.ingredients = ["2 cups flour", "1 egg"]
        mock_recipe.title = "Test Recipe"

        with (
            patch("api.routers.grocery.meal_plan_storage.load_meal_plan", return_value=(meals, {}, [])),
            patch("api.routers.grocery.get_recipes_by_ids", return_value={"recipe123": mock_recipe}),
            patch("api.routers.grocery._get_today", return_value=date(2025, 1, 15)),
        ):
            response = client.get("/grocery")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    def test_generate_merges_duplicate_ingredients(self, client: TestClient) -> None:
        """Should merge same ingredients from different recipes."""
        meals = {"2025-01-15_dinner": "recipe1", "2025-01-16_dinner": "recipe2"}
        mock_recipe1 = MagicMock()
        mock_recipe1.ingredients = ["2 eggs"]
        mock_recipe1.title = "Recipe 1"
        mock_recipe2 = MagicMock()
        mock_recipe2.ingredients = ["3 eggs"]
        mock_recipe2.title = "Recipe 2"

        with (
            patch("api.routers.grocery.meal_plan_storage.load_meal_plan", return_value=(meals, {}, [])),
            patch(
                "api.routers.grocery.get_recipes_by_ids",
                return_value={"recipe1": mock_recipe1, "recipe2": mock_recipe2},
            ),
            patch("api.routers.grocery._get_today", return_value=date(2025, 1, 15)),
        ):
            response = client.get("/grocery")

        assert response.status_code == 200
        data = response.json()
        # Should merge eggs into one item with quantity sources
        egg_items = [i for i in data["items"] if "egg" in i["name"].lower()]
        assert len(egg_items) == 1

    def test_generate_filters_by_date_range(self, client: TestClient) -> None:
        """Should only include meals within date range."""
        meals = {
            "2025-01-15_dinner": "recipe1",  # Within range
            "2025-01-20_dinner": "recipe2",  # Outside range
        }
        mock_recipe = MagicMock()
        mock_recipe.ingredients = ["1 onion"]
        mock_recipe.title = "Test Recipe"

        with (
            patch("api.routers.grocery.meal_plan_storage.load_meal_plan", return_value=(meals, {}, [])),
            patch("api.routers.grocery.get_recipes_by_ids", return_value={"recipe1": mock_recipe}) as mock_batch,
        ):
            response = client.get("/grocery?start_date=2025-01-14&end_date=2025-01-16")

        assert response.status_code == 200
        # Should only request the recipe within date range
        mock_batch.assert_called_once_with({"recipe1"})


class TestDetectCategory:
    """Tests for category detection helper."""

    def test_detect_produce(self) -> None:
        """Should detect produce category."""
        from api.services.grocery_categories import detect_category

        assert detect_category("carrots") == GroceryCategory.PRODUCE
        assert detect_category("fresh tomatoes") == GroceryCategory.PRODUCE

    def test_detect_dairy(self) -> None:
        """Should detect dairy category."""
        from api.services.grocery_categories import detect_category

        assert detect_category("milk") == GroceryCategory.DAIRY
        assert detect_category("cheddar cheese") == GroceryCategory.DAIRY

    def test_detect_other(self) -> None:
        """Should default to OTHER for unknown items."""
        from api.services.grocery_categories import detect_category

        assert detect_category("mystery item xyz") == GroceryCategory.OTHER
