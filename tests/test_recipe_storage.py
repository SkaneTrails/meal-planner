"""Tests for api/storage/recipe_storage.py and api/storage/recipe_queries.py."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from api.models.recipe import DietLabel, MealLabel, Recipe, RecipeCreate, RecipeUpdate
from api.storage.recipe_queries import (
    _build_household_query,
    _deduplicate_recipes,
    count_recipes,
    get_all_recipes,
    get_recipes_by_ids,
    get_recipes_paginated,
)
from api.storage.recipe_storage import (
    EnhancementMetadata,
    _doc_to_recipe,
    delete_recipe,
    find_recipe_by_url,
    get_recipe,
    normalize_url,
    review_enhancement,
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
            "enhanced": True,
            "tips": "Use fresh herbs",
            "changes_made": ["Added spices", "Fixed timing"],
        }

        result = _doc_to_recipe("doc123", data)

        assert result.enhanced is True
        assert result.tips == "Use fresh herbs"
        assert result.changes_made == ["Added spices", "Fixed timing"]

    def test_coerces_invalid_visibility_to_household(self) -> None:
        """Should default to 'household' when visibility is null or invalid."""
        for bad_value in [None, "", "invalid", "public", 123]:
            data = {"title": "Recipe", "visibility": bad_value}
            result = _doc_to_recipe("doc123", data)
            assert result.visibility == "household", f"Failed for visibility={bad_value!r}"

    def test_preserves_valid_visibility(self) -> None:
        """Should preserve valid visibility values."""
        for valid_value in ["household", "shared"]:
            data = {"title": "Recipe", "visibility": valid_value}
            result = _doc_to_recipe("doc123", data)
            assert result.visibility == valid_value

    def test_maps_original_recipe_snapshot(self) -> None:
        """Should map nested original data into OriginalRecipe model."""
        data = {
            "title": "Enhanced Recipe",
            "enhanced": True,
            "original": {
                "title": "Original Title",
                "ingredients": ["flour", "sugar"],
                "instructions": ["Mix together", "Bake"],
                "servings": 4,
                "prep_time": 10,
                "cook_time": 30,
                "total_time": 40,
                "image_url": "https://example.com/img.jpg",
            },
        }

        result = _doc_to_recipe("doc123", data)

        assert result.original is not None
        assert result.original.title == "Original Title"
        assert result.original.ingredients == ["flour", "sugar"]
        assert result.original.instructions == ["Mix together", "Bake"]
        assert result.original.servings == 4
        assert result.original.prep_time == 10
        assert result.original.cook_time == 30
        assert result.original.total_time == 40
        assert result.original.image_url == "https://example.com/img.jpg"

    def test_handles_missing_original(self) -> None:
        """Should return None for original when field is absent."""
        data = {"title": "Recipe", "enhanced": False}

        result = _doc_to_recipe("doc123", data)

        assert result.original is None

    def test_handles_null_original(self) -> None:
        """Should return None for original when field is explicitly null."""
        data = {"title": "Recipe", "original": None}

        result = _doc_to_recipe("doc123", data)

        assert result.original is None

    def test_maps_hidden_and_favorited_fields(self) -> None:
        """Should map hidden and favorited visibility fields from Firestore."""
        data = {"title": "Recipe", "hidden": True, "favorited": True}

        result = _doc_to_recipe("doc123", data)

        assert result.hidden is True
        assert result.favorited is True

    def test_defaults_hidden_and_favorited_to_false(self) -> None:
        """Should default hidden and favorited to False when missing."""
        data = {"title": "Recipe"}

        result = _doc_to_recipe("doc123", data)

        assert result.hidden is False
        assert result.favorited is False

    def test_maps_show_enhanced_and_enhancement_reviewed_fields(self) -> None:
        """Should map show_enhanced and enhancement_reviewed from Firestore."""
        data = {"title": "Recipe", "enhanced": True, "show_enhanced": True, "enhancement_reviewed": True}

        result = _doc_to_recipe("doc123", data)

        assert result.show_enhanced is True
        assert result.enhancement_reviewed is True

    def test_defaults_show_enhanced_and_enhancement_reviewed_to_false(self) -> None:
        """Should default show_enhanced and enhancement_reviewed to False when missing."""
        data = {"title": "Recipe", "enhanced": True}

        result = _doc_to_recipe("doc123", data)

        assert result.show_enhanced is False
        assert result.enhancement_reviewed is False


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
        mock_existing_doc = MagicMock()
        mock_existing_doc.exists = True
        mock_existing_doc.to_dict.return_value = {
            "title": "Original Title",
            "ingredients": ["flour"],
            "instructions": ["Mix"],
            "created_at": "2025-01-01",
        }
        mock_doc_ref.get.return_value = mock_existing_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Enhanced", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(
                recipe,
                recipe_id="enhanced_id",
                enhancement=EnhancementMetadata(enhanced=True, changes_made=["Added spices", "Fixed instructions"]),
            )

        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["enhanced"] is True
        assert call_args["changes_made"] == ["Added spices", "Fixed instructions"]
        assert call_args["show_enhanced"] is False
        assert call_args["enhancement_reviewed"] is False

        assert result.enhanced is True
        assert result.changes_made == ["Added spices", "Fixed instructions"]

    def test_snapshots_original_on_enhancement(self) -> None:
        """Should snapshot original recipe data into 'original' field when enhancing."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "recipe_id"
        mock_existing_doc = MagicMock()
        mock_existing_doc.exists = True
        mock_existing_doc.to_dict.return_value = {
            "title": "Original Title",
            "ingredients": ["100g flour", "2 eggs"],
            "instructions": ["Mix flour", "Add eggs"],
            "servings": 4,
            "prep_time": 10,
            "cook_time": 30,
            "total_time": 40,
            "image_url": "https://example.com/image.jpg",
            "created_at": "2025-01-01",
        }
        mock_doc_ref.get.return_value = mock_existing_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        enhanced_recipe = RecipeCreate(
            title="Enhanced Title", url="https://example.com", ingredients=["150g flour", "3 eggs"]
        )

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(
                enhanced_recipe,
                recipe_id="recipe_id",
                enhancement=EnhancementMetadata(enhanced=True, changes_made=["Updated quantities"]),
            )

        call_args = mock_doc_ref.set.call_args[0][0]
        original = call_args["original"]
        assert original["title"] == "Original Title"
        assert original["ingredients"] == ["100g flour", "2 eggs"]
        assert original["instructions"] == ["Mix flour", "Add eggs"]
        assert original["servings"] == 4
        assert original["image_url"] == "https://example.com/image.jpg"

        assert result.original is not None
        assert result.original.title == "Original Title"
        assert result.original.ingredients == ["100g flour", "2 eggs"]
        assert result.original.servings == 4

    def test_preserves_created_at_on_enhancement(self) -> None:
        """Should keep the original created_at when enhancing an existing recipe."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "recipe_id"
        original_created = datetime(2025, 1, 15, tzinfo=UTC)
        mock_existing_doc = MagicMock()
        mock_existing_doc.exists = True
        mock_existing_doc.to_dict.return_value = {
            "title": "Original",
            "ingredients": [],
            "instructions": [],
            "created_at": original_created,
        }
        mock_doc_ref.get.return_value = mock_existing_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Enhanced", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = save_recipe(recipe, recipe_id="recipe_id", enhancement=EnhancementMetadata(enhanced=True))

        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["created_at"] == original_created
        assert result.created_at == original_created

    def test_no_original_snapshot_for_new_recipe(self) -> None:
        """Should not snapshot original when saving a new recipe (no recipe_id)."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="New", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            save_recipe(recipe, enhancement=EnhancementMetadata(enhanced=True))

        call_args = mock_doc_ref.set.call_args[0][0]
        assert "original" not in call_args

    def test_does_not_include_false_enhanced(self) -> None:
        """Should not include enhanced=False in saved data."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "doc_id"
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        recipe = RecipeCreate(title="Test", url="https://example.com")

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            save_recipe(recipe, enhancement=EnhancementMetadata(enhanced=False))

        call_args = mock_doc_ref.set.call_args[0][0]
        assert "enhanced" not in call_args

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

    def test_returns_false_when_not_owned_by_household(self) -> None:
        """Should return False when recipe is owned by different household."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "other-household"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = delete_recipe("doc123", household_id="my-household")

        assert result is False
        mock_doc_ref.delete.assert_not_called()

    def test_deletes_when_owned_by_household(self) -> None:
        """Should delete when recipe is owned by the specified household."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "my-household"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = delete_recipe("doc123", household_id="my-household")

        assert result is True
        mock_doc_ref.delete.assert_called_once()


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

    def test_returns_none_when_not_owned_by_household(self) -> None:
        """Should return None when recipe is owned by different household."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "other-household"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = update_recipe("doc123", RecipeUpdate(title="New"), household_id="my-household")

        assert result is None
        mock_doc_ref.update.assert_not_called()

    def test_updates_when_owned_by_household(self) -> None:
        """Should update when recipe is owned by the specified household."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"household_id": "my-household"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with (
            patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db),
            patch(
                "api.storage.recipe_storage.get_recipe",
                return_value=Recipe(id="doc123", title="Updated", url="https://example.com"),
            ),
        ):
            result = update_recipe("doc123", RecipeUpdate(title="Updated"), household_id="my-household")

        assert result is not None
        mock_doc_ref.update.assert_called_once()


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

        mock_collection = mock_db.collection.return_value
        mock_collection.where.return_value.order_by.return_value.order_by.return_value.stream.return_value = [
            mock_doc1,
            mock_doc2,
        ]

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
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

        mock_collection = mock_db.collection.return_value
        mock_collection.where.return_value.order_by.return_value.order_by.return_value.stream.return_value = [
            mock_doc1,
            mock_doc2,
        ]

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
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

        mock_collection = mock_db.collection.return_value
        mock_collection.where.return_value.order_by.return_value.order_by.return_value.stream.return_value = [
            mock_doc1,
            mock_doc2,
        ]

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
            result = get_all_recipes(include_duplicates=True)

        assert len(result) == 2


class TestCountRecipes:
    """Tests for count_recipes function."""

    def test_counts_all_recipes_for_superuser(self) -> None:
        """Superuser (household_id=None) should count all recipes."""
        mock_db = MagicMock()
        mock_count_result = MagicMock()
        mock_count_result.value = 42
        mock_query = MagicMock()
        mock_query.where.return_value = mock_query
        mock_query.count.return_value.get.return_value = [[mock_count_result]]
        mock_db.collection.return_value = mock_query

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
            result = count_recipes(household_id=None)

        assert result == 42

    def test_counts_owned_and_shared_for_household(self) -> None:
        """Regular user should count owned + shared recipes."""
        mock_db = MagicMock()
        mock_owned_result = MagicMock()
        mock_owned_result.value = 10
        mock_shared_result = MagicMock()
        mock_shared_result.value = 5

        mock_owned_query = MagicMock()
        mock_owned_query.where.return_value = mock_owned_query
        mock_owned_query.count.return_value.get.return_value = [[mock_owned_result]]

        mock_shared_query = MagicMock()
        mock_shared_query.where.return_value = mock_shared_query
        mock_shared_query.count.return_value.get.return_value = [[mock_shared_result]]

        mock_collection = MagicMock()
        mock_collection.where.side_effect = [mock_owned_query, mock_shared_query]
        mock_db.collection.return_value = mock_collection

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
            result = count_recipes(household_id="household-1")

        assert result == 15

    def test_applies_hidden_filter_by_default(self) -> None:
        """Should filter hidden recipes when show_hidden=False."""
        mock_db = MagicMock()
        mock_count_result = MagicMock()
        mock_count_result.value = 10
        mock_query = MagicMock()
        mock_query.where.return_value = mock_query
        mock_query.count.return_value.get.return_value = [[mock_count_result]]
        mock_db.collection.return_value = mock_query

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
            count_recipes(household_id=None, show_hidden=False)

        mock_query.where.assert_called_once()
        actual_filter = mock_query.where.call_args.kwargs["filter"]
        assert actual_filter.field_path == "hidden"
        assert actual_filter.value is False

    def test_skips_hidden_filter_when_requested(self) -> None:
        """Should include hidden recipes when show_hidden=True."""
        mock_db = MagicMock()
        mock_count_result = MagicMock()
        mock_count_result.value = 20
        mock_query = MagicMock()
        mock_query.count.return_value.get.return_value = [[mock_count_result]]
        mock_db.collection.return_value = mock_query

        with patch("api.storage.recipe_queries.get_firestore_client", return_value=mock_db):
            result = count_recipes(household_id=None, show_hidden=True)

        assert result == 20
        mock_query.where.assert_not_called()


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

        mock_db.collection.return_value.where.return_value.where.return_value.where.return_value.stream.return_value = [
            mock_doc
        ]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = search_recipes("Pasta")

        assert len(result) == 1
        assert result[0].title == "Pasta Carbonara"

    def test_excludes_hidden_by_default(self) -> None:
        """Should add hidden==False filter when show_hidden is False."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_query.where.return_value = mock_query
        mock_query.stream.return_value = iter([])
        mock_db.collection.return_value.where.return_value.where.return_value = mock_query

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            search_recipes("Pasta", show_hidden=False)

        mock_query.where.assert_called_once()
        actual_filter = mock_query.where.call_args.kwargs["filter"]
        assert actual_filter.field_path == "hidden"
        assert actual_filter.value is False

    def test_show_hidden_skips_filter(self) -> None:
        """Should not add hidden filter when show_hidden=True."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "doc123"
        mock_doc.to_dict.return_value = {"title": "Pasta Hidden", "url": "https://example.com", "hidden": True}

        mock_db.collection.return_value.where.return_value.where.return_value.stream.return_value = [mock_doc]

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = search_recipes("Pasta", show_hidden=True)

        assert len(result) == 1
        assert result[0].title == "Pasta Hidden"


class TestCopyRecipe:
    """Tests for copy_recipe function."""

    def test_copies_recipe_to_new_household(self) -> None:
        """Should copy recipe with new ownership."""
        from api.storage.recipe_storage import copy_recipe

        source_recipe = Recipe(
            id="source_id",
            title="Shared Recipe",
            url="https://example.com",
            ingredients=["flour", "eggs"],
            instructions=["Mix", "Bake"],
            household_id=None,
            visibility="shared",
        )

        copied_recipe = Recipe(
            id="copied_id",
            title="Shared Recipe",
            url="https://example.com",
            ingredients=["flour", "eggs"],
            instructions=["Mix", "Bake"],
            household_id="hh123",
            visibility="household",
            created_by="user@test.com",
        )

        with (
            patch("api.storage.recipe_storage.get_recipe", return_value=source_recipe),
            patch("api.storage.recipe_storage.save_recipe", return_value=copied_recipe),
        ):
            result = copy_recipe("source_id", to_household_id="hh123", copied_by="user@test.com")

        assert result is not None
        assert result.id == "copied_id"
        assert result.household_id == "hh123"
        assert result.visibility == "household"
        assert result.created_by == "user@test.com"

    def test_returns_none_for_missing_recipe(self) -> None:
        """Should return None if source recipe doesn't exist."""
        from api.storage.recipe_storage import copy_recipe

        with patch("api.storage.recipe_storage.get_recipe", return_value=None):
            result = copy_recipe("nonexistent", to_household_id="hh123", copied_by="user@test.com")

        assert result is None


