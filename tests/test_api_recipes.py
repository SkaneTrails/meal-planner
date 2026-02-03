"""Tests for api/routers/recipes.py."""

import json
import os
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth.models import AuthenticatedUser
from api.models.recipe import Recipe, RecipeCreate
from api.routers.recipes import router

# Create a test app without auth for unit testing
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
def sample_recipe() -> Recipe:
    """Create a sample recipe for testing."""
    return Recipe(
        id="test123",
        title="Test Carbonara",
        url="https://example.com/carbonara",
        ingredients=["pasta", "eggs", "cheese"],
        instructions=["Cook pasta", "Mix eggs", "Combine"],
    )


@pytest.fixture
def sample_recipe_create() -> RecipeCreate:
    """Create a sample RecipeCreate for testing."""
    return RecipeCreate(
        title="Test Recipe",
        url="https://example.com/recipe",
        ingredients=["flour", "sugar"],
        instructions=["Mix", "Bake"],
    )


class TestListRecipes:
    """Tests for GET /recipes endpoint."""

    def test_returns_empty_list(self, client: TestClient) -> None:
        """Should return empty list when no recipes."""
        with patch("api.routers.recipes.recipe_storage.get_all_recipes", return_value=[]):
            response = client.get("/recipes")

        assert response.status_code == 200
        assert response.json() == []

    def test_returns_recipes(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should return list of recipes."""
        with patch("api.routers.recipes.recipe_storage.get_all_recipes", return_value=[sample_recipe]):
            response = client.get("/recipes")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Carbonara"

    def test_search_parameter(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should filter by search parameter."""
        with patch("api.routers.recipes.recipe_storage.search_recipes", return_value=[sample_recipe]) as mock_search:
            response = client.get("/recipes?search=carbonara")

        assert response.status_code == 200
        mock_search.assert_called_once()

    def test_enhanced_parameter(self, client: TestClient) -> None:
        """Should use enhanced database when enhanced=true."""
        with patch("api.routers.recipes.recipe_storage.get_all_recipes", return_value=[]) as mock_get:
            response = client.get("/recipes?enhanced=true")

        assert response.status_code == 200
        mock_get.assert_called_once_with(
            include_duplicates=False, database="meal-planner", household_id="test_household"
        )


class TestGetRecipe:
    """Tests for GET /recipes/{recipe_id} endpoint."""

    def test_returns_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should return recipe when found."""
        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=sample_recipe):
            response = client.get("/recipes/test123")

        assert response.status_code == 200
        assert response.json()["title"] == "Test Carbonara"

    def test_returns_404_when_not_found(self, client: TestClient) -> None:
        """Should return 404 when recipe not found."""
        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=None):
            response = client.get("/recipes/nonexistent")

        assert response.status_code == 404

    def test_uses_enhanced_database(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should use enhanced database when enhanced=true."""
        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=sample_recipe) as mock_get:
            client.get("/recipes/test123?enhanced=true")

        mock_get.assert_called_once_with("test123", database="meal-planner")


