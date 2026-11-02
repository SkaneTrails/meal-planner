/**
 * Pending grocery patches: ticks are sent one by one (check_items / uncheck_items) so devices
 * don't overwrite each other, unless a full checked_items list is pending, which then wins.
 */

import type { GroceryListStatePatch } from '@/lib/types';

const withoutDeltas = (patch: GroceryListStatePatch): GroceryListStatePatch => {
  const { check_items: _check, uncheck_items: _uncheck, ...rest } = patch;
  return rest;
};

const applyDeltas = (
  checked: Iterable<string>,
  check: readonly string[] = [],
  uncheck: readonly string[] = [],
): string[] => {
  const result = new Set(checked);
  for (const item of uncheck) result.delete(item);
  for (const item of check) result.add(item);
  return [...result];
};

/** Record one tick in a pending patch. */
export const addCheckDelta = (
  patch: GroceryListStatePatch,
  item: string,
  checked: boolean,
): GroceryListStatePatch => {
  if (patch.checked_items !== undefined) {
    return {
      ...patch,
      checked_items: checked
        ? applyDeltas(patch.checked_items, [item])
        : applyDeltas(patch.checked_items, [], [item]),
    };
  }
  const check = new Set(patch.check_items);
  const uncheck = new Set(patch.uncheck_items);
  if (checked) {
    check.add(item);
    uncheck.delete(item);
  } else {
    uncheck.add(item);
    check.delete(item);
  }
  return { ...patch, check_items: [...check], uncheck_items: [...uncheck] };
};

/** Combine an older pending patch with a newer one; the newer one wins per field and per item. */
export const mergePatches = (
  older: GroceryListStatePatch,
  newer: GroceryListStatePatch,
): GroceryListStatePatch => {
  if (newer.checked_items !== undefined) {
    return withoutDeltas({ ...older, ...newer });
  }
  const hasNewerDeltas = newer.check_items || newer.uncheck_items;
  if (!hasNewerDeltas) {
    return { ...older, ...newer };
  }
  if (older.checked_items !== undefined) {
    return withoutDeltas({
      ...older,
      ...newer,
      checked_items: applyDeltas(
        older.checked_items,
        newer.check_items,
        newer.uncheck_items,
      ),
    });
  }
  const newerCheck = new Set(newer.check_items);
  const newerUncheck = new Set(newer.uncheck_items);
  return {
    ...older,
    ...newer,
    check_items: [
      ...new Set([
        ...(older.check_items ?? []).filter((i) => !newerUncheck.has(i)),
        ...newerCheck,
      ]),
    ],
    uncheck_items: [
      ...new Set([
        ...(older.uncheck_items ?? []).filter((i) => !newerCheck.has(i)),
        ...newerUncheck,
      ]),
    ],
  };
};

/** The checked items the user sees: the server's list with not-yet-sent ticks applied on top. */
export const applyPendingChecks = (
  serverChecked: readonly string[],
  pending: GroceryListStatePatch,
): string[] =>
  pending.checked_items !== undefined
    ? [...pending.checked_items]
    : applyDeltas(serverChecked, pending.check_items, pending.uncheck_items);

export const isEmptyPatch = (patch: GroceryListStatePatch): boolean =>
  Object.keys(patch).length === 0;
