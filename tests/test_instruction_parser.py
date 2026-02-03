"""Tests for recipe instruction parsing."""

from api.models.recipe import InstructionType, Recipe, parse_instruction


class TestParseInstruction:
    """Tests for the parse_instruction function."""

    def test_regular_step(self) -> None:
        """Regular text becomes a step with step number."""
        result = parse_instruction("Blanda alla ingredienser i en skål.", step_counter=1)

        assert result.type == InstructionType.STEP
        assert result.content == "Blanda alla ingredienser i en skål."
        assert result.step_number == 1
        assert result.time is None

    def test_timeline_entry(self) -> None:
        """⏱️ X min: prefix is parsed as timeline entry."""
        result = parse_instruction("⏱️ 0 min: Sätt ugnen på 175°C.", step_counter=1)

        assert result.type == InstructionType.TIMELINE
        assert result.content == "Sätt ugnen på 175°C."
        assert result.time == 0
        assert result.step_number is None

    def test_timeline_entry_with_higher_time(self) -> None:
        """Timeline entries parse different time values."""
        result = parse_instruction("⏱️ 25 min: Ta ut kycklingen ur ugnen.", step_counter=3)

        assert result.type == InstructionType.TIMELINE
        assert result.content == "Ta ut kycklingen ur ugnen."
        assert result.time == 25

    def test_timeline_entry_with_space_variations(self) -> None:
        """Timeline entries handle different spacing."""
        result = parse_instruction("⏱️25min: No spaces.", step_counter=1)

        assert result.type == InstructionType.TIMELINE
        assert result.content == "No spaces."
        assert result.time == 25

    def test_tip_with_emoji(self) -> None:
        """💡 prefix is parsed as tip."""
        result = parse_instruction("💡 Du kan använda fryst broccoli istället.", step_counter=2)

        assert result.type == InstructionType.TIP
        assert result.content == "Du kan använda fryst broccoli istället."
        assert result.step_number is None
        assert result.time is None

    def test_tip_with_text_prefix(self) -> None:
        """TIP: prefix is parsed as tip."""
        result = parse_instruction("TIP: Förbered såsen dagen innan.", step_counter=1)

        assert result.type == InstructionType.TIP
        assert result.content == "Förbered såsen dagen innan."

    def test_tip_with_tips_prefix(self) -> None:
        """Tips: prefix is parsed as tip."""
        result = parse_instruction("Tips: Servera med ris.", step_counter=1)

        assert result.type == InstructionType.TIP
        assert result.content == "Servera med ris."

    def test_heading_with_two_hashes(self) -> None:
        """## prefix is parsed as heading."""
        result = parse_instruction("## Förberedelser", step_counter=1)

        assert result.type == InstructionType.HEADING
        assert result.content == "Förberedelser"
        assert result.step_number is None

    def test_heading_with_three_hashes(self) -> None:
        """### prefix is parsed as heading."""
        result = parse_instruction("### Tillagning", step_counter=2)

        assert result.type == InstructionType.HEADING
        assert result.content == "Tillagning"

    def test_overview_oversikt(self) -> None:
        """ÖVERSIKT: prefix is parsed as timeline (overview) entry."""
        result = parse_instruction("ÖVERSIKT: Receptet tar ca 55 min. Pumpan rostar i 25-30 min.", step_counter=1)

        assert result.type == InstructionType.TIMELINE
        assert result.content == "Receptet tar ca 55 min. Pumpan rostar i 25-30 min."
        assert result.time is None  # Overview has no specific time
        assert result.step_number is None

    def test_overview_oversikt_lowercase(self) -> None:
        """översikt: prefix (lowercase) is parsed as timeline entry."""
        result = parse_instruction("översikt: Total tid 45 min.", step_counter=1)

        assert result.type == InstructionType.TIMELINE
        assert result.content == "Total tid 45 min."
        assert result.time is None

    def test_whitespace_trimming(self) -> None:
        """Whitespace is trimmed from input and content."""
        result = parse_instruction("  Blanda ingredienserna.  ", step_counter=1)

        assert result.content == "Blanda ingredienserna."


class TestRecipeStructuredInstructions:
    """Tests for Recipe.structured_instructions computed field."""

    def test_mixed_instruction_types(self) -> None:
        """Recipe parses mixed instruction types correctly."""
        recipe = Recipe(
            id="test-id",
            title="Test Recipe",
            url="https://example.com",
            instructions=[
                "⏱️ 0 min: Sätt ugnen på 175°C.",
                "Blanda potatis med olja.",
                "⏱️ 15 min: Lägg in potatisen i ugnen.",
                "💡 Du kan tillsätta rosmarin för extra smak.",
                "## Servering",
                "Servera med sås.",
            ],
        )

        structured = recipe.structured_instructions

        assert len(structured) == 6
        assert structured[0].type == InstructionType.TIMELINE
        assert structured[0].time == 0
        assert structured[1].type == InstructionType.STEP
        assert structured[1].step_number == 1
        assert structured[2].type == InstructionType.TIMELINE
        assert structured[3].type == InstructionType.TIP
        assert structured[4].type == InstructionType.HEADING
        assert structured[5].type == InstructionType.STEP
        assert structured[5].step_number == 2  # Only steps get numbered

    def test_step_counter_only_increments_for_steps(self) -> None:
        """Step counter only increments for STEP type instructions."""
        recipe = Recipe(
            id="test-id",
            title="Test Recipe",
            url="https://example.com",
            instructions=[
                "⏱️ 0 min: Start cooking.",  # timeline - no step number
                "First step.",  # step 1
                "💡 A tip here.",  # tip - no step number
                "Second step.",  # step 2
                "## Heading",  # heading - no step number
                "Third step.",  # step 3
            ],
        )

        structured = recipe.structured_instructions

        steps = [s for s in structured if s.type == InstructionType.STEP]
        assert len(steps) == 3
        assert steps[0].step_number == 1
        assert steps[1].step_number == 2
        assert steps[2].step_number == 3

    def test_empty_instructions(self) -> None:
        """Empty instructions list returns empty structured list."""
        recipe = Recipe(id="test-id", title="Test Recipe", url="https://example.com", instructions=[])

        assert recipe.structured_instructions == []

    def test_all_regular_steps(self) -> None:
        """All regular steps are numbered sequentially."""
        recipe = Recipe(
            id="test-id",
            title="Test Recipe",
            url="https://example.com",
            instructions=["Step one.", "Step two.", "Step three."],
        )

        structured = recipe.structured_instructions

        assert all(s.type == InstructionType.STEP for s in structured)
        assert [s.step_number for s in structured] == [1, 2, 3]
