/**
 * Weighted random recipe selection.
 *
 * Recently added recipes are given a higher chance of being surfaced so the
 * random meal picker keeps suggesting fresh additions instead of drowning them
 * out among the whole (much larger) back catalogue.
 *
 * Recency is defined by *rank*, not by a fixed time window: the newest half of
 * the pool shares {@link RECENT_WEIGHT}, the older half shares the rest. This
 * scales with the library — it never lets a handful of recent recipes dominate
 * (as a fixed "last N months" window would when few recipes are added).
 */

import type { Recipe } from '@/lib/types';

/** Fraction of the pool (newest-first) that counts as the "recent" bucket. */
export const RECENT_FRACTION = 0.5;

/** Combined probability of drawing from the recent bucket (vs. older). */
export const RECENT_WEIGHT = 0.6;

export interface WeightedRandomOptions {
  /** Exclude this recipe id from the draw (e.g. avoid repeating the last pick). */
  excludeId?: string | null;
  /** RNG returning [0, 1). Injectable for deterministic tests. */
  random?: () => number;
  recentFraction?: number;
  recentWeight?: number;
}

const createdMs = (recipe: Recipe): number => {
  if (!recipe.created_at) return Number.NEGATIVE_INFINITY;
  const created = new Date(recipe.created_at).getTime();
  return Number.isNaN(created) ? Number.NEGATIVE_INFINITY : created;
};

/**
 * Pick a random recipe, favouring more recently created ones.
 *
 * The pool is ranked newest-first; the newest {@link RECENT_FRACTION} share a
 * {@link RECENT_WEIGHT} chance of being chosen, the rest share the remainder.
 * Within each bucket the pick is uniform. Recipes without a valid `created_at`
 * are ranked oldest. Pools of 0 or 1 (after exclusion) short-circuit.
 */
export const pickWeightedRandom = (
  recipes: Recipe[],
  options: WeightedRandomOptions = {},
): Recipe | null => {
  const {
    excludeId = null,
    random = Math.random,
    recentFraction = RECENT_FRACTION,
    recentWeight = RECENT_WEIGHT,
  } = options;

  const pool = excludeId ? recipes.filter((r) => r.id !== excludeId) : recipes;
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  const sorted = [...pool].sort((a, b) => createdMs(b) - createdMs(a));
  const recentCount = Math.ceil(sorted.length * recentFraction);
  const recent = sorted.slice(0, recentCount);
  const older = sorted.slice(recentCount);

  if (recent.length === 0 || older.length === 0) {
    return pool[Math.floor(random() * pool.length)];
  }

  const bucket = random() < recentWeight ? recent : older;
  return bucket[Math.floor(random() * bucket.length)];
};
