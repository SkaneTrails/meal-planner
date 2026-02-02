"""Tests for api/storage/recipe_storage.py."""

from unittest.mock import MagicMock, patch

from api.models.recipe import DietLabel, MealLabel, Recipe, RecipeCreate, RecipeUpdate
from api.storage.recipe_storage import (
    _doc_to_recipe,
    delete_recipe,
    find_recipe_by_url,
    get_all_recipes,
    get_recipe,
    normalize_url,
    save_recipe,
    search_recipes,
    update_recipe,
)


class TestNormalizeUrl:
    """Tests for normalize_url function."""

    def test_removes_trailing_slash(self) -> None:
        """Should remove trailing slash."""
        result = normalize_url("https://example.com/recipe/")
        assert result == "https://example.com/recipe"

    def test_lowercases_url(self) -> None:
        """Should lowercase the URL."""
        result = normalize_url("HTTPS://Example.COM/Recipe")
        assert result == "https://example.com/recipe"

    def test_handles_empty_string(self) -> None:
        """Should return empty string for empty input."""
        result = normalize_url("")
        assert result == ""

    def test_strips_whitespace(self) -> None:
        """Should strip leading/trailing whitespace."""
        result = normalize_url("  https://example.com/recipe  ")
        assert result == "https://example.com/recipe"

    def test_preserves_path(self) -> None:
        """Should preserve the URL path."""
        result = normalize_url("https://example.com/recipes/123/carbonara")
        assert result == "https://example.com/recipes/123/carbonara"


class TestDocToRecipe:
    """Tests for _doc_to_recipe function."""

    def test_converts_basic_document(self) -> None:
        """Should convert basic document to Recipe."""
        data = {
            "title": "Test Recipe",
            "url": "https://example.com",
            "ingredients": ["flour", "sugar"],
            "instructions": ["Mix", "Bake"],
        }

        result = _doc_to_recipe("doc123", data)

        assert isinstance(result, Recipe)
        assert result.id == "doc123"
        assert result.title == "Test Recipe"
        assert result.ingredients == ["flour", "sugar"]
        assert result.instructions == ["Mix", "Bake"]

    def test_handles_missing_fields(self) -> None:
        """Should handle missing optional fields."""
        data = {"title": "Minimal Recipe"}  # title is required

        result = _doc_to_recipe("doc123", data)

        assert result.title == "Minimal Recipe"
        assert result.url == ""
        assert result.ingredients == []
        assert result.instructions == []
        assert result.image_url is None
        assert result.servings is None

    def test_parses_diet_label(self) -> None:
        """Should parse diet_label enum."""
        data = {"title": "Test", "diet_label": "veggie"}

        result = _doc_to_recipe("doc123", data)

        assert result.diet_label == DietLabel.VEGGIE

    def test_parses_meal_label(self) -> None:
        """Should parse meal_label enum."""
        data = {"title": "Test", "meal_label": "breakfast"}

        result = _doc_to_recipe("doc123", data)

        assert result.meal_label == MealLabel.BREAKFAST

    def test_handles_invalid_diet_label(self) -> None:
        """Should handle invalid diet_label gracefully."""
        data = {"title": "Test", "diet_label": "invalid_value"}

        result = _doc_to_recipe("doc123", data)

        assert result.diet_label is None

    def test_handles_invalid_meal_label(self) -> None:
        """Should handle invalid meal_label gracefully."""
        data = {"title": "Test", "meal_label": "invalid_value"}

        result = _doc_to_recipe("doc123", data)

        assert result.meal_label is None

    def test_includes_enhancement_fields(self) -> None:
        """Should include AI enhancement fields."""
        data = {
            "title": "Enhanced Recipe",
            "improved": True,
            "original_id": "orig123",
            "tips": "Use fresh herbs",
            "changes_made": ["Added spices", "Fixed timing"],
        }

        result = _doc_to_recipe("doc123", data)

        assert result.improved is True
        assert result.original_id == "orig123"
        assert result.tips == "Use fresh herbs"
        assert result.changes_made == ["Added spices", "Fixed timing"]


