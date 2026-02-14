"""Tests for api/services/recipe_enhancer.py."""

import json
import os
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from api.services.prompt_loader import DEFAULT_LANGUAGE
from api.services.recipe_enhancer import (
    DEFAULT_MODEL,
    EnhancementConfigError,
    EnhancementError,
    _flatten_metadata,
    _format_recipe_text,
    _normalize_ingredients,
    _parse_instructions,
    _preserve_original_fields,
    _validate_response,
    enhance_recipe,
    get_genai_client,
)


class TestGetGenaiClient:
    """Tests for get_genai_client function."""

    def test_raises_error_when_genai_not_available(self) -> None:
        """Should raise EnhancementConfigError if google-genai is not installed."""
        with (
            patch("api.services.recipe_enhancer.GENAI_AVAILABLE", new=False),
            pytest.raises(EnhancementConfigError, match="google-genai is not installed"),
        ):
            get_genai_client()

    def test_raises_error_when_api_key_missing(self) -> None:
        """Should raise EnhancementConfigError if GOOGLE_API_KEY not set."""
        with patch("api.services.recipe_enhancer.GENAI_AVAILABLE", new=True), patch.dict(os.environ, {}, clear=True):
            os.environ.pop("GOOGLE_API_KEY", None)
            with pytest.raises(EnhancementConfigError, match="GOOGLE_API_KEY"):
                get_genai_client()

    def test_creates_client_with_api_key(self) -> None:
        """Should create client when API key is set."""
        mock_client = MagicMock()
        mock_genai = MagicMock()
        mock_genai.Client.return_value = mock_client

        with (
            patch("api.services.recipe_enhancer.GENAI_AVAILABLE", new=True),
            patch("api.services.recipe_enhancer.genai", mock_genai),
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key"}),
        ):
            result = get_genai_client()
            mock_genai.Client.assert_called_once_with(api_key="test-key")
            assert result == mock_client


class TestFormatRecipeText:
    """Tests for _format_recipe_text function."""

    def test_formats_basic_recipe(self) -> None:
        """Should format recipe with title, ingredients, and instructions."""
        recipe = {
            "title": "Test Recipe",
            "ingredients": ["1 cup flour", "2 eggs"],
            "instructions": ["Mix ingredients", "Bake at 180C"],
        }

        result = _format_recipe_text(recipe)

        assert "Title: Test Recipe" in result
        assert "- 1 cup flour" in result
        assert "- 2 eggs" in result
        assert "Mix ingredients" in result
        assert "Bake at 180C" in result

    def test_handles_missing_title(self) -> None:
        """Should use 'Unknown' for missing title."""
        recipe = {"ingredients": [], "instructions": []}

        result = _format_recipe_text(recipe)

        assert "Title: Unknown" in result

    def test_handles_string_instructions(self) -> None:
        """Should handle instructions as a single string."""
        recipe = {"title": "Test", "ingredients": [], "instructions": "Single instruction string"}

        result = _format_recipe_text(recipe)

        assert "Single instruction string" in result


class TestParseInstructions:
    """Tests for _parse_instructions function."""

    def test_splits_on_double_newlines(self) -> None:
        """Should split on double newlines."""
        text = "Step 1\n\nStep 2\n\nStep 3"
        result = _parse_instructions(text)
        assert result == ["Step 1", "Step 2", "Step 3"]

    def test_splits_on_timeline_markers(self) -> None:
        """Should split on timeline markers (⏱️)."""
        text = "⏱️ 0 min: Start\n\n⏱️ 5 min: Continue\n\n⏱️ 10 min: Finish"
        result = _parse_instructions(text)
        assert len(result) == 3
        assert "⏱️ 0 min: Start" in result[0]

    def test_strips_whitespace(self) -> None:
        """Should strip whitespace from each part."""
        text = "  Step 1  \n\n  Step 2  "
        result = _parse_instructions(text)
        assert result == ["Step 1", "Step 2"]

    def test_filters_empty_parts(self) -> None:
        """Should filter out empty parts."""
        text = "Step 1\n\n\n\nStep 2"
        result = _parse_instructions(text)
        assert result == ["Step 1", "Step 2"]


