"""
Prompt Loader - Assembles system prompts from modular files.

The prompt system is split into:
- core/ - General instructions that apply to all users
- user/ - Language preference (static) + dietary preferences (dynamic from Firestore)
- locales/ - Language/country-specific formatting (measurements, products, brands)
- equipment - Dynamic prompt section generated from household equipment selection

Usage:
    from api.services.prompt_loader import load_system_prompt
    prompt = load_system_prompt("sv", equipment=["air_fryer", "convection_oven"])
"""

from __future__ import annotations

from pathlib import Path

from api.models.equipment import get_equipment_prompt
from api.services.dietary_prompt_builder import DietaryConfig, render_dietary_template

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


def load_user_prompts(language: str = DEFAULT_LANGUAGE, *, dietary: DietaryConfig | None = None) -> str:
    """Build user-specific prompts: language directive + dietary preferences.

    The language directive is loaded from a static file.  Dietary preferences
    are loaded from ``user/dietary.md`` and rendered through the conditional
    template engine using the household's Firestore config.
    """
    prompts_dir = get_prompts_dir() / "user"
    language_name = LANGUAGE_NAMES.get(language, language.capitalize())

    parts: list[str] = []

    language_content = load_prompt_file(prompts_dir / "language.md")
    if language_content:
        parts.append(language_content.replace("{language_name}", language_name))

    dietary_template = load_prompt_file(prompts_dir / "dietary.md")
    if dietary_template:
        dietary_section = render_dietary_template(dietary_template, dietary or DietaryConfig())
        if dietary_section.strip():
            parts.append(dietary_section)

    return "\n\n".join(parts)


def load_locale_prompt(language: str = DEFAULT_LANGUAGE) -> str:
    """Load locale-specific prompt file for the given language code.

    Locale files contain country/language-specific rules:
    measurements, dairy products, spice blends, ingredient availability.
    Falls back to empty string if no locale file exists.
    """
    locale_file = get_prompts_dir() / "locales" / f"{language}.md"
    return load_prompt_file(locale_file)


def load_system_prompt(
    language: str = DEFAULT_LANGUAGE,
    *,
    equipment: list[str] | None = None,
    target_servings: int = 4,
    people_count: int = 2,
    dietary: DietaryConfig | None = None,
) -> str:
    """
    Assemble the complete system prompt from all parts.

    Args:
        language: Language code (e.g., "sv", "en", "it") for locale-specific rules.
        equipment: List of equipment keys from the household's settings.
        target_servings: Number of servings to scale recipes to (from household settings).
        people_count: Number of people in the household (from household settings).
        dietary: Dietary preferences from household Firestore settings.

    Returns:
        Complete system prompt string combining core, locale, user, and equipment prompts.
    """
    core = load_core_prompts()
    locale = load_locale_prompt(language)
    user = load_user_prompts(language, dietary=dietary)
    equipment_section = get_equipment_prompt(equipment or [])

    parts = [p for p in (core, locale, user, equipment_section) if p]

    if not parts:
        prompts_dir = get_prompts_dir()
        msg = f"No prompt files found — prompts directory may be missing: {prompts_dir}"
        raise FileNotFoundError(msg)

    prompt = "\n\n---\n\n".join(parts)

    safe_servings = max(target_servings, 1)
    safe_people = max(people_count, 1)
    per_person = safe_servings / safe_people
    servings_per_person = int(per_person) if per_person == int(per_person) else round(per_person, 1)

    prompt = prompt.replace("{target_servings}", str(safe_servings))
    prompt = prompt.replace("{people_count}", str(safe_people))
    return prompt.replace("{servings_per_person}", str(servings_per_person))


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
        "user/language.md",
        "user/dietary.md",
    ]

    return {f: (prompts_dir / f).exists() for f in expected_files}
