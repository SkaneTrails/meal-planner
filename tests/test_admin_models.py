"""Tests for admin Pydantic models (household name validation)."""

import pytest

from api.models.admin import _validate_household_name


class TestValidateHouseholdName:
    """Direct unit tests for _validate_household_name edge cases."""

    def test_valid_name(self) -> None:
        assert _validate_household_name("Smith Family") == "Smith Family"

    def test_strips_whitespace(self) -> None:
        assert _validate_household_name("  Smith Family  ") == "Smith Family"

    def test_empty_after_strip_raises(self) -> None:
        with pytest.raises(ValueError, match="cannot be empty"):
            _validate_household_name("   ")

    def test_too_long_raises(self) -> None:
        with pytest.raises(ValueError, match="cannot exceed 100"):
            _validate_household_name("A" * 101)

    def test_exactly_100_chars_allowed(self) -> None:
        name = "A" * 100
        assert _validate_household_name(name) == name

    def test_invalid_characters_raises(self) -> None:
        with pytest.raises(ValueError, match="letters, numbers"):
            _validate_household_name("Test<script>")

    def test_allows_hyphens_and_apostrophes(self) -> None:
        assert _validate_household_name("O'Brien-Smith") == "O'Brien-Smith"

    def test_allows_accented_characters(self) -> None:
        assert _validate_household_name("Família Müller") == "Família Müller"

    def test_rejects_special_symbols(self) -> None:
        with pytest.raises(ValueError, match="letters, numbers"):
            _validate_household_name("Family @home!")