class TestSaveRecipe:
    """Tests for save_recipe function."""

    def test_saves_basic_recipe(self) -> None:
        """Should save recipe and return with ID."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_doc_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(
            title="Test Recipe", url="https://example.com", ingredients=["flour"], instructions=["Mix"]
        )

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(recipe)

        assert result.id == "new_doc_id"
        assert result.title == "Test Recipe"
        mock_doc_ref.set.assert_called_once()

    def test_saves_with_custom_id(self) -> None:
        """Should use custom recipe_id when provided."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "custom_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Test", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(recipe, recipe_id="custom_id")

        mock_db.collection.return_value.document.assert_called_with("custom_id")
        assert result.id == "custom_id"

    def test_saves_enhancement_fields(self) -> None:
        """Should save enhancement fields when provided."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "enhanced_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Enhanced", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(
                recipe,
                recipe_id="enhanced_id",
                improved=True,
                original_id="original_123",
                changes_made=["Added spices", "Fixed instructions"],
            )

        # Check the data passed to set()
        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["improved"] is True
        assert call_args["original_id"] == "original_123"
        assert call_args["changes_made"] == ["Added spices", "Fixed instructions"]

        # Check returned recipe
        assert result.improved is True
        assert result.original_id == "original_123"
        assert result.changes_made == ["Added spices", "Fixed instructions"]

    def test_does_not_include_false_improved(self) -> None:
        """Should not include improved=False in saved data."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "doc_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Test", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            save_recipe(recipe, improved=False)

        call_args = mock_doc_ref.set.call_args[0][0]
        assert "improved" not in call_args

    def test_saves_diet_and_meal_labels(self) -> None:
        """Should save diet_label and meal_label as string values."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "doc_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(
            title="Test", url="https://example.com", diet_label=DietLabel.VEGGIE, meal_label=MealLabel.MEAL
        )

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            save_recipe(recipe)

        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["diet_label"] == "veggie"
        assert call_args["meal_label"] == "meal"

    def test_saves_to_specified_database(self) -> None:
        """Should use specified database."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "doc_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Test", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db) as mock_get_client:
            save_recipe(recipe, database="meal-planner")

        mock_get_client.assert_called_once_with("meal-planner")


