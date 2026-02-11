"""
Prompt Loader - Assembles system prompts from modular files.

The prompt system is split into:
- core/ - General instructions that apply to all users
- user/ - User-specific preferences (dietary, equipment)
- locales/ - Language/country-specific formatting (measurements, products, brands)

Usage:
    from api.services.prompt_loader import load_system_prompt
    prompt = load_system_prompt("sv")
"""

from pathlib import Path

# Map language codes to full names for the language template
LANGUAGE_NAMES: dict[str, str] = {"sv": "Swedish", "en": "English", "it": "Italian"}

DEFAULT_LANGUAGE = "sv"


def get_prompts_dir() -> Path:
    """Get the prompts configuration directory."""
    # Look for config/prompts relative to the project root
    project_root = Path(__file__).parent.parent.parent
    return project_root / "config" / "prompts"


def load_prompt_file(file_path: Path) -> str:
    """Load a single prompt file."""
    if not file_path.exists():
        return ""
    return file_path.read_text(encoding="utf-8")


def load_core_prompts() -> str:
    """Load all core prompt files (general instructions)."""
    prompts_dir = get_prompts_dir() / "core"

    # Load in specific order for logical flow
    files = ["base.md", "formatting.md", "rules.md"]

    parts = []
    for filename in files:
        content = load_prompt_file(prompts_dir / filename)
        if content:
            parts.append(content)

    return "\n\n".join(parts)


def load_user_prompts(language: str = DEFAULT_LANGUAGE) -> str:
    """Load user-specific prompt files (dietary, equipment) with language template rendering."""
    prompts_dir = get_prompts_dir() / "user"
    language_name = LANGUAGE_NAMES.get(language, language.capitalize())

    files = ["language.md", "dietary.md", "equipment.md"]

    parts = []
    for filename in files:
        content = load_prompt_file(prompts_dir / filename)
        if content:
            content = content.replace("{language_name}", language_name)
            parts.append(content)

    return "\n\n".join(parts)


def load_locale_prompt(language: str = DEFAULT_LANGUAGE) -> str:
    """Load locale-specific prompt file for the given language code.

    Locale files contain country/language-specific rules:
    measurements, dairy products, spice blends, ingredient availability.
    Falls back to empty string if no locale file exists.
    """
    locale_file = get_prompts_dir() / "locales" / f"{language}.md"
    return load_prompt_file(locale_file)


def load_system_prompt(language: str = DEFAULT_LANGUAGE) -> str:
    """
    Assemble the complete system prompt from all parts.

    Args:
        language: Language code (e.g., "sv", "en", "it") for locale-specific rules.

    Returns:
        Complete system prompt string combining core, locale, and user prompts.
    """
    core = load_core_prompts()
    locale = load_locale_prompt(language)
    user = load_user_prompts(language)

    parts = [p for p in (core, locale, user) if p]

    if not parts:
        prompts_dir = get_prompts_dir()
        msg = f"No prompt files found — prompts directory may be missing: {prompts_dir}"
        raise FileNotFoundError(msg)

    return "\n\n---\n\n".join(parts)


def validate_prompts() -> dict[str, bool]:
    """
    Validate that all expected prompt files exist.

    Returns:
        Dict mapping file paths to existence status.
    """
    prompts_dir = get_prompts_dir()

    expected_files = [
        "core/base.md",
        "core/formatting.md",
        "core/rules.md",
        "locales/sv.md",
        "user/dietary.md",
        "user/equipment.md",
    ]

    return {f: (prompts_dir / f).exists() for f in expected_files}
