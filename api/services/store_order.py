"""Grocery store order learning algorithm.

Learns the physical layout of a grocery store by observing the order
in which items are ticked off during shopping trips.

Uses a promote-only strategy: items ticked out of order get moved
earlier in the list. Items already in the correct relative order
trigger no changes (zero Firestore writes for consistent trips).
"""

from itertools import pairwise


def is_order_consistent(db_order: list[str], tick_sequence: list[str]) -> bool:
    """Check if ticked items are already in the correct relative order.

    Compares the DB positions of ticked items (ignoring unknowns) against
    the tick sequence. If the subsequence is monotonically increasing,
    no reorder is needed.

    Args:
        db_order: Current item ordering from Firestore.
        tick_sequence: Items in the order they were ticked off.

    Returns:
        True if no reorder is needed, False if items were ticked out of order.
    """
    if len(tick_sequence) <= 1:
        return True

    position = {name: i for i, name in enumerate(db_order)}

    seen: set[str] = set()
    known_positions: list[int] = []
    for item in tick_sequence:
        if item not in seen and item in position:
            seen.add(item)
            known_positions.append(position[item])

    if len(known_positions) <= 1:
        return True

    return all(a < b for a, b in pairwise(known_positions))


def apply_learned_order(db_order: list[str], tick_sequence: list[str]) -> list[str]:
    """Apply the promote-only reorder algorithm.

    Processes consecutive pairs from the tick sequence right-to-left.
    For each pair (earlier_ticked, later_ticked), if earlier_ticked appears
    after later_ticked in the DB, it gets promoted (moved just before
    later_ticked). Right-to-left processing ensures earlier constraints
    aren't broken by later promotions.

    New items (not in DB) are appended at the end in tick order.

    Args:
        db_order: Current item ordering from Firestore.
        tick_sequence: Items in the order they were ticked off (first = encountered first in store).

    Returns:
        Updated item ordering.
    """
    if len(tick_sequence) <= 1:
        return list(db_order)

    # Deduplicate tick sequence, preserving first occurrence order
    seen: set[str] = set()
    deduped: list[str] = []
    for item in tick_sequence:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    tick_sequence = deduped

    if len(tick_sequence) <= 1:
        return list(db_order)

    result = list(db_order)

    # Separate known (in DB) and new (not in DB) items
    db_set = set(result)
    known_ticked = [item for item in tick_sequence if item in db_set]
    new_items = [item for item in tick_sequence if item not in db_set]

    # Process consecutive pairs right-to-left
    for i in range(len(known_ticked) - 2, -1, -1):
        earlier = known_ticked[i]
        later = known_ticked[i + 1]

        earlier_pos = result.index(earlier)
        later_pos = result.index(later)

        if earlier_pos > later_pos:
            result.pop(earlier_pos)
            new_later_pos = result.index(later)
            result.insert(new_later_pos, earlier)

    result.extend(new_items)
    return result
