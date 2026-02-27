"""Tests for the grocery store order learning algorithm.

The algorithm learns the physical layout of a grocery store by observing
the order in which items are ticked off. It only promotes items upward
when ticked out of order, and skips Firestore writes when items were
already in the correct relative order.
"""

from api.services.store_order import apply_learned_order, is_order_consistent


class TestIsOrderConsistent:
    """Detect whether ticked items are already in the correct relative order."""

    def test_empty_tick_sequence(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, []) is True

    def test_single_item(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, ["B"]) is True

    def test_already_in_order(self) -> None:
        db_order = ["A", "B", "C", "D", "E"]
        assert is_order_consistent(db_order, ["A", "C", "E"]) is True

    def test_out_of_order(self) -> None:
        db_order = ["A", "B", "C", "D", "E"]
        assert is_order_consistent(db_order, ["A", "E", "C"]) is False

    def test_fully_reversed(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, ["C", "B", "A"]) is False

    def test_ticked_items_not_in_db_are_ignored(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, ["A", "X", "C"]) is True

    def test_all_ticked_items_unknown(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, ["X", "Y", "Z"]) is True

    def test_two_items_swapped(self) -> None:
        db_order = ["A", "B", "C", "D"]
        assert is_order_consistent(db_order, ["C", "A"]) is False

    def test_adjacent_items_in_order(self) -> None:
        db_order = ["A", "B", "C"]
        assert is_order_consistent(db_order, ["A", "B"]) is True


class TestApplyLearnedOrder:
    """Promote-only reorder algorithm.

    Items ticked out of order get promoted (moved earlier in the list).
    Items not on the shopping list stay in their relative positions.
    New items (not in DB) are appended at the end.
    """

    def test_basic_example_from_spec(self) -> None:
        """DB [A,B,C,D,E], tick [A,E,C] → [A,B,E,C,D]."""
        db_order = ["A", "B", "C", "D", "E"]
        tick_sequence = ["A", "E", "C"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "E", "C", "D"]

    def test_already_in_order_returns_unchanged(self) -> None:
        db_order = ["A", "B", "C", "D", "E"]
        tick_sequence = ["A", "C", "E"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "C", "D", "E"]

    def test_full_reversal(self) -> None:
        """DB [C,B,A], tick [A,B,C] → [A,B,C].

        Right-to-left processing of tick pairs [A,B,C]:
        Pairs: (B,C), then (A,B).
        (B,C): constraint "B before C". In DB, C=0, B=1 → B is after C,
        so promote B before C → [B,C,A].
        (A,B): constraint "A before B". In DB (after previous step), B=0, A=2
        → A is after B, so promote A before B → [A,B,C].
        """
        db_order = ["C", "B", "A"]
        tick_sequence = ["A", "B", "C"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "C"]

    def test_single_swap(self) -> None:
        """DB [A,B,C], tick [B,A] → B should be before A → [B,A,C]."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["B", "A"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["B", "A", "C"]

    def test_no_change_when_single_item(self) -> None:
        db_order = ["A", "B", "C"]
        tick_sequence = ["B"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "C"]

    def test_empty_tick_sequence(self) -> None:
        db_order = ["A", "B", "C"]
        result = apply_learned_order(db_order, [])
        assert result == ["A", "B", "C"]

    def test_empty_db_order_appends_all(self) -> None:
        result = apply_learned_order([], ["A", "B", "C"])
        assert result == ["A", "B", "C"]

    def test_new_items_appended_at_end(self) -> None:
        """Items not in DB get appended in tick order."""
        db_order = ["A", "B"]
        tick_sequence = ["A", "X", "B", "Y"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "X", "Y"]

    def test_new_items_only(self) -> None:
        db_order = ["A", "B"]
        tick_sequence = ["X", "Y"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "X", "Y"]

    def test_unticked_items_preserve_position(self) -> None:
        """B and D are not on the list — they don't move."""
        db_order = ["A", "B", "C", "D", "E"]
        tick_sequence = ["E", "C", "A"]
        result = apply_learned_order(db_order, tick_sequence)
        # E before C before A. Processing right-to-left:
        # (C,A): C should be before A. C=2, A=0 → C after A → promote C before A → [C,A,B,D,E]
        # (E,C): E should be before C. E=4, C=0 → E after C → promote E before C → [E,C,A,B,D]
        assert result == ["E", "C", "A", "B", "D"]

    def test_partial_overlap_with_db(self) -> None:
        """Some ticked items in DB, some not."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["B", "X", "A"]
        # Known items: B before A. B=1, A=0 → B after A → promote B before A → [B,A,C]
        # X is new → appended → [B,A,C,X]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["B", "A", "C", "X"]

    def test_three_items_middle_promoted(self) -> None:
        """DB [A,B,C], tick [A,C,B] → C should be before B → [A,C,B]."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["A", "C", "B"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "C", "B"]

    def test_idempotent_when_already_correct(self) -> None:
        """Running the same in-order tick twice doesn't change anything."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["A", "B", "C"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "C"]

    def test_convergence_over_two_trips(self) -> None:
        """Two trips refine the order progressively."""
        db_order = ["C", "B", "A"]

        # Trip 1: tick [A, C] (A before C)
        result1 = apply_learned_order(db_order, ["A", "C"])
        # A should be before C. A=2, C=0 → promote A before C → [A,C,B]
        # Wait: we only have one pair (A,C).
        # A=2, C=0 in [C,B,A]. A after C, but tick says A before C → promote A before C
        # → [A,C,B]
        assert result1 == ["A", "C", "B"]

        # Trip 2: tick [A, B, C]
        result2 = apply_learned_order(result1, ["A", "B", "C"])
        # Pairs right-to-left: (B,C), (A,B)
        # (B,C): B should be before C. In [A,C,B]: B=2, C=1 → B after C → promote B before C → [A,B,C]
        # (A,B): A should be before B. In [A,B,C]: A=0, B=1 → A before B ✓
        assert result2 == ["A", "B", "C"]

    def test_duplicate_items_in_tick_sequence_ignored(self) -> None:
        """If an item appears multiple times in tick sequence, deduplicate."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["B", "A", "B", "A"]
        result = apply_learned_order(db_order, tick_sequence)
        # After dedup: [B, A] → B before A → promote B before A → [B,A,C]
        assert result == ["B", "A", "C"]

    def test_duplicates_reducing_to_single_item(self) -> None:
        """If dedup leaves only one item, no reorder needed."""
        db_order = ["A", "B", "C"]
        tick_sequence = ["B", "B", "B"]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["A", "B", "C"]

    def test_large_list_stability(self) -> None:
        """Non-ticked items maintain their relative order."""
        db_order = list("ABCDEFGHIJ")
        tick_sequence = ["E", "A"]
        # E before A. E=4, A=0 → E after A → promote E before A → [E,A,B,C,D,F,G,H,I,J]
        result = apply_learned_order(db_order, tick_sequence)
        assert result == ["E", "A", "B", "C", "D", "F", "G", "H", "I", "J"]
        # All non-involved items (B,C,D,F,G,H,I,J) keep relative order

    def test_drag_override_single_item(self) -> None:
        """Manual drag: move item to specific position."""
        db_order = ["A", "B", "C", "D", "E"]
        # User drags D to position before B
        tick_sequence = ["D", "B"]
        result = apply_learned_order(db_order, tick_sequence)
        # D before B. D=3, B=1 → D after B → promote D before B → [A,D,B,C,E]
        assert result == ["A", "D", "B", "C", "E"]
