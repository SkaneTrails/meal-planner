"""Tests for api/services/prompt_loader.py."""

from pathlib import Path
from unittest.mock import patch

import pytest

from api.services.prompt_loader import (
    DEFAULT_LANGUAGE,
    LANGUAGE_NAMES,
    get_prompts_dir,
    load_core_prompts,
    load_locale_prompt,
    load_prompt_file,
    load_system_prompt,
    load_user_prompts,
    validate_prompts,
)


class TestConstants:
    """Tests for module-level constants."""

    def test_default_language_is_swedish(self) -> None:
        """Default language should be Swedish."""
        assert DEFAULT_LANGUAGE == "sv"

    def test_language_names_contains_supported_languages(self) -> None:
        """Should map sv, en, it to full names."""
        assert LANGUAGE_NAMES["sv"] == "Swedish"
        assert LANGUAGE_NAMES["en"] == "English"
        assert LANGUAGE_NAMES["it"] == "Italian"


class TestGetPromptsDir:
    """Tests for get_prompts_dir function."""

    def test_returns_path_object(self) -> None:
        """Should return a Path object."""
        result = get_prompts_dir()
        assert isinstance(result, Path)

    def test_points_to_config_prompts(self) -> None:
        """Should point to config/prompts directory."""
        result = get_prompts_dir()
        assert result.parts[-2:] == ("config", "prompts")


class TestLoadPromptFile:
    """Tests for load_prompt_file function."""

    def test_returns_empty_string_for_nonexistent_file(self) -> None:
        """Should return empty string if file doesn't exist."""
        fake_path = Path("/nonexistent/file.md")
        result = load_prompt_file(fake_path)
        assert result == ""

    def test_loads_existing_file(self, tmp_path: Path) -> None:
        """Should load content from existing file."""
        test_file = tmp_path / "test.md"
        test_file.write_text("# Test Content\nSome text here.", encoding="utf-8")

        result = load_prompt_file(test_file)
        assert result == "# Test Content\nSome text here."

    def test_handles_utf8_content(self, tmp_path: Path) -> None:
        """Should correctly handle UTF-8 content (Swedish characters)."""
        test_file = tmp_path / "swedish.md"
        test_file.write_text("Använd ½ tsk salt", encoding="utf-8")

        result = load_prompt_file(test_file)
        assert "½" in result
        assert "Använd" in result


