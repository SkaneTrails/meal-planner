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
        assert cfg.minced_meat == "regular"

    def test_non_dict_returns_defaults(self) -> None:
        cfg = DietaryConfig.from_firestore("bad")  # type: ignore[arg-type]
        assert cfg.meat_strategy == "none"

    def test_full_config_maps_correctly(self) -> None:
        cfg = DietaryConfig.from_firestore(
            {
                "meat": "split",
                "chicken_alternative": "quorn",
                "meat_alternative": "oumph",
                "minced_meat": "soy",
                "dairy": "lactose_free",
                "seafood_ok": True,
            }
        )
        assert cfg.meat_strategy == "split"
        assert cfg.chicken_alternative == "quorn"
        assert cfg.meat_alternative == "oumph"
        assert cfg.minced_meat == "soy"
        assert cfg.dairy == "lactose_free"
        assert cfg.seafood_ok is True

    def test_null_fields_use_defaults(self) -> None:
        """Firestore may store null for unset optional fields."""
        cfg = DietaryConfig.from_firestore({"meat": None, "chicken_alternative": None, "seafood_ok": False})
        assert cfg.meat_strategy == "none"
        assert cfg.chicken_alternative == "quorn"
        assert cfg.seafood_ok is False

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
        assert cfg.meat_strategy == "none"
        assert cfg.dairy == "lactose_free"
        assert cfg.seafood_ok is True


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

    def test_soy_mince_with_split(self) -> None:
        cfg = DietaryConfig(meat_strategy="split", minced_meat="soy")
        assert "soy_mince" in cfg.active_sections()

    def test_soy_mince_with_vegetarian(self) -> None:
        cfg = DietaryConfig(meat_strategy="vegetarian", minced_meat="soy")
        assert "soy_mince" in cfg.active_sections()

    def test_soy_mince_without_meat_strategy_not_active(self) -> None:
        """Soy mince only applies when household has vegetarians."""
        cfg = DietaryConfig(meat_strategy="none", minced_meat="soy")
        assert "soy_mince" not in cfg.active_sections()

    def test_regular_mince_no_tag(self) -> None:
        cfg = DietaryConfig(minced_meat="regular")
        assert "soy_mince" not in cfg.active_sections()

    def test_lactose_free(self) -> None:
        cfg = DietaryConfig(dairy="lactose_free")
        assert "lactose_free" in cfg.active_sections()

    def test_regular_dairy_no_tag(self) -> None:
        cfg = DietaryConfig(dairy="regular")
        assert "lactose_free" not in cfg.active_sections()

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
        """Split + soy mince + lactose-free + seafood OK → 4 tags."""
        cfg = DietaryConfig(meat_strategy="split", minced_meat="soy", dairy="lactose_free", seafood_ok=True)
        tags = cfg.active_sections()
        assert tags == {"meat_split", "soy_mince", "lactose_free", "seafood_ok"}


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
        """Variables like {people_count} are left for prompt_loader to fill."""
        template = "People: {people_count}\n"
        cfg = DietaryConfig()
        rendered = render_dietary_template(template, cfg)
        assert "{people_count}" in rendered

    def test_soy_mince_section(self) -> None:
        template = "<!-- BEGIN:soy_mince -->\nUse soy mince.\n<!-- END:soy_mince -->\n"
        cfg = DietaryConfig(meat_strategy="split", minced_meat="soy")
        rendered = render_dietary_template(template, cfg)
        assert "Use soy mince." in rendered

    def test_regular_mince_strips_soy_section(self) -> None:
        template = "<!-- BEGIN:soy_mince -->\nUse soy mince.\n<!-- END:soy_mince -->\n"
        cfg = DietaryConfig(meat_strategy="split", minced_meat="regular")
        rendered = render_dietary_template(template, cfg)
        assert "Use soy mince." not in rendered

    def test_soy_mince_without_vegetarian_context_strips(self) -> None:
        """Soy mince set but no vegetarian context — section should be stripped."""
        template = "<!-- BEGIN:soy_mince -->\nUse soy mince.\n<!-- END:soy_mince -->\n"
        cfg = DietaryConfig(meat_strategy="none", minced_meat="soy")
        rendered = render_dietary_template(template, cfg)
        assert "Use soy mince." not in rendered

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
                "minced_meat": "soy",
                "dairy": "lactose_free",
                "seafood_ok": True,
                "chicken_alternative": None,
                "meat_alternative": None,
            }
        )
        rendered = render_dietary_template(template, cfg)

        assert "Protein substitution" in rendered
        assert "soy mince" in rendered
        assert "lactose-free" in rendered
        assert "Both eat fish" in rendered
        assert "No fish or seafood" not in rendered
        assert "Fully vegetarian" not in rendered
        assert "<!-- BEGIN" not in rendered
        assert "<!-- END" not in rendered
        assert "{people_count}" in rendered
