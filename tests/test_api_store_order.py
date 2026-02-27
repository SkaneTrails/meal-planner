"""Tests for store order learning endpoints (GET/POST /grocery/stores/{id}/...)."""

from collections.abc import Generator
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routers.grocery import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client(create_test_client) -> Generator[TestClient]:
    """Create test client with mocked auth (user with household)."""
    yield from create_test_client(app)


@pytest.fixture
def client_no_household(create_test_client) -> Generator[TestClient]:
    """Create test client with mocked auth (no household)."""
    yield from create_test_client(app, uid="superuser", email="super@example.com", household_id=None, role="superuser")


class TestGetStoreOrder:
    """Tests for GET /grocery/stores/{store_id}/order."""

    def test_returns_empty_when_no_order_exists(self, client: TestClient) -> None:
        with patch("api.routers.grocery.get_store_order", return_value=[]):
            response = client.get("/grocery/stores/store_1/order")

        assert response.status_code == 200
        assert response.json()["item_order"] == []

    def test_returns_saved_order(self, client: TestClient) -> None:
        with patch("api.routers.grocery.get_store_order", return_value=["bread", "milk", "cheese"]):
            response = client.get("/grocery/stores/store_1/order")

        assert response.status_code == 200
        assert response.json()["item_order"] == ["bread", "milk", "cheese"]

    def test_requires_household(self, client_no_household: TestClient) -> None:
        response = client_no_household.get("/grocery/stores/store_1/order")
        assert response.status_code == 403


class TestLearnStoreOrder:
    """Tests for POST /grocery/stores/{store_id}/learn."""

    def test_updates_when_out_of_order(self, client: TestClient) -> None:
        """Items ticked out of DB order trigger a reorder and save."""
        with (
            patch("api.routers.grocery.get_store_order", return_value=["A", "B", "C", "D", "E"]),
            patch("api.routers.grocery.save_store_order") as mock_save,
        ):
            response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["A", "E", "C"]})

        assert response.status_code == 200
        data = response.json()
        assert data["updated"] is True
        assert data["item_order"] == ["A", "B", "E", "C", "D"]
        mock_save.assert_called_once_with("test_household", "store_1", ["A", "B", "E", "C", "D"])

    def test_skips_write_when_already_in_order(self, client: TestClient) -> None:
        """No Firestore write when items are already in correct order."""
        with (
            patch("api.routers.grocery.get_store_order", return_value=["A", "B", "C", "D", "E"]),
            patch("api.routers.grocery.save_store_order") as mock_save,
        ):
            response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["A", "C", "E"]})

        assert response.status_code == 200
        data = response.json()
        assert data["updated"] is False
        assert data["item_order"] == ["A", "B", "C", "D", "E"]
        mock_save.assert_not_called()

    def test_appends_new_items_even_when_in_order(self, client: TestClient) -> None:
        """New items get appended even if known items are in order."""
        with (
            patch("api.routers.grocery.get_store_order", return_value=["A", "B"]),
            patch("api.routers.grocery.save_store_order") as mock_save,
        ):
            response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["A", "X", "B", "Y"]})

        assert response.status_code == 200
        data = response.json()
        assert data["updated"] is True
        assert data["item_order"] == ["A", "B", "X", "Y"]
        mock_save.assert_called_once()

    def test_first_trip_with_empty_db(self, client: TestClient) -> None:
        """First shopping trip creates the initial order."""
        with (
            patch("api.routers.grocery.get_store_order", return_value=[]),
            patch("api.routers.grocery.save_store_order") as mock_save,
        ):
            response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["milk", "bread", "cheese"]})

        assert response.status_code == 200
        data = response.json()
        assert data["updated"] is True
        assert data["item_order"] == ["milk", "bread", "cheese"]
        mock_save.assert_called_once()

    def test_requires_household(self, client_no_household: TestClient) -> None:
        response = client_no_household.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["A", "B"]})
        assert response.status_code == 403

    def test_rejects_single_item_tick_sequence(self, client: TestClient) -> None:
        """Tick sequence must have at least 2 items to learn anything."""
        response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["A"]})
        assert response.status_code == 422

    def test_rejects_empty_tick_sequence(self, client: TestClient) -> None:
        response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": []})
        assert response.status_code == 422

    def test_drag_override_two_items(self, client: TestClient) -> None:
        """Manual drag sends a 2-item tick sequence to reorder."""
        with (
            patch("api.routers.grocery.get_store_order", return_value=["A", "B", "C", "D", "E"]),
            patch("api.routers.grocery.save_store_order") as mock_save,
        ):
            response = client.post("/grocery/stores/store_1/learn", json={"tick_sequence": ["D", "B"]})

        assert response.status_code == 200
        data = response.json()
        assert data["updated"] is True
        assert data["item_order"] == ["A", "D", "B", "C", "E"]
        mock_save.assert_called_once()
