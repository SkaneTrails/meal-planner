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
            "Air fryer available — NEVER preheat (heats instantly). "
            "~4 L basket capacity. Only use when ALL food fits in a single batch. "
            "If it requires multiple batches, prefer the oven — first batch goes "
            "cold while the second cooks. Best for: small quantities of proteins, "
            "root vegetables, breaded items."
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
    "pasta_machine": {
        "category": "appliances",
        "prompt_hint": (
            "Pasta machine (roller) available — use for fresh pasta sheets, "
            "fettuccine, tagliatelle. Specify thickness settings (e.g. setting 6 for "
            "tagliatelle, setting 8-9 for lasagne). Include resting and drying times."
        ),
    },
    "pizza_oven": {
        "category": "appliances",
        "prompt_hint": (
            "Dedicated pizza oven available (reaches 400-500°C). Bake time "
            "60-90 seconds. Use high-hydration dough, 00 flour recommended. "
            "Turn pizza halfway through. Completely replaces standard oven for pizza."
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
    "pizza_stone": {
        "category": "cookware",
        "prompt_hint": (
            "Pizza stone/baking steel available — preheat at max oven temp "
            "for 45-60 min. Place pizza/bread directly on stone for crisp base. "
            "Also great for flatbreads and naan."
        ),
    },
    # ── Tools ──────────────────────────────────────────────────────
    "outdoor_grill": {
        "category": "tools",
        "prompt_hint": (
            "Outdoor grill (charcoal or gas) available — use for proteins, "
            "vegetables, and pizza. Provide direct vs indirect heat zones, "
            "lid-on vs lid-off guidance, and internal temperatures."
        ),
    },
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
    str_keys = [k for k in equipment if isinstance(k, str)]
    hints = [EQUIPMENT_CATALOG[key]["prompt_hint"] for key in str_keys if key in valid_keys]

    if not hints:
        return (
            "## Kitchen Equipment\n\n"
            "Standard kitchen only: stovetop and oven. "
            "Do not suggest any specialty appliances or cookware."
        )

    lines = "\n".join(f"- {hint}" for hint in hints)
    return (
        "## Kitchen Equipment\n\n"
        "Available (in addition to stovetop and oven):\n\n"
        f"{lines}\n\n"
        "Actively consider EVERY listed item above — not just the air fryer. "
        "For each recipe component, pick the tool that produces the best result "
        "(e.g. wok for stir-fries, cast iron for searing, probe thermometer for "
        "doneness). Use multiple tools in parallel when it saves time or improves "
        "quality. For split proteins, cook each with the best tool. "
        "When both oven and air fryer can handle a component, use the OVEN as "
        "default (larger capacity, reliable for 4-portion quantities) and offer "
        "the air fryer as a 💡 ALTERNATIV tip for when the quantity fits in one "
        "batch. "
        "Do NOT suggest unlisted equipment."
    )


def validate_equipment_keys(keys: list[Any]) -> list[str]:
    """Validate and filter equipment keys against the catalog.

    Args:
        keys: Raw list that may contain invalid keys.

    Returns:
        List of valid equipment keys only.

    Raises:
        ValueError: If any key is not a string or not in the catalog.
    """
    non_str = [k for k in keys if not isinstance(k, str)]
    if non_str:
        msg = f"Equipment keys must be strings. Received non-string values: {', '.join(str(k) for k in non_str)}"
        raise ValueError(msg)

    valid = get_valid_equipment_keys()
    invalid = [k for k in keys if k not in valid]
    if invalid:
        msg = f"Unknown equipment keys: {', '.join(invalid)}. Valid keys: {', '.join(sorted(valid))}"
        raise ValueError(msg)
    return list(keys)