class TestNormalizeIngredients:
    """Tests for _normalize_ingredients function."""

    def test_passes_through_plain_strings(self) -> None:
        """Should leave string ingredients unchanged."""
        ingredients = ["1 cup flour", "2 eggs"]
        assert _normalize_ingredients(ingredients) == ["1 cup flour", "2 eggs"]

    def test_flattens_dict_with_quantity_unit_item(self) -> None:
        """Should flatten structured dicts returned by Gemini."""
        ingredients = [
            {"item": "Fine salt", "quantity": "to taste", "unit": ""},
            {"item": "Oranges", "quantity": "4", "unit": ""},
            {"item": "Water", "quantity": "1", "unit": "cup"},
        ]
        result = _normalize_ingredients(ingredients)
        assert result == ["to taste Fine salt", "4 Oranges", "1 cup Water"]

    def test_handles_mixed_strings_and_dicts(self) -> None:
        """Should handle a mix of strings and dicts."""
        ingredients = ["500 g pasta", {"item": "Salt", "quantity": "1", "unit": "tsp"}]
        result = _normalize_ingredients(ingredients)
        assert result == ["500 g pasta", "1 tsp Salt"]

    def test_handles_dict_with_name_key(self) -> None:
        """Should fall back to 'name' key when 'item' is missing."""
        ingredients = [{"name": "Pepper", "quantity": "½", "unit": "tsp"}]
        result = _normalize_ingredients(ingredients)
        assert result == ["½ tsp Pepper"]

    def test_handles_empty_dict_fields(self) -> None:
        """Should skip empty quantity/unit fields gracefully."""
        ingredients = [{"item": "Salt", "quantity": "", "unit": ""}]
        result = _normalize_ingredients(ingredients)
        assert result == ["Salt"]

    def test_handles_empty_list(self) -> None:
        """Should return empty list for empty input."""
        assert _normalize_ingredients([]) == []

    def test_coerces_non_string_values(self) -> None:
        """Should coerce unexpected types to strings."""
        ingredients = [42, True]
        result = _normalize_ingredients(ingredients)
        assert result == ["42", "True"]


class TestValidateResponse:
    """Tests for _validate_response function."""

    def test_returns_text_on_valid_response(self) -> None:
        """Should return response text when present."""
        mock_response = MagicMock()
        mock_response.text = "Valid response text"

        result = _validate_response(mock_response)

        assert result == "Valid response text"

    def test_raises_on_empty_response(self) -> None:
        """Should raise EnhancementError on empty response."""
        mock_response = MagicMock()
        mock_response.text = ""

        with pytest.raises(EnhancementError, match="empty response"):
            _validate_response(mock_response)

    def test_raises_on_none_response(self) -> None:
        """Should raise EnhancementError on None response text."""
        mock_response = MagicMock()
        mock_response.text = None

        with pytest.raises(EnhancementError, match="empty response"):
            _validate_response(mock_response)


class TestPreserveOriginalFields:
    """Tests for _preserve_original_fields function."""

    def test_preserves_url(self) -> None:
        """Should preserve URL from original."""
        enhanced: dict[str, Any] = {}
        original = {"url": "https://example.com/recipe"}

        _preserve_original_fields(enhanced, original)

        assert enhanced["url"] == "https://example.com/recipe"

    def test_preserves_image_url(self) -> None:
        """Should preserve image_url from original."""
        enhanced: dict[str, Any] = {}
        original = {"image_url": "https://example.com/image.jpg"}

        _preserve_original_fields(enhanced, original)

        assert enhanced["image_url"] == "https://example.com/image.jpg"

    def test_does_not_overwrite_existing(self) -> None:
        """Should not overwrite existing enhanced values."""
        enhanced: dict[str, Any] = {"url": "https://enhanced.com"}
        original = {"url": "https://original.com"}

        _preserve_original_fields(enhanced, original)

        assert enhanced["url"] == "https://enhanced.com"

    def test_preserves_all_expected_fields(self) -> None:
        """Should preserve all expected fields."""
        enhanced: dict[str, Any] = {}
        original = {
            "url": "https://example.com",
            "image_url": "https://example.com/img.jpg",
            "servings": 4,
            "prep_time": 15,
            "cook_time": 30,
            "total_time": 45,
            "meal_label": "meal",
            "diet_label": "veggie",
            "created_at": "2024-01-01",
        }

        _preserve_original_fields(enhanced, original)

        assert enhanced["url"] == original["url"]
        assert enhanced["image_url"] == original["image_url"]
        assert enhanced["servings"] == 4
        assert enhanced["prep_time"] == 15
        assert enhanced["cook_time"] == 30
        assert enhanced["total_time"] == 45


