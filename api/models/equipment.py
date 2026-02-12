"""Kitchen equipment catalog for recipe enhancement.

To add new equipment:
1. Add a key to EQUIPMENT_CATALOG below with category and prompt_hint
2. Add i18n translations in mobile/lib/i18n/locales/{en,sv,it}.ts under equipment.items.<key>
3. That's it — the key is auto-validated, prompt auto-generated, UI auto-rendered
"""

from typing import Any

EQUIPMENT_CATEGORIES = ("appliances", "oven_features", "cookware", "tools")

# ──────────────────────────────────────────────────────────────────────
# Equipment catalog.
#
# Each entry maps an equipment key to:
#   category    - UI grouping (one of EQUIPMENT_CATEGORIES)
#   prompt_hint - one-liner injected into the Gemini system prompt
#
# To extend: just add a new entry. Everything else is derived.
# ──────────────────────────────────────────────────────────────────────

EQUIPMENT_CATALOG: dict[str, dict[str, str]] = {
    # ── Appliances ──────────────────────────────────────────────────
    "air_fryer": {
        "category": "appliances",
        "prompt_hint": (
            "Air fryer available — use for proteins, root vegetables, "
            "breaded items. No preheat needed. ~4 L capacity per batch."
        ),
    },
    "stand_mixer": {
        "category": "appliances",
        "prompt_hint": (
            "Stand mixer available — use for kneading dough, whipping cream/meringue, "
            "and mixing heavy batters instead of doing it by hand."
        ),
    },
    "food_processor": {
        "category": "appliances",
        "prompt_hint": (
            "Food processor available — use for pastry dough, pesto, hummus, "
            "slaws, and any task requiring fine chopping or pureeing."
        ),
    },
    "immersion_blender": {
        "category": "appliances",
        "prompt_hint": (
            "Immersion blender available — blend soups, sauces, and purees "
            "directly in the pot instead of transferring to a blender."
        ),
    },
    "pressure_cooker": {
        "category": "appliances",
        "prompt_hint": (
            "Pressure cooker available — use for beans, stocks, tough cuts "
            "of meat, and dishes that normally require long simmering."
        ),
    },
    "slow_cooker": {
        "category": "appliances",
        "prompt_hint": (
            "Slow cooker available — use for braises, stews, and dishes "
            "that benefit from low-and-slow cooking (6-8 hours)."
        ),
    },
    "sous_vide": {
        "category": "appliances",
        "prompt_hint": (
            "Sous vide circulator available — use for precise protein "
            "temperatures and consistent results. Finish with a quick sear."
        ),
    },
    # ── Oven features ──────────────────────────────────────────────
    "convection_oven": {
        "category": "oven_features",
        "prompt_hint": (
            "Convection/fan oven mode available — reduce temperatures by "
            "20-25°C compared to conventional recipes. Enables multi-tray cooking."
        ),
    },
    "grill_function": {
        "category": "oven_features",
        "prompt_hint": (
            "Oven grill/broil function available — use for crispy finishes, "
            "gratins, melting cheese, and browning the top of dishes."
        ),
    },
    "steam_oven": {
        "category": "oven_features",
        "prompt_hint": (
            "Steam oven available — use for fish, dumplings, vegetables, and bread (steam injection for better crust)."
        ),
    },
    # ── Cookware ────────────────────────────────────────────────────
    "dutch_oven": {
        "category": "cookware",
        "prompt_hint": (
            "Dutch oven (cast iron pot with lid) available — use for braising, "
            "bread baking, and stovetop-to-oven transitions."
        ),
    },
    "cast_iron_skillet": {
        "category": "cookware",
        "prompt_hint": (
            "Cast iron skillet available — preheat 5 min on high for proper sear. "
            "Excellent heat retention for steaks, cornbread, and pan sauces."
        ),
    },
    "wok": {
        "category": "cookware",
        "prompt_hint": (
            "Wok available — use for stir-fries with high heat. "
            "Cook in small batches to maintain temperature. Add aromatics last."
        ),
    },
    # ── Tools ──────────────────────────────────────────────────────
    "probe_thermometer": {
        "category": "tools",
        "prompt_hint": (
            "Probe thermometer available — specify exact internal temperatures "
            "for proteins (e.g. chicken 74°C, beef medium 57°C) instead of vague doneness."
        ),
    },
    "kitchen_torch": {
        "category": "tools",
        "prompt_hint": (
            "Kitchen torch available — use for crème brûlée, charring peppers, "
            "melting cheese on top, and finishing meringue."
        ),
    },
}


def get_valid_equipment_keys() -> set[str]:
    """Return the set of all valid equipment keys."""
    return set(EQUIPMENT_CATALOG.keys())


def get_equipment_by_category() -> dict[str, list[str]]:
    """Return equipment keys grouped by category, preserving catalog insertion order."""
    groups: dict[str, list[str]] = {cat: [] for cat in EQUIPMENT_CATEGORIES}
    for key, meta in EQUIPMENT_CATALOG.items():
        groups[meta["category"]].append(key)
    return {cat: keys for cat, keys in groups.items() if keys}


def get_equipment_prompt(equipment: list[str]) -> str:
    """Build a Gemini prompt section from the household's selected equipment.

    Args:
        equipment: List of equipment keys selected by the household.

    Returns:
        Markdown-formatted prompt section listing available equipment,
        or a note that only standard stovetop/oven is assumed.
    """
    if not equipment:
        return (
            "## Kitchen Equipment\n\n"
            "Standard kitchen only: stovetop and oven. "
            "Do not suggest any specialty appliances or cookware."
        )

    valid_keys = get_valid_equipment_keys()
    hints = [EQUIPMENT_CATALOG[key]["prompt_hint"] for key in equipment if key in valid_keys]

    if not hints:
        return (
            "## Kitchen Equipment\n\n"
            "Standard kitchen only: stovetop and oven. "
            "Do not suggest any specialty appliances or cookware."
        )

    lines = "\n".join(f"- {hint}" for hint in hints)
    return (
        "## Kitchen Equipment\n\n"
        "The household has the following equipment in addition to standard stovetop and oven:\n\n"
        f"{lines}\n\n"
        "Optimize recipes to use this equipment where it genuinely improves "
        "the dish. Evaluate each component independently — use the best tool "
        "for each element. Do NOT suggest equipment not listed above."
    )


def validate_equipment_keys(keys: list[Any]) -> list[str]:
    """Validate and filter equipment keys against the catalog.

    Args:
        keys: Raw list that may contain invalid keys.

    Returns:
        List of valid equipment keys only.

    Raises:
        ValueError: If any key is not in the catalog.
    """
    valid = get_valid_equipment_keys()
    invalid = [k for k in keys if k not in valid]
    if invalid:
        msg = f"Unknown equipment keys: {', '.join(str(k) for k in invalid)}. Valid keys: {', '.join(sorted(valid))}"
        raise ValueError(msg)
    return [str(k) for k in keys]