class TestLoadCorePrompts:
    """Tests for load_core_prompts function."""

    def test_returns_string(self) -> None:
        """Should return a string."""
        result = load_core_prompts()
        assert isinstance(result, str)

    def test_loads_core_prompt_files(self) -> None:
        """Should load content from core prompt files if they exist."""
        prompts_dir = get_prompts_dir() / "core"
        if (prompts_dir / "base.md").exists():
            result = load_core_prompts()
            assert len(result) > 0

    def test_combines_multiple_files(self, tmp_path: Path) -> None:
        """Should combine content from multiple files."""
        core_dir = tmp_path / "config" / "prompts" / "core"
        core_dir.mkdir(parents=True)

        (core_dir / "base.md").write_text("Base content", encoding="utf-8")
        (core_dir / "formatting.md").write_text("Formatting content", encoding="utf-8")
        (core_dir / "rules.md").write_text("Rules content", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_core_prompts()

        assert "Base content" in result
        assert "Formatting content" in result
        assert "Rules content" in result


class TestLoadUserPrompts:
    """Tests for load_user_prompts function."""

    def test_returns_string(self) -> None:
        """Should return a string."""
        result = load_user_prompts()
        assert isinstance(result, str)

    def test_loads_user_prompt_files(self, tmp_path: Path) -> None:
        """Should load content from user prompt files (dietary only, equipment is dynamic)."""
        user_dir = tmp_path / "config" / "prompts" / "user"
        user_dir.mkdir(parents=True)

        (user_dir / "dietary.md").write_text("Dietary preferences", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_user_prompts()

        assert "Dietary preferences" in result

    def test_renders_language_template_swedish(self, tmp_path: Path) -> None:
        """Should render {language_name} as Swedish for sv."""
        user_dir = tmp_path / "config" / "prompts" / "user"
        user_dir.mkdir(parents=True)

        (user_dir / "language.md").write_text("Output in {language_name}", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_user_prompts("sv")

        assert "Output in Swedish" in result

    def test_renders_language_template_english(self, tmp_path: Path) -> None:
        """Should render {language_name} as English for en."""
        user_dir = tmp_path / "config" / "prompts" / "user"
        user_dir.mkdir(parents=True)

        (user_dir / "language.md").write_text("Output in {language_name}", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_user_prompts("en")

        assert "Output in English" in result

    def test_capitalizes_unknown_language(self, tmp_path: Path) -> None:
        """Should capitalize unknown language codes."""
        user_dir = tmp_path / "config" / "prompts" / "user"
        user_dir.mkdir(parents=True)

        (user_dir / "language.md").write_text("Output in {language_name}", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_user_prompts("fr")

        assert "Output in Fr" in result


class TestLoadLocalePrompt:
    """Tests for load_locale_prompt function."""

    def test_loads_existing_locale(self, tmp_path: Path) -> None:
        """Should load locale file when it exists."""
        locale_dir = tmp_path / "config" / "prompts" / "locales"
        locale_dir.mkdir(parents=True)

        (locale_dir / "sv.md").write_text("Swedish locale content", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_locale_prompt("sv")

        assert result == "Swedish locale content"

    def test_returns_empty_for_missing_locale(self) -> None:
        """Should return empty string for unsupported locale."""
        result = load_locale_prompt("xx")
        assert result == ""

    def test_defaults_to_swedish(self, tmp_path: Path) -> None:
        """Should default to Swedish locale."""
        locale_dir = tmp_path / "config" / "prompts" / "locales"
        locale_dir.mkdir(parents=True)

        (locale_dir / "sv.md").write_text("Swedish", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_locale_prompt()

        assert result == "Swedish"


class TestLoadSystemPrompt:
    """Tests for load_system_prompt function."""

    def test_returns_string(self) -> None:
        """Should return a string."""
        result = load_system_prompt()
        assert isinstance(result, str)

    def test_combines_core_locale_and_user_prompts(self, tmp_path: Path) -> None:
        """Should combine core, locale, user, and equipment prompts with separators."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "locales").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core content", encoding="utf-8")
        (prompts_dir / "locales" / "sv.md").write_text("Swedish locale", encoding="utf-8")
        (prompts_dir / "user" / "dietary.md").write_text("User content", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv")

        assert "Core content" in result
        assert "Swedish locale" in result
        assert "User content" in result
        assert "Kitchen Equipment" in result
        assert result.count("---") == 3

    def test_omits_locale_when_missing(self, tmp_path: Path) -> None:
        """Should work without locale file (core + user + equipment)."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core content", encoding="utf-8")
        (prompts_dir / "user" / "dietary.md").write_text("User content", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("xx")

        assert "Core content" in result
        assert "User content" in result
        assert result.count("---") == 2

    def test_passes_language_to_user_prompts(self, tmp_path: Path) -> None:
        """Should pass language code for template rendering."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core", encoding="utf-8")
        (prompts_dir / "user" / "language.md").write_text("Output in {language_name}", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("en")

        assert "Output in English" in result

    def test_returns_equipment_only_when_no_prompt_files(self, tmp_path: Path) -> None:
        """Should still return equipment prompt even when prompts directory is missing."""
        empty_dir = tmp_path / "missing" / "prompts"

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=empty_dir):
            result = load_system_prompt()

        assert "Kitchen Equipment" in result

    def test_equipment_param_included_in_prompt(self, tmp_path: Path) -> None:
        """Should include selected equipment hints in the system prompt."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("en", equipment=["air_fryer", "wok"])

        assert "Air fryer" in result
        assert "Wok" in result

    def test_no_equipment_shows_standard_kitchen(self, tmp_path: Path) -> None:
        """Should show standard kitchen message when no equipment selected."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("en", equipment=[])

        assert "Standard kitchen only" in result

    def test_renders_target_servings_placeholder(self, tmp_path: Path) -> None:
        """Should replace {target_servings} with the given value."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Scale to {target_servings} servings", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv", target_servings=6)

        assert "Scale to 6 servings" in result
        assert "{target_servings}" not in result

    def test_renders_people_count_placeholder(self, tmp_path: Path) -> None:
        """Should replace {people_count} with the given value."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Household of {people_count} people", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv", people_count=3)

        assert "Household of 3 people" in result
        assert "{people_count}" not in result

    def test_renders_servings_per_person_even(self, tmp_path: Path) -> None:
        """Should compute servings_per_person correctly for even division."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("{servings_per_person} each", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv", target_servings=6, people_count=2)

        assert "3 each" in result

    def test_renders_servings_per_person_uneven(self, tmp_path: Path) -> None:
        """Should handle non-divisible servings/people with rounding."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("{servings_per_person} each", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv", target_servings=5, people_count=2)

        assert "2.5 each" in result

    def test_default_values_render_correctly(self, tmp_path: Path) -> None:
        """Should render defaults (4 servings, 2 people, 2 per person)."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text(
            "{target_servings}s {people_count}p {servings_per_person}pp", encoding="utf-8"
        )

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv")

        assert "4s 2p 2pp" in result

    def test_no_leftover_placeholders(self, tmp_path: Path) -> None:
        """Should not leave any unreplaced placeholders in the output."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text(
            "{target_servings} {people_count} {servings_per_person}", encoding="utf-8"
        )

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt("sv", target_servings=8, people_count=4)

        assert "{" not in result


class TestValidatePrompts:
    """Tests for validate_prompts function."""

    def test_returns_dict(self) -> None:
        """Should return a dictionary."""
        result = validate_prompts()
        assert isinstance(result, dict)

    def test_checks_expected_files(self) -> None:
        """Should check all expected prompt files."""
        result = validate_prompts()

        expected_keys = [
            "core/base.md",
            "core/formatting.md",
            "core/rules.md",
            "locales/sv.md",
            "user/language.md",
            "user/dietary.md",
        ]
        for key in expected_keys:
            assert key in result

    def test_values_are_booleans(self) -> None:
        """Should return boolean values for each file."""
        result = validate_prompts()
        for value in result.values():
            assert isinstance(value, bool)


class TestLoadSystemPromptErrors:
    """Tests for load_system_prompt error cases."""

    def test_raises_file_not_found_when_no_prompts(self, tmp_path: Path) -> None:
        """Should raise FileNotFoundError when all prompt files are empty/missing."""
        empty_prompts_dir = tmp_path / "config" / "prompts"
        empty_prompts_dir.mkdir(parents=True)

        with (
            patch("api.services.prompt_loader.get_prompts_dir", return_value=empty_prompts_dir),
            patch("api.services.prompt_loader.get_equipment_prompt", return_value=""),
            pytest.raises(FileNotFoundError, match="No prompt files found"),
        ):
            load_system_prompt("en")
