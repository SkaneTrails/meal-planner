"""Tests for api/services/dietary_prompt_builder.py."""

from api.services.dietary_prompt_builder import DietaryConfig, render_dietary_template

# ---------------------------------------------------------------------------
# DietaryConfig.from_firestore
# ---------------------------------------------------------------------------


class TestDietaryConfigFromFirestore:
    """Tests for DietaryConfig.from_firestore class method."""

    def test_none_returns_defaults(self) -> None:
        cfg = DietaryConfig.from_firestore(None)
        assert cfg.meat_strategy == "none"
        assert cfg.dairy == "regular"
        assert cfg.seafood_ok is True

    def test_empty_dict_returns_defaults(self) -> None:
        cfg = DietaryConfig.from_firestore({})
        assert cfg.meat_strategy == "none"
        assert cfg.ingredient_replacements == ()

    def test_non_dict_returns_defaults(self) -> None:
        cfg = DietaryConfig.from_firestore("bad")  # type: ignore[arg-type]
        assert cfg.meat_strategy == "none"

    def test_full_config_maps_correctly(self) -> None:
        cfg = DietaryConfig.from_firestore(
            {
                "meat": "split",
                "ingredient_replacements": [
                    {"original": "chicken", "replacement": "quorn", "meat_substitute": True},
                    {"original": "beef", "replacement": "oumph", "meat_substitute": True},
                ],
                "dairy": "lactose_free",
                "seafood_ok": True,
            }
        )
        assert cfg.meat_strategy == "split"
        assert len(cfg.ingredient_replacements) == 2
        assert cfg.ingredient_replacements[0] == ("chicken", "quorn", True)
        assert cfg.ingredient_replacements[1] == ("beef", "oumph", True)
        assert cfg.dairy == "lactose_free"
        assert cfg.seafood_ok is True

    def test_null_fields_use_defaults(self) -> None:
        """Firestore may store null for unset optional fields."""
        cfg = DietaryConfig.from_firestore({"meat": None, "ingredient_replacements": None, "seafood_ok": False})
        assert cfg.meat_strategy == "all"
        assert cfg.ingredient_replacements == ()
        assert cfg.seafood_ok is False

    def test_missing_replacements_defaults_to_empty(self) -> None:
        """Missing ingredient_replacements key returns empty tuple."""
        cfg = DietaryConfig.from_firestore({"dairy": "lactose_free"})
        assert cfg.ingredient_replacements == ()

    def test_seafood_ok_none_defaults_to_true(self) -> None:
        """None/missing seafood_ok should default to True, not False."""
        cfg = DietaryConfig.from_firestore({"seafood_ok": None})
        assert cfg.seafood_ok is True

    def test_seafood_ok_non_bool_defaults_to_true(self) -> None:
        """Non-boolean values (e.g. strings) should fall back to True."""
        cfg = DietaryConfig.from_firestore({"seafood_ok": "false"})
        assert cfg.seafood_ok is True

    def test_missing_keys_use_defaults(self) -> None:
        cfg = DietaryConfig.from_firestore({"dairy": "lactose_free"})
        assert cfg.meat_strategy == "all"
        assert cfg.dairy == "lactose_free"
        assert cfg.seafood_ok is True

    def test_meat_portions_all_meat(self) -> None:
        """meat_portions == servings means everyone eats meat."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 4}, default_servings=4)
        assert cfg.meat_strategy == "all"
        assert cfg.meat_eaters == 4
        assert cfg.vegetarians == 0

    def test_meat_portions_none(self) -> None:
        """meat_portions=0 means fully vegetarian."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 0}, default_servings=4)
        assert cfg.meat_strategy == "vegetarian"
        assert cfg.meat_eaters == 0
        assert cfg.vegetarians == 4

    def test_meat_portions_split(self) -> None:
        """meat_portions < household_size means split strategy with exact counts."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 2}, default_servings=4)
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 2
        assert cfg.vegetarians == 2

    def test_meat_portions_split_asymmetric(self) -> None:
        """Asymmetric split: 3 meat eaters out of 5."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 3}, default_servings=5)
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 3
        assert cfg.vegetarians == 2

    def test_meat_portions_overrides_legacy_meat(self) -> None:
        """When both meat and meat_portions are present, meat_portions wins."""
        cfg = DietaryConfig.from_firestore({"meat": "all", "meat_portions": 3}, default_servings=4)
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 3
        assert cfg.vegetarians == 1

    def test_meat_portions_uses_default_servings_as_portion_base(self) -> None:
        """default_servings is the denominator for portion split math."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 1}, default_servings=4)
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 1
        assert cfg.vegetarians == 3

    def test_legacy_unknown_meat_value_zeros_out(self) -> None:
        """An unexpected legacy meat value (not split/all/none) falls back to 0/0."""
        cfg = DietaryConfig.from_firestore({"meat": "weird_value"}, default_servings=4)
        assert cfg.meat_strategy == "weird_value"
        assert cfg.meat_eaters == 0
        assert cfg.vegetarians == 0

    def test_diet_type_no_restrictions_defaults_all_meat(self) -> None:
        """no_restrictions without meat_portions defaults to all-meat."""
        cfg = DietaryConfig.from_firestore({"diet_type": "no_restrictions"}, default_servings=4)
        assert cfg.meat_strategy == "all"
        assert cfg.meat_eaters == 4
        assert cfg.vegetarians == 0

    def test_diet_type_no_restrictions_respects_meat_portions(self) -> None:
        """no_restrictions still honours explicit meat_portions (legacy data)."""
        cfg = DietaryConfig.from_firestore({"diet_type": "no_restrictions", "meat_portions": 2}, default_servings=4)
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 2
        assert cfg.vegetarians == 2

    def test_diet_type_pescatarian_mixed(self) -> None:
        """Pescatarian supports mixed household via meat_portions."""
        cfg = DietaryConfig.from_firestore(
            {"diet_type": "pescatarian", "meat_portions": 2, "seafood_ok": True}, default_servings=4
        )
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 2
        assert cfg.vegetarians == 2
        assert cfg.seafood_ok is True

    def test_diet_type_pescatarian_no_meat(self) -> None:
        """Pescatarian with meat_portions=0 is fully vegetarian."""
        cfg = DietaryConfig.from_firestore(
            {"diet_type": "pescatarian", "meat_portions": 0, "seafood_ok": True}, default_servings=4
        )
        assert cfg.meat_strategy == "vegetarian"
        assert cfg.meat_eaters == 0
        assert cfg.vegetarians == 4
        assert cfg.seafood_ok is True

    def test_diet_type_vegetarian_mixed(self) -> None:
        """Vegetarian supports mixed household via meat_portions."""
        cfg = DietaryConfig.from_firestore(
            {"diet_type": "vegetarian", "meat_portions": 1, "seafood_ok": True}, default_servings=4
        )
        assert cfg.meat_strategy == "split"
        assert cfg.meat_eaters == 1
        assert cfg.vegetarians == 3
        assert cfg.seafood_ok is False

    def test_diet_type_vegetarian_no_meat(self) -> None:
        """Vegetarian with no meat_portions defaults via legacy."""
        cfg = DietaryConfig.from_firestore({"diet_type": "vegetarian", "seafood_ok": True}, default_servings=4)
        assert cfg.seafood_ok is False

    def test_diet_type_vegan(self) -> None:
        """Vegan: no meat, no seafood, dairy forced to dairy_free."""
        cfg = DietaryConfig.from_firestore(
            {"diet_type": "vegan", "dairy": "regular", "seafood_ok": True}, default_servings=4
        )
        assert cfg.meat_strategy == "vegetarian"
        assert cfg.seafood_ok is False
        assert cfg.dairy == "dairy_free"

    def test_diet_type_missing_uses_no_restrictions(self) -> None:
        """Missing diet_type falls back to no_restrictions (legacy compat)."""
        cfg = DietaryConfig.from_firestore({"meat_portions": 4}, default_servings=4)
        assert cfg.meat_strategy == "all"
        assert cfg.meat_eaters == 4


# ---------------------------------------------------------------------------
# DietaryConfig.active_sections
# ---------------------------------------------------------------------------


class TestActiveSections:
    """Tests for DietaryConfig.active_sections method."""

    def test_split_strategy_enables_meat_split(self) -> None:
        cfg = DietaryConfig(meat_strategy="split")
        tags = cfg.active_sections()
        assert "meat_split" in tags
        assert "vegetarian" not in tags

    def test_vegetarian_strategy_enables_vegetarian(self) -> None:
        cfg = DietaryConfig(meat_strategy="vegetarian")
        tags = cfg.active_sections()
        assert "vegetarian" in tags
        assert "meat_split" not in tags

    def test_no_strategy_enables_neither(self) -> None:
        cfg = DietaryConfig(meat_strategy="none")
        tags = cfg.active_sections()
        assert "meat_split" not in tags
        assert "vegetarian" not in tags

    def test_lactose_free(self) -> None:
        cfg = DietaryConfig(dairy="lactose_free")
        assert "lactose_free" in cfg.active_sections()
        assert "dairy_free" not in cfg.active_sections()

    def test_dairy_free(self) -> None:
        cfg = DietaryConfig(dairy="dairy_free")
        tags = cfg.active_sections()
        assert "dairy_free" in tags
        assert "lactose_free" not in tags

    def test_regular_dairy_tag(self) -> None:
        cfg = DietaryConfig(dairy="regular")
        tags = cfg.active_sections()
        assert "regular_dairy" in tags
        assert "lactose_free" not in tags
        assert "dairy_free" not in tags

    def test_seafood_ok_true(self) -> None:
        cfg = DietaryConfig(seafood_ok=True)
        tags = cfg.active_sections()
        assert "seafood_ok" in tags
        assert "no_seafood" not in tags

    def test_seafood_ok_false(self) -> None:
        cfg = DietaryConfig(seafood_ok=False)
        tags = cfg.active_sections()
        assert "no_seafood" in tags
        assert "seafood_ok" not in tags

    def test_full_config_all_tags(self) -> None:
        """Split + lactose-free + seafood OK → 3 tags."""
        cfg = DietaryConfig(meat_strategy="split", dairy="lactose_free", seafood_ok=True)
        tags = cfg.active_sections()
        assert tags == {"meat_split", "lactose_free", "seafood_ok"}

    def test_full_config_regular_dairy_tags(self) -> None:
        """Split + regular dairy + seafood OK → includes regular_dairy."""
        cfg = DietaryConfig(meat_strategy="split", dairy="regular", seafood_ok=True)
        tags = cfg.active_sections()
        assert tags == {"meat_split", "regular_dairy", "seafood_ok"}

    def test_full_config_dairy_free_tags(self) -> None:
        """All-meat + dairy-free + no seafood → 3 tags (no lactose_free)."""
        cfg = DietaryConfig(meat_strategy="all", dairy="dairy_free", seafood_ok=False)
        tags = cfg.active_sections()
        assert tags == {"dairy_free", "no_seafood"}


# ---------------------------------------------------------------------------
# render_dietary_template
# ---------------------------------------------------------------------------


SIMPLE_TEMPLATE = """\
# Header