class TestTransferRecipeToHousehold:
    """Tests for transfer_recipe_to_household function."""

    def test_transfers_recipe_successfully(self) -> None:
        """Should update household_id and return the recipe."""
        from api.storage.recipe_storage import transfer_recipe_to_household

        transferred_recipe = Recipe(
            id="recipe_id",
            title="Test Recipe",
            url="https://example.com",
            ingredients=[],
            instructions=[],
            household_id="new_household",
        )

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        with (
            patch("api.storage.recipe_storage.get_firestore_client") as mock_client,
            patch("api.storage.recipe_storage.get_recipe", return_value=transferred_recipe),
        ):
            mock_client.return_value.collection.return_value.document.return_value = mock_doc_ref

            result = transfer_recipe_to_household("recipe_id", "new_household")

        assert result is not None
        assert result.household_id == "new_household"
        mock_doc_ref.update.assert_called_once()
        # Verify household_id and updated_at were set
        update_call = mock_doc_ref.update.call_args[0][0]
        assert update_call["household_id"] == "new_household"
        assert "updated_at" in update_call

    def test_returns_none_for_missing_recipe(self) -> None:
        """Should return None if recipe doesn't exist."""
        from api.storage.recipe_storage import transfer_recipe_to_household

        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        with patch("api.storage.recipe_storage.get_firestore_client") as mock_client:
            mock_client.return_value.collection.return_value.document.return_value = mock_doc_ref

            result = transfer_recipe_to_household("nonexistent", "new_household")

        assert result is None
        mock_doc_ref.update.assert_not_called()


