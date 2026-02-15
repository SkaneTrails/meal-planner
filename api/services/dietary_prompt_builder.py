"""Dietary Prompt Builder — renders dietary.md template from household config.

Evaluates conditional section markers in dietary.md based on the
household's Firestore dietary settings.  The actual cooking wisdom
stays in the markdown template; this module only controls *which*
sections to include, while placeholder variables are resolved later by
the prompt loader.

Conditional markers use ``<!-- BEGIN:tag -->`` / ``<!-- END:tag -->``
syntax.  Sections whose tag is not in the active set are stripped.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Pattern: <!-- BEGIN:tag --> ... <!-- END:tag -->  (DOTALL for multiline)
_SECTION_RE = re.compile(r"<!-- BEGIN:(\w+) -->\n(.*?)<!-- END:\1 -->\n?", re.DOTALL)


@dataclass(frozen=True)
class DietaryConfig:
    """Dietary preferences loaded from household Firestore settings."""

    meat_strategy: str = "none"
    meat_eaters: int = 0
    vegetarians: int = 0
    chicken_alternative: str = "quorn"
    meat_alternative: str = "oumph"
    minced_meat: str = "regular"
    dairy: str = "regular"
    seafood_ok: bool = True

    @classmethod
    def from_firestore(
        cls, dietary: dict | None, household_size: int = 2, default_servings: int | None = None
    ) -> DietaryConfig:
        """Create from a Firestore ``dietary`` settings dict.

        Handles None values and missing keys gracefully, falling back
        to safe defaults.  Prefers ``meat_portions`` (numeric) over
        the legacy ``meat`` enum for determining ``meat_strategy``.

        ``default_servings`` is the denominator for proportional meat
        splits (meat_portions is relative to servings, not people).
        Falls back to ``household_size`` when not provided.
        """
        if not dietary or not isinstance(dietary, dict):
            return cls()

        portion_base = default_servings if default_servings is not None else household_size

        meat_portions = dietary.get("meat_portions")
        if meat_portions is not None:
            portions = int(meat_portions)
            if portions == 0:
                meat_strategy = "none"
                meat_eaters = 0
                vegetarians = portion_base
            elif portions >= portion_base:
                meat_strategy = "none"  # all portions are meat, no strategy needed
                meat_eaters = portion_base
                vegetarians = 0
            else:
                meat_strategy = "split"
                meat_eaters = portions
                vegetarians = portion_base - portions
        else:
            legacy = dietary.get("meat") or "none"
            meat_strategy = legacy
            if legacy == "split":
                meat_eaters = 1
                vegetarians = max(portion_base - 1, 1)
            elif legacy in ("all", "none"):
                meat_eaters = portion_base if legacy == "all" else 0
                vegetarians = 0 if legacy == "all" else portion_base
            else:
                meat_eaters = 0
                vegetarians = 0

        return cls(
            meat_strategy=meat_strategy,
            meat_eaters=meat_eaters,
            vegetarians=vegetarians,
            chicken_alternative=dietary.get("chicken_alternative") or "quorn",
            meat_alternative=dietary.get("meat_alternative") or "oumph",
            minced_meat=dietary.get("minced_meat") or "regular",
            dairy=dietary.get("dairy") or "regular",
            seafood_ok=raw_seafood if isinstance(raw_seafood := dietary.get("seafood_ok"), bool) else True,
        )

    def active_sections(self) -> set[str]:
        """Return the set of conditional section tags that should be kept."""
        tags: set[str] = set()

        if self.meat_strategy == "split":
            tags.add("meat_split")
        elif self.meat_strategy == "vegetarian":
            tags.add("vegetarian")

        # Soy mince substitution only applies when there is a vegetarian
        # context (split or fully vegetarian).  A household with no
        # vegetarians should not get mince replaced by default.
        if self.minced_meat == "soy" and self.meat_strategy in ("split", "vegetarian"):
            tags.add("soy_mince")

        if self.dairy == "lactose_free":
            tags.add("lactose_free")

        if self.seafood_ok:
            tags.add("seafood_ok")
        else:
            tags.add("no_seafood")

        return tags


def render_dietary_template(template: str, dietary: DietaryConfig) -> str:
    """Evaluate conditional sections and return the rendered prompt.

    Sections wrapped in ``<!-- BEGIN:tag -->`` / ``<!-- END:tag -->`` are
    kept when ``tag`` is in the active set derived from *dietary*, and
    stripped otherwise.  The marker lines themselves are always removed.
    """
    active = dietary.active_sections()

    def _replace(match: re.Match[str]) -> str:
        tag = match.group(1)
        content = match.group(2)
        return content if tag in active else ""

    rendered = _SECTION_RE.sub(_replace, template)

    # Collapse runs of 3+ blank lines left by removed sections
    return re.sub(r"\n{3,}", "\n\n", rendered).strip() + "\n"
