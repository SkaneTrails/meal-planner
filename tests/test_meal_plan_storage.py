"""Tests for meal plan storage service."""

from unittest.mock import MagicMock, patch

import pytest

from app.storage.meal_plan_storage import (
    _firestore_to_meal_plan,
    _meal_plan_to_firestore,
    load_day_notes,
    update_day_note,
)


class TestMealPlanConversion:
    """Tests for meal plan conversion functions."""

    def test_meal_plan_to_firestore_empty(self):
        """Test converting empty meal plan to Firestore format."""
        result = _meal_plan_to_firestore({})
        assert result["meals"] == {}
        assert "updated_at" in result

    def test_meal_plan_to_firestore_with_meals(self):
        """Test converting meal plan with meals to Firestore format."""
        meal_plan = {
            ("2025-01-15", "breakfast"): "recipe_123",
            ("2025-01-15", "lunch"): "custom:Sandwich",
        }
        result = _meal_plan_to_firestore(meal_plan)
        assert result["meals"]["2025-01-15_breakfast"] == "recipe_123"
        assert result["meals"]["2025-01-15_lunch"] == "custom:Sandwich"

    def test_firestore_to_meal_plan_empty(self):
        """Test converting empty Firestore data to meal plan."""
        result = _firestore_to_meal_plan({})
        assert result == {}

    def test_firestore_to_meal_plan_with_meals(self):
        """Test converting Firestore data with meals to meal plan."""
        data = {
            "meals": {
                "2025-01-15_breakfast": "recipe_123",
                "2025-01-15_dinner": "recipe_456",
            }
        }
        result = _firestore_to_meal_plan(data)
        assert result[("2025-01-15", "breakfast")] == "recipe_123"
        assert result[("2025-01-15", "dinner")] == "recipe_456"


class TestDayNotes:
    """Tests for day notes storage functions."""

    @patch("app.storage.meal_plan_storage.get_firestore_client")
    def test_load_day_notes_empty_doc(self, mock_get_client):
        """Test loading notes when document doesn't exist."""
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = load_day_notes()
        assert result == {}

    @patch("app.storage.meal_plan_storage.get_firestore_client")
    def test_load_day_notes_no_notes(self, mock_get_client):
        """Test loading notes when document has no notes field."""
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"meals": {}}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = load_day_notes()
        assert result == {}

    @patch("app.storage.meal_plan_storage.get_firestore_client")
    def test_load_day_notes_with_notes(self, mock_get_client):
        """Test loading notes when document has notes."""
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "meals": {},
            "notes": {"2025-01-15": "office", "2025-01-16": "home"},
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        result = load_day_notes()
        assert result == {"2025-01-15": "office", "2025-01-16": "home"}

    @patch("app.storage.meal_plan_storage.get_firestore_client")
    def test_update_day_note_set(self, mock_get_client):
        """Test setting a day note."""
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        update_day_note("2025-01-15", "office")

        mock_doc_ref.set.assert_called_once()
        call_args = mock_doc_ref.set.call_args
        assert call_args[0][0]["notes"] == {"2025-01-15": "office"}
        assert call_args[1]["merge"] is True

    @patch("app.storage.meal_plan_storage.get_firestore_client")
    def test_update_day_note_delete(self, mock_get_client):
        """Test deleting a day note by setting empty string."""
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        update_day_note("2025-01-15", "")

        mock_doc_ref.update.assert_called_once()
