/**
 * Sorting utilities for recipe lists.
 */

import type { Recipe } from '@/lib/types';

export type SortOption = 'newest' | 'oldest' | 'name' | 'quickest' | 'longest';

export const sortRecipes = (
  recipes: Recipe[],
  sortBy: SortOption,
): Recipe[] => {
  if (sortBy === 'name') {
    return [...recipes].sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortBy === 'oldest') {
    return [...recipes].reverse();
  }

  if (sortBy === 'quickest') {
    return [...recipes].sort((a, b) => {
      if (a.total_time == null && b.total_time == null) return 0;
      if (a.total_time == null) return 1;
      if (b.total_time == null) return -1;
      return a.total_time - b.total_time;
    });
  }

  if (sortBy === 'longest') {
    return [...recipes].sort((a, b) => {
      if (a.total_time == null && b.total_time == null) return 0;
      if (a.total_time == null) return 1;
      if (b.total_time == null) return -1;
      return b.total_time - a.total_time;
    });
  }

  return recipes;
};
