"""Tests for api/services/prompt_loader.py."""

from pathlib import Path
from unittest.mock import patch

from api.services.prompt_loader import (
    get_prompts_dir,
    load_core_prompts,
    load_prompt_file,
    load_system_prompt,
    load_user_prompts,
    validate_prompts,
)


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
        """Should load content from user prompt files."""
        user_dir = tmp_path / "config" / "prompts" / "user"
        user_dir.mkdir(parents=True)

        (user_dir / "dietary.md").write_text("Dietary preferences", encoding="utf-8")
        (user_dir / "equipment.md").write_text("Kitchen equipment", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=tmp_path / "config" / "prompts"):
            result = load_user_prompts()

        assert "Dietary preferences" in result
        assert "Kitchen equipment" in result


class TestLoadSystemPrompt:
    """Tests for load_system_prompt function."""

    def test_returns_string(self) -> None:
        """Should return a string."""
        result = load_system_prompt()
        assert isinstance(result, str)

    def test_combines_core_and_user_prompts(self, tmp_path: Path) -> None:
        """Should combine core and user prompts with separator."""
        prompts_dir = tmp_path / "config" / "prompts"
        (prompts_dir / "core").mkdir(parents=True)
        (prompts_dir / "user").mkdir(parents=True)

        (prompts_dir / "core" / "base.md").write_text("Core content", encoding="utf-8")
        (prompts_dir / "user" / "dietary.md").write_text("User content", encoding="utf-8")

        with patch("api.services.prompt_loader.get_prompts_dir", return_value=prompts_dir):
            result = load_system_prompt()

        assert "Core content" in result
        assert "User content" in result
        assert "---" in result  # Separator between sections


class TestValidatePrompts:
    """Tests for validate_prompts function."""

    def test_returns_dict(self) -> None:
        """Should return a dictionary."""
        result = validate_prompts()
        assert isinstance(result, dict)

    def test_checks_expected_files(self) -> None:
        """Should check all expected prompt files."""
        result = validate_prompts()

        expected_keys = ["core/base.md", "core/formatting.md", "core/rules.md", "user/dietary.md", "user/equipment.md"]
        for key in expected_keys:
            assert key in result

    def test_values_are_booleans(self) -> None:
        """Should return boolean values for each file."""
        result = validate_prompts()
        for value in result.values():
            assert isinstance(value, bool)
