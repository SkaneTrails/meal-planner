"""Tests for grocery list state endpoints (GET/PUT/PATCH/DELETE /grocery/state)."""

from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.routers.grocery import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client() -> TestClient:
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
def client_no_household() -> TestClient:
    """Create test client with mocked auth (no household)."""
    from api.auth.firebase import require_auth

    async def mock_auth() -> AuthenticatedUser:
        return AuthenticatedUser(uid="superuser", email="super@example.com", household_id=None, role="superuser")

    app.dependency_overrides[require_auth] = mock_auth
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestGetGroceryState:
    """Tests for GET /grocery/state."""

    def test_returns_empty_state_when_none_exists(self, client: TestClient) -> None:
        """Should return empty default state when no state saved yet."""
        with patch("api.routers.grocery.grocery_list_storage.load_grocery_state", return_value=None):
            response = client.get("/grocery/state")

        assert response.status_code == 200
        data = response.json()
        assert data["selected_meals"] == []
        assert data["meal_servings"] == {}
        assert data["checked_items"] == []
        assert data["custom_items"] == []

    def test_returns_saved_state(self, client: TestClient) -> None:
        """Should return previously saved state."""
        saved = {
            "selected_meals": ["2026-02-10_lunch", "2026-02-11_dinner"],
            "meal_servings": {"2026-02-10_lunch": 4},
            "checked_items": ["tomatoes"],
            "custom_items": [{"name": "Paper towels", "category": "other"}],
            "updated_at": "2026-02-10T12:00:00",
            "created_by": "test@example.com",
        }
        with patch("api.routers.grocery.grocery_list_storage.load_grocery_state", return_value=saved):
            response = client.get("/grocery/state")

        assert response.status_code == 200
        data = response.json()
        assert data["selected_meals"] == ["2026-02-10_lunch", "2026-02-11_dinner"]
        assert data["meal_servings"] == {"2026-02-10_lunch": 4}
        assert data["checked_items"] == ["tomatoes"]
        assert len(data["custom_items"]) == 1
        assert data["custom_items"][0]["name"] == "Paper towels"

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.get("/grocery/state")
        assert response.status_code == 403


class TestSaveGroceryState:
    """Tests for PUT /grocery/state."""

    def test_saves_full_state(self, client: TestClient) -> None:
        """Should save and return the full grocery state."""
        body = {
            "selected_meals": ["2026-02-10_lunch"],
            "meal_servings": {"2026-02-10_lunch": 2},
            "checked_items": ["flour"],
            "custom_items": [{"name": "Napkins", "category": "other"}],
        }
        saved = {**body, "custom_items": [{"name": "Napkins", "category": "other"}], "updated_at": None}

        with patch("api.routers.grocery.grocery_list_storage.save_grocery_state", return_value=saved) as mock_save:
            response = client.put("/grocery/state", json=body)

        assert response.status_code == 200
        mock_save.assert_called_once_with(
            "test_household",
            selected_meals=["2026-02-10_lunch"],
            meal_servings={"2026-02-10_lunch": 2},
            checked_items=["flour"],
            custom_items=[{"name": "Napkins", "category": "other"}],
            created_by="test@example.com",
        )

    def test_saves_empty_state(self, client: TestClient) -> None:
        """Should accept empty lists."""
        body = {"selected_meals": [], "meal_servings": {}, "checked_items": [], "custom_items": []}
        saved = {**body, "updated_at": None}

        with patch("api.routers.grocery.grocery_list_storage.save_grocery_state", return_value=saved):
            response = client.put("/grocery/state", json=body)

        assert response.status_code == 200
        data = response.json()
        assert data["selected_meals"] == []

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.put("/grocery/state", json={"selected_meals": []})
        assert response.status_code == 403


class TestPatchGroceryState:
    """Tests for PATCH /grocery/state."""

    def test_patches_checked_items(self, client: TestClient) -> None:
        """Should merge checked items into existing state."""
        result = {
            "selected_meals": ["2026-02-10_lunch"],
            "meal_servings": {},
            "checked_items": ["eggs", "milk"],
            "custom_items": [],
            "updated_at": None,
        }
        with patch("api.routers.grocery.grocery_list_storage.update_grocery_state", return_value=result):
            response = client.patch("/grocery/state", json={"checked_items": ["eggs", "milk"]})

        assert response.status_code == 200
        data = response.json()
        assert data["checked_items"] == ["eggs", "milk"]

    def test_patches_custom_items(self, client: TestClient) -> None:
        """Should update custom items."""
        result = {
            "selected_meals": [],
            "meal_servings": {},
            "checked_items": [],
            "custom_items": [{"name": "Sponges", "category": "other"}],
            "updated_at": None,
        }
        with patch("api.routers.grocery.grocery_list_storage.update_grocery_state", return_value=result):
            response = client.patch("/grocery/state", json={"custom_items": [{"name": "Sponges", "category": "other"}]})

        assert response.status_code == 200
        assert response.json()["custom_items"][0]["name"] == "Sponges"

    def test_creates_state_if_none_exists(self, client: TestClient) -> None:
        """Should create a new state when patch finds no existing state."""
        saved = {
            "selected_meals": [],
            "meal_servings": {},
            "checked_items": ["butter"],
            "custom_items": [],
            "updated_at": None,
        }
        with (
            patch("api.routers.grocery.grocery_list_storage.update_grocery_state", return_value=None),
            patch("api.routers.grocery.grocery_list_storage.save_grocery_state", return_value=saved),
        ):
            response = client.patch("/grocery/state", json={"checked_items": ["butter"]})

        assert response.status_code == 200
        assert response.json()["checked_items"] == ["butter"]

    def test_rejects_empty_patch(self, client: TestClient) -> None:
        """Should return 400 when no fields provided."""
        response = client.patch("/grocery/state", json={})
        assert response.status_code == 400
        assert "No fields to update" in response.json()["detail"]

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.patch("/grocery/state", json={"checked_items": []})
        assert response.status_code == 403


class TestClearGroceryState:
    """Tests for DELETE /grocery/state."""

    def test_clears_state(self, client: TestClient) -> None:
        """Should delete the grocery state."""
        with patch("api.routers.grocery.grocery_list_storage.delete_grocery_state", return_value=True):
            response = client.delete("/grocery/state")

        assert response.status_code == 204

    def test_clears_nonexistent_state(self, client: TestClient) -> None:
        """Should succeed even if no state existed."""
        with patch("api.routers.grocery.grocery_list_storage.delete_grocery_state", return_value=False):
            response = client.delete("/grocery/state")

        assert response.status_code == 204

    def test_requires_household(self, client_no_household: TestClient) -> None:
        """Should return 403 if user has no household."""
        response = client_no_household.delete("/grocery/state")
        assert response.status_code == 403
