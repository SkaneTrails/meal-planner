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

    def test_returns_404_for_other_household_private_recipe(self, client: TestClient) -> None:
        """Should return 404 for a private recipe owned by another household."""
        other_household_recipe = Recipe(
            id="private123",
            title="Private Recipe",
            url="https://example.com/private",
            household_id="other_household",  # Different from test_household
            visibility="household",  # Private
        )

        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=other_household_recipe):
            response = client.get("/recipes/private123")

        assert response.status_code == 404
        assert response.json()["detail"] == "Recipe not found"

    def test_returns_recipe_for_shared_from_other_household(self, client: TestClient) -> None:
        """Should return a shared recipe even if owned by another household."""
        shared_recipe = Recipe(
            id="shared123",
            title="Shared Recipe",
            url="https://example.com/shared",
            household_id="other_household",
            visibility="shared",  # Shared = accessible
        )

        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=shared_recipe):
            response = client.get("/recipes/shared123")

        assert response.status_code == 200
        assert response.json()["title"] == "Shared Recipe"

    def test_returns_recipe_for_legacy_without_household(self, client: TestClient) -> None:
        """Should return a legacy recipe (no household_id)."""
        legacy_recipe = Recipe(
            id="legacy123",
            title="Legacy Recipe",
            url="https://example.com/legacy",
            household_id=None,  # Legacy/unassigned
            visibility="household",
        )

        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=legacy_recipe):
            response = client.get("/recipes/legacy123")

        assert response.status_code == 200
        assert response.json()["title"] == "Legacy Recipe"


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
            enhanced=True,
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
        assert data["enhanced"] is True

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
        assert response.json()["enhanced"] is False

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


class TestCopyRecipe:
    """Tests for POST /recipes/{recipe_id}/copy endpoint."""

    def test_copies_shared_recipe(self, client: TestClient, sample_recipe: Recipe) -> None:
        """Should copy a shared recipe to user's household."""
        shared_recipe = Recipe(
            id="shared123",
            title="Shared Recipe",
            url="https://example.com/shared",
            household_id=None,  # Legacy/shared
            visibility="shared",
        )
        copied_recipe = Recipe(
            id="copied123",
            title="Shared Recipe",
            url="https://example.com/shared",
            household_id="test_household",
            visibility="household",
            created_by="test@example.com",
        )

        with (
            patch("api.routers.recipes.recipe_storage.get_recipe", return_value=shared_recipe),
            patch("api.routers.recipes.recipe_storage.copy_recipe", return_value=copied_recipe),
        ):
            response = client.post("/recipes/shared123/copy")

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "copied123"
        assert data["household_id"] == "test_household"
        assert data["visibility"] == "household"

    def test_returns_400_when_already_owned(self, client: TestClient) -> None:
        """Should return 400 when recipe already belongs to household."""
        owned_recipe = Recipe(
            id="owned123",
            title="My Recipe",
            url="https://example.com/mine",
            household_id="test_household",  # Same as user's household
            visibility="household",
        )

        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=owned_recipe):
            response = client.post("/recipes/owned123/copy")

        assert response.status_code == 400
        assert "already belongs" in response.json()["detail"].lower()

    def test_returns_404_when_recipe_not_found(self, client: TestClient) -> None:
        """Should return 404 when recipe doesn't exist."""
        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=None):
            response = client.post("/recipes/nonexistent/copy")

        assert response.status_code == 404

    def test_returns_404_when_not_shared(self, client: TestClient) -> None:
        """Should return 404 when trying to copy a private recipe from another household."""
        private_recipe = Recipe(
            id="private123",
            title="Private Recipe",
            url="https://example.com/private",
            household_id="other_household",  # Different household
            visibility="household",  # Not shared
        )

        with patch("api.routers.recipes.recipe_storage.get_recipe", return_value=private_recipe):
            response = client.post("/recipes/private123/copy")

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