class TestCreateRecipe:
    """Tests for POST /recipes endpoint."""

    def test_creates_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should create and return new recipe."""
        with patch("api.routers.recipes.recipe_storage.save_recipe", return_value=sample_recipe):
            response = client.post(
                "/recipes",
                json={
                    "title": "Test Recipe",
                    "url": "https://example.com/recipe",
                    "ingredients": [],
                    "instructions": [],
                },
            )

        assert response.status_code == 201
        assert response.json()["id"] == "test123"


class TestScrapeRecipe:
    """Tests for POST /recipes/scrape endpoint."""

    def test_returns_409_when_recipe_exists(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should return 409 when recipe URL already exists."""
        with patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=sample_recipe):
            response = client.post("/recipes/scrape", json={"url": "https://example.com/existing"})

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]["message"]

    def test_scrapes_and_saves_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should scrape recipe and save it."""
        scraped_data = {
            "title": "Scraped Recipe",
            "url": "https://example.com/new",
            "ingredients": ["flour"],
            "instructions": ["Mix"],
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = scraped_data
        mock_response.raise_for_status = MagicMock()

        with (
            patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=None),
            patch("api.routers.recipes.httpx.AsyncClient") as mock_client_class,
            patch("api.routers.recipes.recipe_storage.save_recipe", return_value=sample_recipe),
        ):
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            response = client.post("/recipes/scrape", json={"url": "https://example.com/new"})

        assert response.status_code == 201

    def test_returns_422_on_scrape_failure(self, client: TestClient) -> None:
        """Should return 422 when scraping fails."""
        mock_response = MagicMock()
        mock_response.status_code = 422

        with (
            patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=None),
            patch("api.routers.recipes.httpx.AsyncClient") as mock_client_class,
        ):
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            response = client.post("/recipes/scrape", json={"url": "https://example.com/bad"})

        assert response.status_code == 422

    def test_enhance_parameter_enhances_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should enhance recipe when enhance=true."""
        scraped_data = {
            "title": "Scraped Recipe",
            "url": "https://example.com/new",
            "ingredients": ["flour"],
            "instructions": ["Mix"],
        }

        enhanced_data = {
            "title": "Enhanced Recipe",
            "ingredients": ["200g Flour"],
            "instructions": ["Mix well"],
            "changes_made": ["Added weight to flour"],
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = scraped_data
        mock_response.raise_for_status = MagicMock()

        saved_recipe = Recipe(id="test123", title="Scraped Recipe", url="https://example.com/new")
        enhanced_recipe = Recipe(
            id="test123",
            title="Enhanced Recipe",
            url="https://example.com/new",
            improved=True,
            changes_made=["Added weight to flour"],
        )

        with (
            patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=None),
            patch("api.routers.recipes.httpx.AsyncClient") as mock_client_class,
            patch("api.routers.recipes.recipe_storage.save_recipe") as mock_save,
            patch.dict(os.environ, {"ENABLE_RECIPE_ENHANCEMENT": "true"}),
            patch("api.services.recipe_enhancer.is_enhancement_enabled", return_value=True),
            patch("api.services.recipe_enhancer.get_genai_client") as mock_genai,
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="prompt"),
        ):
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            # First call saves original, second saves enhanced
            mock_save.side_effect = [saved_recipe, enhanced_recipe]

            # Mock Gemini response
            mock_genai_client = MagicMock()
            mock_gemini_response = MagicMock()
            mock_gemini_response.text = json.dumps(enhanced_data)
            mock_genai_client.models.generate_content.return_value = mock_gemini_response
            mock_genai.return_value = mock_genai_client

            response = client.post("/recipes/scrape?enhance=true", json={"url": "https://example.com/new"})

        assert response.status_code == 201
        data = response.json()
        assert data["improved"] is True

    def test_enhancement_failure_returns_unenhanced(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should return unenhanced recipe if enhancement fails."""
        scraped_data = {
            "title": "Scraped Recipe",
            "url": "https://example.com/new",
            "ingredients": ["flour"],
            "instructions": ["Mix"],
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = scraped_data
        mock_response.raise_for_status = MagicMock()

        from api.services.recipe_enhancer import EnhancementError

        with (
            patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=None),
            patch("api.routers.recipes.httpx.AsyncClient") as mock_client_class,
            patch("api.routers.recipes.recipe_storage.save_recipe", return_value=sample_recipe),
            patch.dict(os.environ, {"ENABLE_RECIPE_ENHANCEMENT": "true"}),
            patch("api.services.recipe_enhancer.is_enhancement_enabled", return_value=True),
            patch("api.services.recipe_enhancer.enhance_recipe", side_effect=EnhancementError("API error")),
        ):
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            response = client.post("/recipes/scrape?enhance=true", json={"url": "https://example.com/new"})

        # Should still succeed, returning the unenhanced recipe
        assert response.status_code == 201
        assert response.json()["improved"] is False

    def test_returns_504_on_timeout(self, client: TestClient) -> None:
        """Should return 504 on scraping timeout."""
        with (
            patch("api.routers.recipes.recipe_storage.find_recipe_by_url", return_value=None),
            patch("api.routers.recipes.httpx.AsyncClient") as mock_client_class,
        ):
            mock_client = AsyncMock()
            mock_client.post.side_effect = httpx.TimeoutException("Timeout")
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client_class.return_value = mock_client

            response = client.post("/recipes/scrape", json={"url": "https://example.com/slow"})

        assert response.status_code == 504


class TestUpdateRecipe:
    """Tests for PUT /recipes/{recipe_id} endpoint."""

    def test_updates_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should update and return recipe."""
        updated_recipe = Recipe(id="test123", title="Updated Title", url="https://example.com")

        with patch("api.routers.recipes.recipe_storage.update_recipe", return_value=updated_recipe):
            response = client.put("/recipes/test123", json={"title": "Updated Title"})

        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    def test_returns_404_when_not_found(self, client: TestClient) -> None:
        """Should return 404 when recipe not found."""
        with patch("api.routers.recipes.recipe_storage.update_recipe", return_value=None):
            response = client.put("/recipes/nonexistent", json={"title": "New Title"})

        assert response.status_code == 404


class TestDeleteRecipe:
    """Tests for DELETE /recipes/{recipe_id} endpoint."""

    def test_deletes_recipe(self, client: TestClient) -> None:
        """Should delete recipe and return 204."""
        with patch("api.routers.recipes.recipe_storage.delete_recipe", return_value=True):
            response = client.delete("/recipes/test123")

        assert response.status_code == 204

    def test_returns_404_when_not_found(self, client: TestClient) -> None:
        """Should return 404 when recipe not found."""
        with patch("api.routers.recipes.recipe_storage.delete_recipe", return_value=False):
            response = client.delete("/recipes/nonexistent")

        assert response.status_code == 404


class TestEnhanceRecipe:
    """Tests for POST /recipes/{recipe_id}/enhance endpoint."""

    def test_returns_503_when_disabled(self, client: TestClient) -> None:
        """Should return 503 when enhancement is disabled."""
        with patch.dict(os.environ, {"ENABLE_RECIPE_ENHANCEMENT": "false"}):
            response = client.post("/recipes/test123/enhance")

        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()

    def test_returns_404_when_recipe_not_found(self, client: TestClient) -> None:
        """Should return 404 when recipe not found."""
        with (
            patch.dict(os.environ, {"ENABLE_RECIPE_ENHANCEMENT": "true"}),
            patch("api.services.recipe_enhancer.is_enhancement_enabled", return_value=True),
            patch("api.routers.recipes.recipe_storage.get_recipe", return_value=None),
        ):
            response = client.post("/recipes/nonexistent/enhance")

        assert response.status_code == 404
