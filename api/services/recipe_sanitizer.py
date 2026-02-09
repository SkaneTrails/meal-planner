"""Sanitize recipe data before sending to Gemini AI.

Prevents prompt injection by stripping patterns that could manipulate
the LLM system prompt. Applied as a pre-processing step before
enhancement — does NOT modify stored recipe data.
"""

import re

# Patterns commonly used in prompt injection attempts
_INJECTION_PATTERNS = re.compile(
    r"(?:"
    r"ignore (?:all )?(?:previous|above|prior) (?:instructions|prompts|rules)"
    r"|you are now"
    r"|act as"
    r"|system:\s"
    r"|<\|(?:im_start|im_end|system|endoftext)\|>"
    r"|```(?:system|prompt)"
    r"|IMPORTANT:\s*(?:ignore|override|forget)"
    r")",
    re.IGNORECASE,
)


def sanitize_for_llm(text: str) -> str:
    """Remove prompt injection patterns from text.

    Args:
        text: Raw recipe text (ingredient, instruction, etc.)

    Returns:
        Cleaned text with injection patterns removed.
    """
    return _INJECTION_PATTERNS.sub("[removed]", text)


def sanitize_recipe_for_enhancement(recipe: dict) -> dict:
    """Sanitize a full recipe dict before sending to Gemini.

    Creates a copy with sanitized text fields. Does not modify the original.
    Strips PII fields (created_by, household_id) that should never reach the LLM.

    Args:
        recipe: Recipe dict (from model_dump())

    Returns:
        Sanitized copy safe for LLM input.
    """
    sanitized = dict(recipe)

    # Strip PII fields
    for pii_field in ("created_by", "household_id", "id", "created_at", "updated_at"):
        sanitized.pop(pii_field, None)

    # Sanitize text fields
    if "title" in sanitized:
        sanitized["title"] = sanitize_for_llm(str(sanitized["title"]))

    if "ingredients" in sanitized and isinstance(sanitized["ingredients"], list):
        sanitized["ingredients"] = [sanitize_for_llm(str(ing)) for ing in sanitized["ingredients"]]

    if "instructions" in sanitized and isinstance(sanitized["instructions"], list):
        sanitized["instructions"] = [sanitize_for_llm(str(inst)) for inst in sanitized["instructions"]]

    if sanitized.get("tips"):
        sanitized["tips"] = sanitize_for_llm(str(sanitized["tips"]))

    return sanitized