class TestGetRecipesByIds:
    """Tests for get_recipes_by_ids batch fetch."""

    def test_returns_empty_dict_for_empty_input(self) -> None:
        """Should return empty dict when no IDs provided."""
        result = get_recipes_by_ids(set())
        assert result == {}

    def test_fetches_multiple_recipes(self) -> None:
        """Should batch-fetch multiple recipes and return dict keyed by ID."""
        mock_doc1 = MagicMock()
        mock_doc1.exists = True
        mock_doc1.id = "recipe1"
        mock_doc1.to_dict.return_value = {"title": "Pasta", "url": "", "ingredients": [], "instructions": []}

        mock_doc2 = MagicMock()
        mock_doc2.exists = True
        mock_doc2.id = "recipe2"
        mock_doc2.to_dict.return_value = {"title": "Soup", "url": "", "ingredients": [], "instructions": []}

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_client.return_value.get_all.return_value = [mock_doc1, mock_doc2]

            result = get_recipes_by_ids({"recipe1", "recipe2"})

        assert len(result) == 2
        assert result["recipe1"].title == "Pasta"
        assert result["recipe2"].title == "Soup"

    def test_skips_nonexistent_documents(self) -> None:
        """Should skip documents that don't exist."""
        mock_doc1 = MagicMock()
        mock_doc1.exists = True
        mock_doc1.id = "recipe1"
        mock_doc1.to_dict.return_value = {"title": "Pasta", "url": "", "ingredients": [], "instructions": []}

        mock_doc2 = MagicMock()
        mock_doc2.exists = False

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_client.return_value.get_all.return_value = [mock_doc1, mock_doc2]

            result = get_recipes_by_ids({"recipe1", "missing"})

        assert len(result) == 1
        assert "recipe1" in result


