import { describe, expect, it } from 'vitest';
import type { Recipe } from '@/lib/types';
import {
  pickWeightedRandom,
  RECENT_WEIGHT,
  RECENT_WINDOW_MONTHS,
} from '@/lib/utils/weightedRandom';

const NOW = new Date('2026-07-22T00:00:00Z').getTime();

const makeRecipe = (id: string, createdAt: string | null): Recipe =>
  ({ id, title: id, created_at: createdAt }) as Recipe;

const recentDate = '2026-06-01T00:00:00Z'; // within 6 months
const oldDate = '2024-01-01T00:00:00Z'; // well over 6 months

describe('pickWeightedRandom', () => {
  it('returns null for an empty list', () => {
    expect(pickWeightedRandom([], { now: NOW })).toBeNull();
  });

  it('returns null when the only recipe is excluded', () => {
    const recipes = [makeRecipe('a', recentDate)];
    expect(
      pickWeightedRandom(recipes, { now: NOW, excludeId: 'a' }),
    ).toBeNull();
  });

  it('excludes the given id from the draw', () => {
    const recipes = [makeRecipe('a', recentDate), makeRecipe('b', recentDate)];
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      excludeId: 'a',
      random: () => 0,
    });
    expect(picked?.id).toBe('b');
  });

  it('draws from the recent bucket when the weight roll is below RECENT_WEIGHT', () => {
    const recipes = [makeRecipe('recent', recentDate), makeRecipe('old', oldDate)];
    // First random() < RECENT_WEIGHT selects recent bucket; second picks index 0.
    const rolls = [RECENT_WEIGHT - 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('recent');
  });

  it('draws from the older bucket when the weight roll is at/above RECENT_WEIGHT', () => {
    const recipes = [makeRecipe('recent', recentDate), makeRecipe('old', oldDate)];
    const rolls = [RECENT_WEIGHT + 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('old');
  });

  it('treats recipes without created_at as older', () => {
    const recipes = [makeRecipe('recent', recentDate), makeRecipe('legacy', null)];
    const rolls = [RECENT_WEIGHT + 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('legacy');
  });

  it('falls back to a uniform pick when the older bucket is empty', () => {
    const recipes = [makeRecipe('a', recentDate), makeRecipe('b', recentDate)];
    // Weight roll is ignored; only the pool-index roll matters.
    const picked = pickWeightedRandom(recipes, { now: NOW, random: () => 0.99 });
    expect(picked?.id).toBe('b');
  });

  it('falls back to a uniform pick when the recent bucket is empty', () => {
    const recipes = [makeRecipe('a', oldDate), makeRecipe('b', oldDate)];
    const picked = pickWeightedRandom(recipes, { now: NOW, random: () => 0 });
    expect(picked?.id).toBe('a');
  });

  it('treats the window boundary using RECENT_WINDOW_MONTHS', () => {
    const cutoff = new Date(NOW);
    cutoff.setMonth(cutoff.getMonth() - RECENT_WINDOW_MONTHS);
    const justInside = new Date(cutoff.getTime() + 1000).toISOString();
    const recipes = [makeRecipe('recent', justInside), makeRecipe('old', oldDate)];
    const rolls = [RECENT_WEIGHT - 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('recent');
  });

  it('ignores unparseable created_at values (treated as older)', () => {
    const recipes = [
      makeRecipe('recent', recentDate),
      makeRecipe('bad', 'not-a-date'),
    ];
    const rolls = [RECENT_WEIGHT + 0.1, 0];
    let i = 0;
    const picked = pickWeightedRandom(recipes, {
      now: NOW,
      random: () => rolls[i++],
    });
    expect(picked?.id).toBe('bad');
  });
});
