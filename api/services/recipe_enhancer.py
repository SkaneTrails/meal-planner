"""
Recipe Enhancement Service - Enhance recipes using Gemini AI.

This module provides the core enhancement functionality for the API.
It uses the modular prompt system from prompt_loader.
"""

from __future__ import annotations

import json
import os
import re
import warnings
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from api.services.prompt_loader import DEFAULT_LANGUAGE, load_system_prompt
from api.services.recipe_sanitizer import sanitize_recipe_for_enhancement

if TYPE_CHECKING:
    from google import genai as genai_module

# Check for google-genai availability
# WORKAROUND: google-genai uses _UnionGenericAlias which is deprecated in Python 3.14+
# See: https://github.com/googleapis/python-genai/issues - needs upstream fix
try:  # pragma: no cover
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=DeprecationWarning, message=".*_UnionGenericAlias.*")
        from google import genai
        from google.genai import types

    GENAI_AVAILABLE = True
except ImportError:  # pragma: no cover
    GENAI_AVAILABLE = False
    genai = None  # type: ignore[assignment]
    types = None  # type: ignore[assignment]

# Default Gemini model
DEFAULT_MODEL = "gemini-2.5-flash"


class EnhancementError(Exception):
    """Raised when recipe enhancement fails."""


def get_genai_client() -> genai_module.Client:
    """Get configured Gemini client."""
    if not GENAI_AVAILABLE:
        msg = "google-genai is not installed. Install with: uv add google-genai"
        raise EnhancementError(msg)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        msg = "GOOGLE_API_KEY environment variable not set"
        raise EnhancementError(msg)

    return genai.Client(api_key=api_key)


def _format_recipe_text(recipe: dict[str, Any]) -> str:
    """Format recipe as text for Gemini input."""
    ingredients = recipe.get("ingredients", [])
    instructions = recipe.get("instructions", [])
    instructions_text = "\n".join(instructions) if isinstance(instructions, list) else instructions

    return f"""
Title: {recipe.get("title", "Unknown")}

Ingredients:
{chr(10).join(f"- {ing}" for ing in ingredients)}

Instructions:
{instructions_text}
"""


def _parse_instructions(instructions: str) -> list[str]:
    """Parse instruction string into list, splitting on timeline markers or paragraphs."""
    parts = re.split(r"\n\n(?=⏱️)", instructions)
    if len(parts) == 1:
        parts = instructions.split("\n\n")
    return [p.strip() for p in parts if p.strip()]


def _validate_response(response: Any) -> str:
    """Validate Gemini response and return text, raising on empty."""
    if not response.text:
        msg = "Gemini returned empty response"
        raise EnhancementError(msg)
    return response.text


def _preserve_original_fields(enhanced: dict[str, Any], original: dict[str, Any]) -> None:
    """Copy fields from original recipe that should be preserved."""
    preserve_fields = [
        "url",
        "image_url",
        "servings",
        "prep_time",
        "cook_time",
        "total_time",
        "meal_label",
        "diet_label",
        "created_at",
    ]
    for field in preserve_fields:
        if original.get(field) and not enhanced.get(field):
            enhanced[field] = original[field]


def _flatten_metadata(enhanced: dict[str, Any]) -> None:
    """Move nested metadata fields to top level."""
    metadata = enhanced.pop("metadata", {})
    if metadata:
        for key in ["cuisine", "category", "tags"]:
            if metadata.get(key) and not enhanced.get(key):
                enhanced[key] = metadata[key]


def enhance_recipe(
    recipe: dict[str, Any], *, model: str = DEFAULT_MODEL, language: str = DEFAULT_LANGUAGE
) -> dict[str, Any]:
    """
    Enhance a recipe using Gemini AI.

    Args:
        recipe: Original recipe dict with title, ingredients, instructions
        model: Gemini model to use (default: gemini-2.5-flash)
        language: Language code for locale-specific rules (default: sv)

    Returns:
        Enhanced recipe dict with improved ingredients, instructions, tips

    Raises:
        EnhancementError: If enhancement fails
    """
    client = get_genai_client()
    system_prompt = load_system_prompt(language)
    sanitized = sanitize_recipe_for_enhancement(recipe)
    recipe_text = _format_recipe_text(sanitized)

    try:
        response = client.models.generate_content(
            model=model,
            contents=recipe_text,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt, temperature=0.3, response_mime_type="application/json"
            ),
        )

        response_text = _validate_response(response)
        enhanced = json.loads(response_text)

        # Ensure instructions is a list
        if isinstance(enhanced.get("instructions"), str):
            enhanced["instructions"] = _parse_instructions(enhanced["instructions"])

        # Add timestamps and preserve original fields
        enhanced["updated_at"] = datetime.now(UTC)
        _preserve_original_fields(enhanced, recipe)
        _flatten_metadata(enhanced)

        return enhanced

    except json.JSONDecodeError as e:
        msg = f"Failed to parse Gemini response: {e}"
        raise EnhancementError(msg) from e
    except EnhancementError:
        raise
    except Exception as e:  # pragma: no cover
        msg = f"Enhancement failed: {e}"
        raise EnhancementError(msg) from e