class TestDeduplicateRecipes:
    """Tests for _deduplicate_recipes helper."""

    def test_removes_duplicates_by_url(self) -> None:
        """Should keep first (most recent) recipe for each URL."""
        recipes = [
            Recipe(id="1", title="New Pasta", url="https://example.com/pasta", ingredients=[], instructions=[]),
            Recipe(id="2", title="Old Pasta", url="https://example.com/pasta/", ingredients=[], instructions=[]),
        ]

        result = _deduplicate_recipes(recipes)

        assert len(result) == 1
        assert result[0].id == "1"

    def test_keeps_recipes_without_url(self) -> None:
        """Should treat recipes without URLs as unique."""
        recipes = [
            Recipe(id="1", title="Recipe A", url="", ingredients=[], instructions=[]),
            Recipe(id="2", title="Recipe B", url="", ingredients=[], instructions=[]),
        ]

        result = _deduplicate_recipes(recipes)

        assert len(result) == 2

    def test_preserves_order(self) -> None:
        """Should preserve order of unique recipes."""
        recipes = [
            Recipe(id="1", title="A", url="https://a.com", ingredients=[], instructions=[]),
            Recipe(id="2", title="B", url="https://b.com", ingredients=[], instructions=[]),
            Recipe(id="3", title="C", url="https://c.com", ingredients=[], instructions=[]),
        ]

        result = _deduplicate_recipes(recipes)

        assert [r.id for r in result] == ["1", "2", "3"]