class TestFlattenMetadata:
    """Tests for _flatten_metadata function."""

    def test_moves_cuisine_to_top_level(self) -> None:
        """Should move cuisine from metadata to top level."""
        enhanced: dict[str, Any] = {"metadata": {"cuisine": "Italian"}}

        _flatten_metadata(enhanced)

        assert enhanced.get("cuisine") == "Italian"
        assert "metadata" not in enhanced

    def test_moves_category_to_top_level(self) -> None:
        """Should move category from metadata to top level."""
        enhanced: dict[str, Any] = {"metadata": {"category": "Huvudrätt"}}

        _flatten_metadata(enhanced)

        assert enhanced.get("category") == "Huvudrätt"

    def test_moves_tags_to_top_level(self) -> None:
        """Should move tags from metadata to top level."""
        enhanced: dict[str, Any] = {"metadata": {"tags": ["quick", "easy"]}}

        _flatten_metadata(enhanced)

        assert enhanced.get("tags") == ["quick", "easy"]

    def test_does_not_overwrite_existing(self) -> None:
        """Should not overwrite existing top-level values."""
        enhanced: dict[str, Any] = {"cuisine": "Swedish", "metadata": {"cuisine": "Italian"}}

        _flatten_metadata(enhanced)

        assert enhanced["cuisine"] == "Swedish"

    def test_handles_missing_metadata(self) -> None:
        """Should handle recipe without metadata field."""
        enhanced: dict[str, Any] = {"title": "Test"}

        _flatten_metadata(enhanced)

        assert "metadata" not in enhanced
        assert enhanced["title"] == "Test"


class TestEnhanceRecipe:
    """Tests for enhance_recipe function."""

    def test_calls_gemini_with_correct_params(self) -> None:
        """Should call Gemini API with correct configuration."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps(
            {"title": "Enhanced Recipe", "ingredients": ["1 cup flour"], "instructions": ["Mix well"]}
        )
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt") as mock_prompt,
        ):
            enhance_recipe({"title": "Test", "ingredients": [], "instructions": []})

            mock_prompt.assert_called_once_with(
                DEFAULT_LANGUAGE, equipment=None, target_servings=4, people_count=2, dietary=None
            )
            mock_client.models.generate_content.assert_called_once()
            call_kwargs = mock_client.models.generate_content.call_args
            assert call_kwargs.kwargs["model"] == DEFAULT_MODEL

    def test_passes_language_to_system_prompt(self) -> None:
        """Should pass language parameter to load_system_prompt."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({"title": "Enhanced", "ingredients": [], "instructions": []})
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="English prompt") as mock_prompt,
        ):
            enhance_recipe({"title": "Test", "ingredients": [], "instructions": []}, language="en")

            mock_prompt.assert_called_once_with("en", equipment=None, target_servings=4, people_count=2, dietary=None)

    def test_converts_string_instructions_to_list(self) -> None:
        """Should convert string instructions to list."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps(
            {
                "title": "Test",
                "ingredients": [],
                "instructions": "Step 1\n\nStep 2",  # String, not list
            }
        )
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt"),
        ):
            result = enhance_recipe({"title": "Test", "ingredients": [], "instructions": []})

            assert isinstance(result["instructions"], list)
            assert "Step 1" in result["instructions"]
            assert "Step 2" in result["instructions"]

    def test_preserves_original_fields(self) -> None:
        """Should preserve original fields like URL and image."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({"title": "Enhanced", "ingredients": [], "instructions": []})
        mock_client.models.generate_content.return_value = mock_response

        original = {
            "title": "Original",
            "url": "https://example.com",
            "image_url": "https://example.com/img.jpg",
            "ingredients": [],
            "instructions": [],
        }

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt"),
        ):
            result = enhance_recipe(original)

            assert result["url"] == "https://example.com"
            assert result["image_url"] == "https://example.com/img.jpg"

    def test_raises_on_invalid_json_response(self) -> None:
        """Should raise EnhancementError on invalid JSON response."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Not valid JSON"
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt"),
            pytest.raises(EnhancementError, match="Failed to parse"),
        ):
            enhance_recipe({"title": "Test", "ingredients": [], "instructions": []})

    def test_normalizes_string_ingredients_to_list(self) -> None:
        """Should split newline-separated ingredient string into a list."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps(
            {"title": "Test", "ingredients": "1 cup flour\n2 eggs\nSalt", "instructions": ["Mix"]}
        )
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt"),
        ):
            result = enhance_recipe({"title": "Test", "ingredients": [], "instructions": []})

            assert result["ingredients"] == ["1 cup flour", "2 eggs", "Salt"]

    def test_raises_on_unsupported_ingredients_type(self) -> None:
        """Should raise EnhancementError when ingredients is neither list nor string."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({"title": "Test", "ingredients": 42, "instructions": ["Mix"]})
        mock_client.models.generate_content.return_value = mock_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test"}),
            patch("api.services.recipe_enhancer.get_genai_client", return_value=mock_client),
            patch("api.services.recipe_enhancer.load_system_prompt", return_value="System prompt"),
            pytest.raises(EnhancementError, match="Unsupported ingredients type"),
        ):
            enhance_recipe({"title": "Test", "ingredients": [], "instructions": []})
