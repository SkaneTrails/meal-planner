/**
 * Weighted random recipe selection.
 *
 * Recently added recipes are given a higher chance of being surfaced so the
 * random meal picker keeps suggesting fresh additions instead of drowning them
 * out among the whole (much larger) back catalogue.
 */

import type { Recipe } from '@/lib/types';

/** Recipes created within this many months count as "recent". */
export const RECENT_WINDOW_MONTHS = 6;

/** Combined probability of drawing from the recent bucket (vs. older). */
export const RECENT_WEIGHT = 0.6;

export interface WeightedRandomOptions {
  /** Exclude this recipe id from the draw (e.g. avoid repeating the last pick). */
  excludeId?: string | null;
  /** Current time in ms. Injectable for deterministic tests. */
  now?: number;
  /** RNG returning [0, 1). Injectable for deterministic tests. */
  random?: () => number;
  recentWindowMonths?: number;
  recentWeight?: number;
}

const isRecent = (recipe: Recipe, cutoffMs: number): boolean => {
  if (!recipe.created_at) return false;
  const created = new Date(recipe.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return created >= cutoffMs;
};

/**
 * Pick a random recipe, favouring recently created ones.
 *
 * Recipes from the last {@link RECENT_WINDOW_MONTHS} months collectively have a
 * {@link RECENT_WEIGHT} chance of being chosen; older recipes share the rest.
 * Within each bucket the pick is uniform. If either bucket is empty the draw
 * falls back to a uniform pick over the whole pool.
 */
export const pickWeightedRandom = (
  recipes: Recipe[],
  options: WeightedRandomOptions = {},
): Recipe | null => {
  const {
    excludeId = null,
    now = Date.now(),
    random = Math.random,
    recentWindowMonths = RECENT_WINDOW_MONTHS,
    recentWeight = RECENT_WEIGHT,
  } = options;

  const pool = excludeId ? recipes.filter((r) => r.id !== excludeId) : recipes;
  if (pool.length === 0) return null;

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - recentWindowMonths);
  const cutoffMs = cutoff.getTime();

  const recent: Recipe[] = [];
  const older: Recipe[] = [];
  for (const recipe of pool) {
    (isRecent(recipe, cutoffMs) ? recent : older).push(recipe);
  }

  if (recent.length === 0 || older.length === 0) {
    return pool[Math.floor(random() * pool.length)];
  }

  const bucket = random() < recentWeight ? recent : older;
  return bucket[Math.floor(random() * bucket.length)];
};