class TestBuildHouseholdQuery:
    """Tests for _build_household_query helper."""

    def test_superuser_gets_single_query(self) -> None:
        """Superuser (household_id=None) should get a single unfiltered query."""
        mock_db = MagicMock()

        queries = _build_household_query(mock_db, household_id=None)

        assert len(queries) == 1

    def test_household_user_gets_two_queries(self) -> None:
        """Regular user should get two queries (owned + shared)."""
        mock_db = MagicMock()

        queries = _build_household_query(mock_db, household_id="household123")

        assert len(queries) == 2

    def test_show_hidden_false_adds_filter(self) -> None:
        """Should add hidden==False filter when show_hidden is False."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection

        _build_household_query(mock_db, household_id=None, show_hidden=False)

        mock_collection.where.assert_called_once()
        actual_filter = mock_collection.where.call_args.kwargs["filter"]
        assert actual_filter.field_path == "hidden"
        assert actual_filter.value is False

    def test_show_hidden_true_skips_filter(self) -> None:
        """Should not add hidden filter when show_hidden=True."""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection

        _build_household_query(mock_db, household_id=None, show_hidden=True)

        mock_collection.where.assert_not_called()


class TestGetRecipesPaginated:
    """Tests for get_recipes_paginated cursor-based pagination."""

    def _make_mock_doc(self, doc_id: str, title: str) -> MagicMock:
        """Create a mock Firestore document snapshot."""
        doc = MagicMock()
        doc.id = doc_id
        doc.exists = True
        doc.to_dict.return_value = {
            "title": title,
            "url": f"https://example.com/{doc_id}",
            "ingredients": [],
            "instructions": [],
        }
        return doc

    def test_returns_first_page(self) -> None:
        """Should return recipes up to limit with no cursor."""
        docs = [self._make_mock_doc(f"r{i}", f"Recipe {i}") for i in range(3)]

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_query = MagicMock()
            mock_query.where.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.stream.return_value = iter(docs)
            mock_client.return_value.collection.return_value = mock_query

            recipes, next_cursor = get_recipes_paginated(household_id=None, limit=10)

        assert len(recipes) == 3
        assert next_cursor is None

    def test_returns_cursor_when_more_pages(self) -> None:
        """Should return next_cursor when more results exist."""
        docs = [self._make_mock_doc(f"r{i}", f"Recipe {i}") for i in range(4)]

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_query = MagicMock()
            mock_query.where.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.stream.return_value = iter(docs)
            mock_client.return_value.collection.return_value = mock_query

            recipes, next_cursor = get_recipes_paginated(household_id=None, limit=3)

        assert len(recipes) == 3
        assert next_cursor == "r2"

    def test_uses_cursor_for_start_after(self) -> None:
        """Should use cursor document for start_after when cursor provided."""
        docs = [self._make_mock_doc("r3", "Recipe 3")]
        cursor_doc = MagicMock()
        cursor_doc.exists = True

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_query = MagicMock()
            mock_query.where.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.start_after.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.stream.return_value = iter(docs)

            mock_collection = mock_client.return_value.collection.return_value
            mock_collection.where.return_value = mock_query
            mock_collection.document.return_value.get.return_value = cursor_doc

            recipes, _next_cursor = get_recipes_paginated(household_id=None, limit=10, cursor="r2")

        assert len(recipes) == 1
        mock_query.start_after.assert_called_once_with(cursor_doc)

    def test_invalid_cursor_ignored(self) -> None:
        """Should ignore cursor if document doesn't exist."""
        docs = [self._make_mock_doc("r1", "Recipe 1")]
        cursor_doc = MagicMock()
        cursor_doc.exists = False

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            mock_query = MagicMock()
            mock_query.where.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.stream.return_value = iter(docs)

            mock_collection = mock_client.return_value.collection.return_value
            mock_collection.where.return_value = mock_query
            mock_collection.document.return_value.get.return_value = cursor_doc

            recipes, _ = get_recipes_paginated(household_id=None, limit=10, cursor="invalid")

        assert len(recipes) == 1

    def _make_mock_doc_with_created_at(self, doc_id: str, title: str, created_at: str, url: str = "") -> MagicMock:
        """Create a mock doc with created_at for household sorting tests."""
        doc = MagicMock()
        doc.id = doc_id
        doc.exists = True
        doc.to_dict.return_value = {
            "title": title,
            "url": url or f"https://example.com/{doc_id}",
            "ingredients": [],
            "instructions": [],
            "created_at": created_at,
        }
        return doc

    def test_household_merges_and_sorts_two_queries(self) -> None:
        """Household user gets 2 queries (owned + shared), results merged and sorted."""
        owned_docs = [
            self._make_mock_doc_with_created_at("o1", "Owned 1", "2025-01-03"),
            self._make_mock_doc_with_created_at("o2", "Owned 2", "2025-01-01"),
        ]
        shared_docs = [self._make_mock_doc_with_created_at("s1", "Shared 1", "2025-01-02")]

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            owned_query = MagicMock()
            owned_query.where.return_value = owned_query
            owned_query.order_by.return_value = owned_query
            owned_query.limit.return_value = owned_query
            owned_query.stream.return_value = iter(owned_docs)

            shared_query = MagicMock()
            shared_query.where.return_value = shared_query
            shared_query.order_by.return_value = shared_query
            shared_query.limit.return_value = shared_query
            shared_query.stream.return_value = iter(shared_docs)

            mock_collection = mock_client.return_value.collection.return_value
            # Each .where() call returns a mock that chains .where().order_by().order_by()
            mock_collection.where.side_effect = [owned_query, shared_query]

            recipes, next_cursor = get_recipes_paginated(household_id="hh1", limit=10)

        assert len(recipes) == 3
        assert next_cursor is None
        assert recipes[0].id == "o1"
        assert recipes[1].id == "s1"
        assert recipes[2].id == "o2"

    def test_household_deduplicates_shared_and_owned(self) -> None:
        """Household user: recipes with same URL from owned and shared are deduplicated."""
        owned_docs = [
            self._make_mock_doc_with_created_at("o1", "My Pasta", "2025-01-02", url="https://example.com/pasta")
        ]
        shared_docs = [
            self._make_mock_doc_with_created_at("s1", "Shared Pasta", "2025-01-01", url="https://example.com/pasta")
        ]

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            owned_query = MagicMock()
            owned_query.where.return_value = owned_query
            owned_query.order_by.return_value = owned_query
            owned_query.limit.return_value = owned_query
            owned_query.stream.return_value = iter(owned_docs)

            shared_query = MagicMock()
            shared_query.where.return_value = shared_query
            shared_query.order_by.return_value = shared_query
            shared_query.limit.return_value = shared_query
            shared_query.stream.return_value = iter(shared_docs)

            mock_collection = mock_client.return_value.collection.return_value
            mock_collection.where.side_effect = [owned_query, shared_query]

            recipes, next_cursor = get_recipes_paginated(household_id="hh1", limit=10)

        assert len(recipes) == 1
        assert recipes[0].id == "o1"
        assert next_cursor is None

    def test_household_pagination_has_more(self) -> None:
        """Household user: correctly reports has_more with merged queries."""
        owned_docs = [
            self._make_mock_doc_with_created_at("o1", "Owned 1", "2025-01-03"),
            self._make_mock_doc_with_created_at("o2", "Owned 2", "2025-01-01"),
        ]
        shared_docs = [self._make_mock_doc_with_created_at("s1", "Shared 1", "2025-01-02")]

        with patch("api.storage.recipe_queries.get_firestore_client") as mock_client:
            owned_query = MagicMock()
            owned_query.where.return_value = owned_query
            owned_query.order_by.return_value = owned_query
            owned_query.limit.return_value = owned_query
            owned_query.stream.return_value = iter(owned_docs)

            shared_query = MagicMock()
            shared_query.where.return_value = shared_query
            shared_query.order_by.return_value = shared_query
            shared_query.limit.return_value = shared_query
            shared_query.stream.return_value = iter(shared_docs)

            mock_collection = mock_client.return_value.collection.return_value
            mock_collection.where.side_effect = [owned_query, shared_query]

            recipes, next_cursor = get_recipes_paginated(household_id="hh1", limit=2)

        assert len(recipes) == 2
        assert next_cursor is not None