Always visible.

<!-- BEGIN:alpha -->
Alpha content.
<!-- END:alpha -->

<!-- BEGIN:beta -->
Beta content.
<!-- END:beta -->

Footer.
"""


class TestRenderDietaryTemplate:
    """Tests for the conditional template renderer."""

    def test_keeps_active_section(self) -> None:
        cfg = DietaryConfig(meat_strategy="split")
        # alpha is not a real tag, but we can test the mechanism with a
        # custom template and manually inject tags via a subclass.
        rendered = render_dietary_template("<!-- BEGIN:meat_split -->\nSplit rules.\n<!-- END:meat_split -->\n", cfg)
        assert "Split rules." in rendered

    def test_strips_inactive_section(self) -> None:
        cfg = DietaryConfig(meat_strategy="none")
        rendered = render_dietary_template(
            "Before.\n<!-- BEGIN:meat_split -->\nSplit rules.\n<!-- END:meat_split -->\nAfter.\n", cfg
        )
        assert "Split rules." not in rendered
        assert "Before." in rendered
        assert "After." in rendered

    def test_removes_marker_comments(self) -> None:
        cfg = DietaryConfig(meat_strategy="split")
        rendered = render_dietary_template("<!-- BEGIN:meat_split -->\nContent.\n<!-- END:meat_split -->\n", cfg)
        assert "<!-- BEGIN" not in rendered
        assert "<!-- END" not in rendered
        assert "Content." in rendered

    def test_multiple_sections_independently_controlled(self) -> None:
        template = (
            "<!-- BEGIN:meat_split -->\nMeat split.\n<!-- END:meat_split -->\n"
            "<!-- BEGIN:lactose_free -->\nDairy rules.\n<!-- END:lactose_free -->\n"
        )
        cfg = DietaryConfig(meat_strategy="split", dairy="regular")
        rendered = render_dietary_template(template, cfg)
        assert "Meat split." in rendered
        assert "Dairy rules." not in rendered

    def test_dairy_free_section_included(self) -> None:
        template = (
            "<!-- BEGIN:lactose_free -->\nLactose rules.\n<!-- END:lactose_free -->\n"
            "<!-- BEGIN:dairy_free -->\nDairy-free rules.\n<!-- END:dairy_free -->\n"
        )
        cfg = DietaryConfig(dairy="dairy_free")
        rendered = render_dietary_template(template, cfg)
        assert "Dairy-free rules." in rendered
        assert "Lactose rules." not in rendered

    def test_dairy_free_excludes_lactose_free(self) -> None:
        """Dairy-free and lactose-free are mutually exclusive."""
        template = (
            "<!-- BEGIN:lactose_free -->\nLactose rules.\n<!-- END:lactose_free -->\n"
            "<!-- BEGIN:dairy_free -->\nDairy-free rules.\n<!-- END:dairy_free -->\n"
        )
        cfg = DietaryConfig(dairy="lactose_free")
        rendered = render_dietary_template(template, cfg)
        assert "Lactose rules." in rendered
        assert "Dairy-free rules." not in rendered

    def test_seafood_ok_excludes_no_seafood(self) -> None:
        template = (
            "<!-- BEGIN:seafood_ok -->\nFish is fine.\n<!-- END:seafood_ok -->\n"
            "<!-- BEGIN:no_seafood -->\nNo fish.\n<!-- END:no_seafood -->\n"
        )
        cfg = DietaryConfig(seafood_ok=True)
        rendered = render_dietary_template(template, cfg)
        assert "Fish is fine." in rendered
        assert "No fish." not in rendered

    def test_no_seafood_excludes_seafood_ok(self) -> None:
        template = (
            "<!-- BEGIN:seafood_ok -->\nFish is fine.\n<!-- END:seafood_ok -->\n"
            "<!-- BEGIN:no_seafood -->\nNo fish.\n<!-- END:no_seafood -->\n"
        )
        cfg = DietaryConfig(seafood_ok=False)
        rendered = render_dietary_template(template, cfg)
        assert "No fish." in rendered
        assert "Fish is fine." not in rendered

    def test_collapses_excessive_blank_lines(self) -> None:
        template = "Before.\n\n<!-- BEGIN:meat_split -->\nGone.\n<!-- END:meat_split -->\n\n\nAfter.\n"
        cfg = DietaryConfig(meat_strategy="none")
        rendered = render_dietary_template(template, cfg)
        assert "\n\n\n" not in rendered

    def test_preserves_template_variables(self) -> None:
        """Variables like {target_servings} are left for prompt_loader to fill."""
        template = "Servings: {target_servings}\n"
        cfg = DietaryConfig()
        rendered = render_dietary_template(template, cfg)
        assert "{target_servings}" in rendered

    def test_empty_template(self) -> None:
        cfg = DietaryConfig()
        rendered = render_dietary_template("", cfg)
        assert rendered.strip() == ""

    def test_no_markers_passes_through(self) -> None:
        cfg = DietaryConfig()
        rendered = render_dietary_template("Just plain text.\n", cfg)
        assert "Just plain text." in rendered

    def test_real_dietary_template_with_hemmestorp_config(self) -> None:
        """Render the actual dietary.md with the Hemmestorp household config."""
        from pathlib import Path

        dietary_path = Path(__file__).parent.parent / "config" / "prompts" / "user" / "dietary.md"
        assert dietary_path.exists(), f"Template not found: {dietary_path}"

        template = dietary_path.read_text(encoding="utf-8")
        cfg = DietaryConfig.from_firestore(
            {
                "meat": "split",
                "dairy": "lactose_free",
                "seafood_ok": True,
                "ingredient_replacements": [
                    {"original": "chicken", "replacement": "quorn", "meat_substitute": True},
                    {"original": "köttfärs", "replacement": "sojafärs", "meat_substitute": True},
                ],
            }
        )
        rendered = render_dietary_template(template, cfg)

        assert "Protein substitution" in rendered
        assert "lactose-free" in rendered
        assert "household eats fish" in rendered
        assert "No fish or seafood" not in rendered
        assert "Fully vegetarian" not in rendered
        assert "<!-- BEGIN" not in rendered
        assert "<!-- END" not in rendered
        assert "{meat_eaters}" in rendered
        assert "{vegetarians}" in rendered
