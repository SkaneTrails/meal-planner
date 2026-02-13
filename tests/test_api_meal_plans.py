"""Tests for api/routers/meal_plans.py."""

from collections.abc import Generator
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.routers.meal_plans import router

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


@pytest.fixture
def client_regular_no_household() -> Generator[TestClient]:
    """Create test client with mocked auth (regular user without household)."""
    from api.auth.firebase import require_auth

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(uid="orphan", email="orphan@example.com", household_id=None, role="member")

    app.dependency_overrides[require_auth] = mock_auth

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


class TestGetMealPlan:
    """Tests for GET /meal-plans endpoint."""

    def test_get_empty_meal_plan(self, client: TestClient) -> None:
        """Should return empty meal plan for new household."""
        with patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])):
            response = client.get("/meal-plans")

        assert response.status_code == 200
        data = response.json()
        assert data["household_id"] == "test_household"
        assert data["meals"] == {}
        assert data["notes"] == {}

    def test_get_meal_plan_with_meals(self, client: TestClient) -> None:
        """Should return meal plan with existing meals."""
        meals = {"2025-01-15_lunch": "recipe123", "2025-01-15_dinner": "custom:Pizza"}
        notes = {"2025-01-15": "office day"}
        with patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=(meals, notes, [])):
            response = client.get("/meal-plans")

        assert response.status_code == 200
        data = response.json()
        assert data["meals"]["2025-01-15_lunch"] == "recipe123"
        assert data["meals"]["2025-01-15_dinner"] == "custom:Pizza"
        assert data["notes"]["2025-01-15"] == "office day"

    def test_get_meal_plan_superuser_requires_household_id(self, client_no_household: TestClient) -> None:
        """Superuser without household must specify household_id parameter."""
        response = client_no_household.get("/meal-plans")

        assert response.status_code == 400
        assert "household_id" in response.json()["detail"].lower()

    def test_get_meal_plan_superuser_with_household_id(self, client_no_household: TestClient) -> None:
        """Superuser can access any household by specifying household_id."""
        with patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])):
            response = client_no_household.get("/meal-plans?household_id=test-household")

            assert response.status_code == 200
            data = response.json()
            assert data["household_id"] == "test-household"

    def test_get_meal_plan_regular_user_no_household(self, client_regular_no_household: TestClient) -> None:
        """Regular user without household gets 403."""
        response = client_regular_no_household.get("/meal-plans")

        assert response.status_code == 403
        assert "household" in response.json()["detail"].lower()


class TestUpdateMealPlan:
    """Tests for PUT /meal-plans endpoint."""

    def test_update_add_meal(self, client: TestClient) -> None:
        """Should add a new meal to the plan."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_meal") as mock_update,
            patch(
                "api.routers.meal_plans.meal_plan_storage.load_meal_plan",
                return_value=({"2025-01-15_lunch": "recipe123"}, {}, []),
            ),
        ):
            response = client.put("/meal-plans", json={"meals": {"2025-01-15_lunch": "recipe123"}, "notes": {}})

        assert response.status_code == 200
        mock_update.assert_called_once_with("test_household", "2025-01-15", "lunch", "recipe123")

    def test_update_delete_meal(self, client: TestClient) -> None:
        """Should delete meal when value is None."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.delete_meal") as mock_delete,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])),
        ):
            response = client.put("/meal-plans", json={"meals": {"2025-01-15_lunch": None}, "notes": {}})

        assert response.status_code == 200
        mock_delete.assert_called_once_with("test_household", "2025-01-15", "lunch")

    def test_update_invalid_key_format(self, client: TestClient) -> None:
        """Should return 400 for invalid meal key format."""
        response = client.put("/meal-plans", json={"meals": {"invalidkeyformat": "recipe123"}, "notes": {}})

        assert response.status_code == 400
        assert "Invalid meal key format" in response.json()["detail"]

    def test_update_note(self, client: TestClient) -> None:
        """Should update day note."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_day_note") as mock_note,
            patch(
                "api.routers.meal_plans.meal_plan_storage.load_meal_plan",
                return_value=({}, {"2025-01-15": "work from home"}, []),
            ),
        ):
            response = client.put("/meal-plans", json={"meals": {}, "notes": {"2025-01-15": "work from home"}})

        assert response.status_code == 200
        mock_note.assert_called_once_with("test_household", "2025-01-15", "work from home")


class TestUpdateSingleMeal:
    """Tests for POST /meal-plans/meals endpoint."""

    def test_update_single_meal(self, client: TestClient) -> None:
        """Should update a single meal."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_meal") as mock_update,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])),
        ):
            response = client.post(
                "/meal-plans/meals", json={"date": "2025-01-15", "meal_type": "dinner", "value": "recipe456"}
            )

        assert response.status_code == 200
        mock_update.assert_called_once_with("test_household", "2025-01-15", "dinner", "recipe456")

    def test_delete_single_meal(self, client: TestClient) -> None:
        """Should delete meal when value is None."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.delete_meal") as mock_delete,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])),
        ):
            response = client.post(
                "/meal-plans/meals", json={"date": "2025-01-15", "meal_type": "dinner", "value": None}
            )

        assert response.status_code == 200
        mock_delete.assert_called_once_with("test_household", "2025-01-15", "dinner")


class TestUpdateSingleNote:
    """Tests for POST /meal-plans/notes endpoint."""

    def test_update_single_note(self, client: TestClient) -> None:
        """Should update a single note."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_day_note") as mock_note,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])),
        ):
            response = client.post("/meal-plans/notes", json={"date": "2025-01-15", "note": "busy day"})

        assert response.status_code == 200
        mock_note.assert_called_once_with("test_household", "2025-01-15", "busy day")


class TestClearMealPlan:
    """Tests for DELETE /meal-plans endpoint."""

    def test_clear_meal_plan(self, client: TestClient) -> None:
        """Should clear all meals and notes."""
        with patch("api.routers.meal_plans.meal_plan_storage.save_meal_plan") as mock_save:
            response = client.delete("/meal-plans")

        assert response.status_code == 204
        mock_save.assert_called_once_with("test_household", {}, {}, [])


class TestUpdateExtras:
    """Tests for POST /meal-plans/extras endpoint."""

    def test_update_extras(self, client: TestClient) -> None:
        """Should update extras list."""
        extras = ["recipe1", "recipe2"]
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_extras") as mock_update,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, extras)),
        ):
            response = client.post("/meal-plans/extras", json={"extras": extras})

        assert response.status_code == 200
        mock_update.assert_called_once_with("test_household", extras)
        data = response.json()
        assert data["extras"] == extras

    def test_update_extras_empty_list(self, client: TestClient) -> None:
        """Should allow empty extras list."""
        with (
            patch("api.routers.meal_plans.meal_plan_storage.update_extras") as mock_update,
            patch("api.routers.meal_plans.meal_plan_storage.load_meal_plan", return_value=({}, {}, [])),
        ):
            response = client.post("/meal-plans/extras", json={"extras": []})

        assert response.status_code == 200
        mock_update.assert_called_once_with("test_household", [])
