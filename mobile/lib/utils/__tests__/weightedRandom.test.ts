import { describe, expect, it } from 'vitest';
import type { Recipe } from '@/lib/types';
import { pickWeightedRandom, RECENT_WEIGHT } from '@/lib/utils/weightedRandom';

const makeRecipe = (id: string, createdAt: string | null): Recipe =>
  ({ id, title: id, created_at: createdAt }) as Recipe;

// Newest → oldest.
const r1 = makeRecipe('r1', '2026-07-01T00:00:00Z');
const r2 = makeRecipe('r2', '2026-05-01T00:00:00Z');
const r3 = makeRecipe('r3', '2026-03-01T00:00:00Z');
const r4 = makeRecipe('r4', '2026-01-01T00:00:00Z');

describe('pickWeightedRandom', () => {
  it('returns null for an empty list', () => {
    expect(pickWeightedRandom([])).toBeNull();
  });

  it('returns the only recipe without consulting random', () => {
    expect(pickWeightedRandom([r1])?.id).toBe('r1');
  });

  it('returns null when the only recipe is excluded', () => {
    expect(pickWeightedRandom([r1], { excludeId: 'r1' })).toBeNull();
  });

  it('excludes the given id from the draw', () => {
    const picked = pickWeightedRandom([r1, r2], {
      excludeId: 'r1',
      random: () => 0,
    });
    expect(picked?.id).toBe('r2');
  });

  it('draws from the newest half when the weight roll is below RECENT_WEIGHT', () => {
    // Pool of 4 → recent = [r1, r2], older = [r3, r4].
    const rolls = [RECENT_WEIGHT - 0.1, 0]; // recent bucket, index 0
    let i = 0;
    const picked = pickWeightedRandom([r1, r2, r3, r4], {
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('r1');
  });

  it('draws from the older half when the weight roll is at/above RECENT_WEIGHT', () => {
    const rolls = [RECENT_WEIGHT + 0.1, 0]; // older bucket, index 0
    let i = 0;
    const picked = pickWeightedRandom([r1, r2, r3, r4], {
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('r3');
  });

  it('ranks by created_at regardless of input order', () => {
    const rolls = [RECENT_WEIGHT - 0.1, 0];
    let i = 0;
    // Shuffled input; newest (r1) must still land in the recent bucket at index 0.
    const picked = pickWeightedRandom([r4, r2, r1, r3], {
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('r1');
  });

  it('splits an odd pool with the median in the recent bucket', () => {
    // Pool of 3 → recentCount = ceil(1.5) = 2 → recent = [r1, r2], older = [r3].
    const older = pickWeightedRandom([r1, r2, r3], {
      random: () => RECENT_WEIGHT + 0.1,
    });
    expect(older?.id).toBe('r3');
  });

  it('gives the newest recipe the recent weight even with only two recipes', () => {
    // Regression: a small pool must not let the newest recipe be picked every time.
    // recent = [r1], older = [r2]. Older bucket is still reachable 40% of the time.
    const older = pickWeightedRandom([r1, r2], {
      random: () => RECENT_WEIGHT + 0.1,
    });
    expect(older?.id).toBe('r2');

    const recent = pickWeightedRandom([r1, r2], {
      random: () => RECENT_WEIGHT - 0.1,
    });
    expect(recent?.id).toBe('r1');
  });

  it('ranks recipes without created_at as oldest', () => {
    const legacy = makeRecipe('legacy', null);
    const rolls = [RECENT_WEIGHT + 0.1, 0]; // older bucket, index 0
    let i = 0;
    const picked = pickWeightedRandom([r1, legacy], {
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('legacy');
  });

  it('ranks unparseable created_at values as oldest', () => {
    const bad = makeRecipe('bad', 'not-a-date');
    const rolls = [RECENT_WEIGHT + 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom([r1, bad], {
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('bad');
  });

  it('respects a custom recentFraction', () => {
    // recentFraction 0.25 on a pool of 4 → recent = [r1], older = [r2, r3, r4].
    const picked = pickWeightedRandom([r1, r2, r3, r4], {
      recentFraction: 0.25,
      random: () => RECENT_WEIGHT - 0.1, // recent bucket, single element
    });
    expect(picked?.id).toBe('r1');
  });
});
