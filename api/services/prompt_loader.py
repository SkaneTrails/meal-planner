"""
Prompt Loader - Assembles system prompts from modular files.

The prompt system is split into:
- core/ - General instructions that apply to all users
- user/ - User-specific preferences (dietary, equipment)

Usage:
    from api.services.prompt_loader import load_system_prompt
    prompt = load_system_prompt()
"""

from pathlib import Path


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


def load_user_prompts() -> str:
    """Load user-specific prompt files (dietary, equipment)."""
    prompts_dir = get_prompts_dir() / "user"

    files = ["language.md", "dietary.md", "equipment.md"]

    parts = []
    for filename in files:
        content = load_prompt_file(prompts_dir / filename)
        if content:
            parts.append(content)

    return "\n\n".join(parts)


def load_system_prompt() -> str:
    """
    Assemble the complete system prompt from all parts.

    Returns:
        Complete system prompt string combining core and user prompts.
    """
    core = load_core_prompts()
    user = load_user_prompts()

    # Combine with clear section separation
    parts = []
    if core:
        parts.append(core)
    if user:
        parts.append(user)

    return "\n\n---\n\n".join(parts)


def validate_prompts() -> dict[str, bool]:
    """
    Validate that all expected prompt files exist.

    Returns:
        Dict mapping file paths to existence status.
    """
    prompts_dir = get_prompts_dir()

    expected_files = ["core/base.md", "core/formatting.md", "core/rules.md", "user/dietary.md", "user/equipment.md"]

    return {f: (prompts_dir / f).exists() for f in expected_files}
