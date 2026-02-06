"""Tests for api/main.py — health check and root endpoints."""

from fastapi.testclient import TestClient

from api.main import app


class TestHealthCheck:
    """Tests for GET /health."""

    def test_returns_healthy(self) -> None:
        with TestClient(app) as client:
            response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestRoot:
    """Tests for GET /."""

    def test_returns_api_info(self) -> None:
        with TestClient(app) as client:
            response = client.get("/")

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Meal Planner API"
        assert "version" in body
        assert body["docs"] == "/api/docs"