class TestReviewEnhancement:
    """Tests for review_enhancement function."""

    def test_approve_sets_show_enhanced_true(self) -> None:
        """Approve should set show_enhanced=True and enhancement_reviewed=True."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"title": "Recipe", "enhanced": True, "household_id": "hh1"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with (
            patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db),
            patch("api.storage.recipe_storage.get_recipe") as mock_get,
        ):
            mock_get.return_value = MagicMock()
            result = review_enhancement("recipe1", approve=True, household_id="hh1")

        mock_doc_ref.update.assert_called_once()
        call_args = mock_doc_ref.update.call_args[0][0]
        assert call_args["show_enhanced"] is True
        assert call_args["enhancement_reviewed"] is True
        assert result is not None

    def test_reject_sets_show_enhanced_false(self) -> None:
        """Reject should set show_enhanced=False and enhancement_reviewed=True."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"title": "Recipe", "enhanced": True, "household_id": "hh1"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with (
            patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db),
            patch("api.storage.recipe_storage.get_recipe") as mock_get,
        ):
            mock_get.return_value = MagicMock()
            result = review_enhancement("recipe1", approve=False, household_id="hh1")

        mock_doc_ref.update.assert_called_once()
        call_args = mock_doc_ref.update.call_args[0][0]
        assert call_args["show_enhanced"] is False
        assert call_args["enhancement_reviewed"] is True
        assert result is not None

    def test_returns_none_if_not_found(self) -> None:
        """Should return None if recipe doesn't exist."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = review_enhancement("recipe1", approve=True, household_id="hh1")

        assert result is None
        mock_doc_ref.update.assert_not_called()

    def test_returns_none_if_wrong_household(self) -> None:
        """Should return None if recipe belongs to different household."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"title": "Recipe", "enhanced": True, "household_id": "other_hh"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = review_enhancement("recipe1", approve=True, household_id="hh1")

        assert result is None
        mock_doc_ref.update.assert_not_called()

    def test_returns_none_if_not_enhanced(self) -> None:
        """Should return None if recipe is not enhanced."""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"title": "Recipe", "enhanced": False, "household_id": "hh1"}
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        with patch("api.storage.recipe_storage.get_firestore_client", return_value=mock_db):
            result = review_enhancement("recipe1", approve=True, household_id="hh1")

        assert result is None
        mock_doc_ref.update.assert_not_called()
