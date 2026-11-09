import { describe, expect, it } from 'vitest';
import {
  addCheckDelta,
  applyPendingChecks,
  isEmptyPatch,
  mergePatches,
} from '../groceryPatch';

describe('addCheckDelta', () => {
  it('records checks and unchecks, the latest tick of an item winning', () => {
    let patch = addCheckDelta({}, 'milk', true);
    patch = addCheckDelta(patch, 'eggs', false);
    patch = addCheckDelta(patch, 'milk', false);

    expect(patch).toEqual({ check_items: [], uncheck_items: ['eggs', 'milk'] });
  });

  it('updates a pending full list instead of adding deltas', () => {
    const patch = addCheckDelta({ checked_items: ['flour'] }, 'milk', true);

    expect(patch).toEqual({ checked_items: ['flour', 'milk'] });
    expect(addCheckDelta(patch, 'flour', false)).toEqual({ checked_items: ['milk'] });
  });
});

describe('mergePatches', () => {
  it('lets a newer full list replace older deltas', () => {
    expect(
      mergePatches({ check_items: ['milk'], item_order: ['a'] }, { checked_items: [] }),
    ).toEqual({ checked_items: [], item_order: ['a'] });
  });

  it('applies newer deltas to an older full list', () => {
    expect(
      mergePatches({ checked_items: ['flour'] }, { check_items: ['milk'], uncheck_items: ['flour'] }),
    ).toEqual({ checked_items: ['milk'] });
  });

  it('combines deltas, the newer tick of an item winning', () => {
    expect(
      mergePatches(
        { check_items: ['milk', 'eggs'], uncheck_items: ['bread'] },
        { check_items: ['bread'], uncheck_items: ['milk'] },
      ),
    ).toEqual({ check_items: ['eggs', 'bread'], uncheck_items: ['milk'] });
  });

  it('keeps older deltas when the newer patch has none', () => {
    expect(mergePatches({ check_items: ['milk'] }, { item_order: ['b'] })).toEqual({
      check_items: ['milk'],
      item_order: ['b'],
    });
  });
});

describe('applyPendingChecks', () => {
  it("puts unsent ticks on top of the server's list", () => {
    expect(
      applyPendingChecks(['eggs', 'bread'], { check_items: ['milk'], uncheck_items: ['eggs'] }),
    ).toEqual(['bread', 'milk']);
  });

  it('uses a pending full list as is', () => {
    expect(applyPendingChecks(['eggs'], { checked_items: ['milk'] })).toEqual(['milk']);
  });
});

describe('isEmptyPatch', () => {
  it('is true only for a patch without fields', () => {
    expect(isEmptyPatch({})).toBe(true);
    expect(isEmptyPatch({ check_items: [] })).toBe(false);
  });
});
