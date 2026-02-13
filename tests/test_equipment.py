"""Tests for the equipment catalog and prompt generation."""

import pytest
from pydantic import ValidationError

from api.models.equipment import (
    EQUIPMENT_CATALOG,
    EQUIPMENT_CATEGORIES,
    get_equipment_by_category,
    get_equipment_prompt,
    get_valid_equipment_keys,
    validate_equipment_keys,
)
from api.models.settings import HouseholdSettings, HouseholdSettingsUpdate


class TestEquipmentCatalog:
    """Tests for the equipment catalog structure."""

    def test_all_keys_have_category_and_prompt_hint(self) -> None:
        """Every catalog entry must have both category and prompt_hint."""
        for key, meta in EQUIPMENT_CATALOG.items():
            assert "category" in meta, f"{key} missing category"
            assert "prompt_hint" in meta, f"{key} missing prompt_hint"

    def test_all_categories_are_valid(self) -> None:
        """Every catalog entry's category must be in EQUIPMENT_CATEGORIES."""
        for key, meta in EQUIPMENT_CATALOG.items():
            assert meta["category"] in EQUIPMENT_CATEGORIES, f"{key} has unknown category {meta['category']}"

    def test_catalog_has_expected_count(self) -> None:
        """Catalog should have 19 items."""
        assert len(EQUIPMENT_CATALOG) == 19

    def test_every_category_has_at_least_one_item(self) -> None:
        """Each defined category should have at least one equipment item."""
        categories_used = {meta["category"] for meta in EQUIPMENT_CATALOG.values()}
        for cat in EQUIPMENT_CATEGORIES:
            assert cat in categories_used, f"Category {cat} has no items"


class TestGetValidEquipmentKeys:
    """Tests for get_valid_equipment_keys."""

    def test_returns_set_of_strings(self) -> None:
        keys = get_valid_equipment_keys()
        assert isinstance(keys, set)
        assert all(isinstance(k, str) for k in keys)

    def test_matches_catalog_keys(self) -> None:
        assert get_valid_equipment_keys() == set(EQUIPMENT_CATALOG.keys())


class TestGetEquipmentByCategory:
    """Tests for get_equipment_by_category."""

    def test_groups_all_keys(self) -> None:
        """All catalog keys should appear in exactly one category group."""
        groups = get_equipment_by_category()
        all_grouped = [key for keys in groups.values() for key in keys]
        assert set(all_grouped) == set(EQUIPMENT_CATALOG.keys())

    def test_keys_match_categories(self) -> None:
        """Group dict keys should be a subset of EQUIPMENT_CATEGORIES."""
        groups = get_equipment_by_category()
        for cat in groups:
            assert cat in EQUIPMENT_CATEGORIES


class TestGetEquipmentPrompt:
    """Tests for get_equipment_prompt."""

    def test_empty_list_returns_standard_kitchen(self) -> None:
        result = get_equipment_prompt([])
        assert "Standard kitchen only" in result
        assert "Do not suggest" in result

    def test_single_item_included_in_prompt(self) -> None:
        result = get_equipment_prompt(["air_fryer"])
        assert "Air fryer" in result
        assert "unlisted equipment" in result

    def test_multiple_items_all_included(self) -> None:
        result = get_equipment_prompt(["air_fryer", "wok", "probe_thermometer"])
        assert "Air fryer" in result
        assert "Wok" in result
        assert "Probe thermometer" in result

    def test_invalid_keys_silently_ignored(self) -> None:
        result = get_equipment_prompt(["air_fryer", "teleporter"])
        assert "Air fryer" in result

    def test_only_invalid_keys_returns_standard(self) -> None:
        result = get_equipment_prompt(["teleporter", "replicator"])
        assert "Standard kitchen only" in result

    def test_prompt_has_header(self) -> None:
        result = get_equipment_prompt(["wok"])
        assert result.startswith("## Kitchen Equipment")

    def test_non_string_keys_ignored_without_crash(self) -> None:
        """Non-string items should be silently skipped, not cause TypeError."""
        result = get_equipment_prompt(["air_fryer", {"bad": "data"}, 42])
        assert "Air fryer" in result


class TestValidateEquipmentKeys:
    """Tests for validate_equipment_keys."""

    def test_valid_keys_returned_as_is(self) -> None:
        result = validate_equipment_keys(["air_fryer", "wok"])
        assert result == ["air_fryer", "wok"]

    def test_empty_list_returns_empty(self) -> None:
        assert validate_equipment_keys([]) == []

    def test_invalid_key_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Unknown equipment keys"):
            validate_equipment_keys(["air_fryer", "magic_wand"])

    def test_error_message_includes_invalid_key(self) -> None:
        with pytest.raises(ValueError, match="magic_wand"):
            validate_equipment_keys(["magic_wand"])

    def test_error_message_includes_valid_keys(self) -> None:
        with pytest.raises(ValueError, match="air_fryer"):
            validate_equipment_keys(["nope"])

    def test_non_string_keys_raise_value_error(self) -> None:
        """Non-string items (e.g. dicts from malformed JSON) should raise ValueError, not TypeError."""
        with pytest.raises(ValueError, match="must be strings"):
            validate_equipment_keys(["air_fryer", {"key": "value"}])

    def test_non_string_only_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="must be strings"):
            validate_equipment_keys([42, True])


class TestSettingsEquipmentField:
    """Tests for the equipment field on HouseholdSettings models."""

    def test_read_model_accepts_valid_keys(self) -> None:
        settings = HouseholdSettings(
            household_size=2,
            default_servings=2,
            language="en",
            dietary={"seafood_ok": True, "meat": "all", "minced_meat": "meat", "dairy": "regular"},
            equipment=["air_fryer", "wok"],
        )
        assert settings.equipment == ["air_fryer", "wok"]

    def test_read_model_accepts_empty_list(self) -> None:
        settings = HouseholdSettings(
            household_size=2,
            default_servings=2,
            language="en",
            dietary={"seafood_ok": True, "meat": "all", "minced_meat": "meat", "dairy": "regular"},
            equipment=[],
        )
        assert settings.equipment == []

    def test_read_model_converts_old_dict_to_empty_list(self) -> None:
        """Old boolean dict format from Firestore should silently become []."""
        settings = HouseholdSettings(
            household_size=2,
            default_servings=2,
            language="en",
            dietary={"seafood_ok": True, "meat": "all", "minced_meat": "meat", "dairy": "regular"},
            equipment={"airfryer": True, "convection_oven": True},
        )
        assert settings.equipment == []

    def test_update_model_rejects_invalid_keys(self) -> None:
        with pytest.raises(ValueError, match="Unknown equipment keys"):
            HouseholdSettingsUpdate(equipment=["air_fryer", "magic_wand"])

    def test_update_model_accepts_valid_keys(self) -> None:
        update = HouseholdSettingsUpdate(equipment=["air_fryer", "sous_vide"])
        assert update.equipment == ["air_fryer", "sous_vide"]

    def test_update_model_rejects_non_list_dict(self) -> None:
        with pytest.raises((ValidationError, TypeError)):
            HouseholdSettingsUpdate(equipment={"air_fryer": True})

    def test_update_model_rejects_non_list_string(self) -> None:
        with pytest.raises((ValidationError, TypeError)):
            HouseholdSettingsUpdate(equipment="air_fryer")

    def test_update_model_allows_none(self) -> None:
        update = HouseholdSettingsUpdate()
        assert update.equipment is None