class TestGetRecipe:
    """Tests for get_recipe function."""

    def test_returns_recipe_when_found(self) -> None:
        """Should return Recipe when document exists."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.id = "doc123"
        mock_doc.to_dict.return_value = {"title": "Found Recipe", "url": "https://example.com"}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_recipe("doc123")

        assert result is not None
        assert result.title == "Found Recipe"

    def test_returns_none_when_not_found(self) -> None:
        """Should return None when document doesn't exist."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_recipe("nonexistent")

        assert result is None

    def test_returns_none_when_data_is_none(self) -> None:
        """Should return None when document data is None."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = None
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_recipe("doc123")

        assert result is None


class TestDeleteRecipe:
    """Tests for delete_recipe function."""

    def test_returns_true_when_deleted(self) -> None:
        """Should return True when recipe is deleted."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = delete_recipe("doc123")

        assert result is True
        mock_doc_ref.delete.assert_called_once()

    def test_returns_false_when_not_found(self) -> None:
        """Should return False when recipe doesn't exist."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = delete_recipe("nonexistent")

        assert result is False
        mock_doc_ref.delete.assert_not_called()


class TestUpdateRecipe:
    """Tests for update_recipe function."""

    def test_returns_none_when_not_found(self) -> None:
        """Should return None when recipe doesn't exist."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = update_recipe("nonexistent", RecipeUpdate(title="New Title"))

        assert result is None

    def test_updates_specified_fields(self) -> None:
        """Should only update specified fields."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Mock get_recipe for the return value
        with (
            patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db),
            patch(
                "api.storage.recipe_storage.get_recipe",
                return_value=Recipe(id="doc123", title="Updated", url="https://example.com"),
            ),
        ):
            update_recipe("doc123", RecipeUpdate(title="Updated"))

        # Verify update was called
        mock_doc_ref.update.assert_called_once()
        update_data = mock_doc_ref.update.call_args[0][0]
        assert update_data["title"] == "Updated"
        assert "updated_at" in update_data


class TestGetAllRecipes:
    """Tests for get_all_recipes function."""

    def test_returns_list_of_recipes(self) -> None:
        """Should return list of Recipe objects."""
        mock_db = MagicMock()
        mock_doc1 = MagicMock()
        mock_doc1.id = "doc1"
        mock_doc1.to_dict.return_value = {"title": "Recipe 1", "url": "https://example.com/1"}
        mock_doc2 = MagicMock()
        mock_doc2.id = "doc2"
        mock_doc2.to_dict.return_value = {"title": "Recipe 2", "url": "https://example.com/2"}

        mock_db.collection.return_value.order_by.return_value.stream.return_value = [mock_doc1, mock_doc2]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_all_recipes()

        assert len(result) == 2
        assert all(isinstance(r, Recipe) for r in result)

    def test_deduplicates_by_url(self) -> None:
        """Should deduplicate recipes by URL by default."""
        mock_db = MagicMock()
        mock_doc1 = MagicMock()
        mock_doc1.id = "doc1"
        mock_doc1.to_dict.return_value = {"title": "Recipe 1", "url": "https://example.com/recipe"}
        mock_doc2 = MagicMock()
        mock_doc2.id = "doc2"
        mock_doc2.to_dict.return_value = {"title": "Recipe 1 Duplicate", "url": "https://example.com/recipe/"}

        mock_db.collection.return_value.order_by.return_value.stream.return_value = [mock_doc1, mock_doc2]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_all_recipes()

        # Should only have one recipe due to URL deduplication
        assert len(result) == 1

    def test_includes_duplicates_when_requested(self) -> None:
        """Should include duplicates when include_duplicates=True."""
        mock_db = MagicMock()
        mock_doc1 = MagicMock()
        mock_doc1.id = "doc1"
        mock_doc1.to_dict.return_value = {"title": "Recipe 1", "url": "https://example.com/recipe"}
        mock_doc2 = MagicMock()
        mock_doc2.id = "doc2"
        mock_doc2.to_dict.return_value = {"title": "Recipe 1 Duplicate", "url": "https://example.com/recipe/"}

        mock_db.collection.return_value.order_by.return_value.stream.return_value = [mock_doc1, mock_doc2]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = get_all_recipes(include_duplicates=True)

        assert len(result) == 2


class TestFindRecipeByUrl:
    """Tests for find_recipe_by_url function."""

    def test_returns_none_for_empty_url(self) -> None:
        """Should return None for empty URL."""
        result = find_recipe_by_url("")
        assert result is None

    def test_finds_exact_match(self) -> None:
        """Should find recipe with exact URL match."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "doc123"
        mock_doc.to_dict.return_value = {"title": "Found", "url": "https://example.com/recipe"}

        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [mock_doc]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = find_recipe_by_url("https://example.com/recipe")

        assert result is not None
        assert result.title == "Found"


class TestSearchRecipes:
    """Tests for search_recipes function."""

    def test_returns_matching_recipes(self) -> None:
        """Should return recipes matching search query."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "doc123"
        mock_doc.to_dict.return_value = {"title": "Pasta Carbonara", "url": "https://example.com"}

        mock_db.collection.return_value.where.return_value.where.return_value.stream.return_value = [mock_doc]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = search_recipes("Pasta")

        assert len(result) == 1
        assert result[0].title == "Pasta Carbonara"
