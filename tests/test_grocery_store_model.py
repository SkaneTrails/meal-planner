"""Tests for GroceryStore model and settings integration."""

import pytest

from api.models.settings import MAX_STORE_NAME_LENGTH, GroceryStore, HouseholdSettings, HouseholdSettingsUpdate


class TestGroceryStore:
    """Validation tests for the GroceryStore model."""

    def test_valid_store(self) -> None:
        store = GroceryStore(id="store_1", name="ICA Maxi")
        assert store.id == "store_1"
        assert store.name == "ICA Maxi"

    def test_name_with_special_chars(self) -> None:
        store = GroceryStore(id="s1", name="Lidl - Lund/City")
        assert store.name == "Lidl - Lund/City"

    def test_name_with_apostrophe(self) -> None:
        store = GroceryStore(id="s1", name="Trader Joe's")
        assert store.name == "Trader Joe's"

    def test_name_with_ampersand(self) -> None:
        store = GroceryStore(id="s1", name="Marks & Spencer")
        assert store.name == "Marks & Spencer"

    def test_name_stripped(self) -> None:
        store = GroceryStore(id="s1", name="  ICA  ")
        assert store.name == "ICA"

    def test_empty_name_rejected(self) -> None:
        with pytest.raises(ValueError, match="must not be empty"):
            GroceryStore(id="s1", name="")

    def test_whitespace_only_name_rejected(self) -> None:
        with pytest.raises(ValueError, match="must not be empty"):
            GroceryStore(id="s1", name="   ")

    def test_name_too_long(self) -> None:
        with pytest.raises(ValueError, match="at most"):
            GroceryStore(id="s1", name="A" * (MAX_STORE_NAME_LENGTH + 1))

    def test_name_at_max_length(self) -> None:
        store = GroceryStore(id="s1", name="A" * MAX_STORE_NAME_LENGTH)
        assert len(store.name) == MAX_STORE_NAME_LENGTH

    def test_name_with_invalid_chars_rejected(self) -> None:
        with pytest.raises(ValueError, match="may only contain"):
            GroceryStore(id="s1", name="ICA <script>")

    def test_non_string_name_rejected(self) -> None:
        with pytest.raises(TypeError, match="must be a string"):
            GroceryStore(id="s1", name=123)  # type: ignore[arg-type]


class TestHouseholdSettingsGroceryStores:
    """Integration of grocery_stores and active_store_id in HouseholdSettings."""

    def test_defaults_to_empty(self) -> None:
        settings = HouseholdSettings()
        assert settings.grocery_stores == []
        assert settings.active_store_id is None

    def test_with_stores(self) -> None:
        settings = HouseholdSettings(
            grocery_stores=[GroceryStore(id="s1", name="ICA"), GroceryStore(id="s2", name="Willys")],
            active_store_id="s1",
        )
        assert len(settings.grocery_stores) == 2
        assert settings.active_store_id == "s1"

    def test_null_grocery_stores_coerced_to_empty(self) -> None:
        """Firestore may return None for missing fields."""
        settings = HouseholdSettings(grocery_stores=None)  # type: ignore[arg-type]
        assert settings.grocery_stores == []

    def test_non_list_grocery_stores_coerced_to_empty(self) -> None:
        settings = HouseholdSettings(grocery_stores="invalid")  # type: ignore[arg-type]
        assert settings.grocery_stores == []

    def test_from_firestore_dict(self) -> None:
        """Simulate loading from Firestore document."""
        data = {
            "household_size": 3,
            "grocery_stores": [{"id": "s1", "name": "ICA Maxi"}, {"id": "s2", "name": "Coop"}],
            "active_store_id": "s2",
        }
        settings = HouseholdSettings(**data)
        assert len(settings.grocery_stores) == 2
        assert settings.grocery_stores[0].name == "ICA Maxi"
        assert settings.active_store_id == "s2"

    def test_from_firestore_dict_without_stores(self) -> None:
        """Legacy household without grocery_stores field."""
        data = {"household_size": 2, "language": "sv"}
        settings = HouseholdSettings(**data)
        assert settings.grocery_stores == []
        assert settings.active_store_id is None


class TestHouseholdSettingsUpdateGroceryStores:
    """Partial update model for grocery stores."""

    def test_omitted_fields_are_none(self) -> None:
        update = HouseholdSettingsUpdate()
        assert update.grocery_stores is None
        assert update.active_store_id is None

    def test_setting_stores(self) -> None:
        update = HouseholdSettingsUpdate(grocery_stores=[GroceryStore(id="s1", name="ICA")], active_store_id="s1")
        assert len(update.grocery_stores) == 1
        assert update.active_store_id == "s1"

    def test_null_coerced(self) -> None:
        update = HouseholdSettingsUpdate(grocery_stores=None)
        assert update.grocery_stores is None

    def test_non_list_coerced_to_none(self) -> None:
        update = HouseholdSettingsUpdate(grocery_stores="invalid")  # type: ignore[arg-type]
        assert update.grocery_stores is None

    def test_clearing_active_store(self) -> None:
        update = HouseholdSettingsUpdate(active_store_id=None)
        assert update.active_store_id is None
