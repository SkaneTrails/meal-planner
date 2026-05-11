/**
 * Module-level recipe library filter cache.
 *
 * Persists user-applied filters across screen blurs (e.g. tapping a recipe
 * and coming back from the detail page). Cleared either via the in-screen
 * 'Rensa' action OR by `resetRecipeFilterCache` when the user navigates
 * away from the recipes flow entirely (see root layout pathname watcher).
 *
 * Lives outside the route module so the root layout can reset filters
 * without importing a screen file (which would also execute that screen's
 * top-level side effects at app startup).
 */

import type { DietLabel, LibraryScope, MealLabel } from '@/lib/types';
import type { SortOption } from '@/lib/utils/recipeSorter';

export interface RecipeFilterState {
  searchQuery: string;
  dietFilter: DietLabel | null;
  mealFilters: MealLabel[];
  sortBy: SortOption;
  showFavoritesOnly: boolean;
  libraryScope: LibraryScope;
}

const defaultFilterState: RecipeFilterState = {
  searchQuery: '',
  dietFilter: null,
  mealFilters: [],
  sortBy: 'newest',
  showFavoritesOnly: false,
  libraryScope: 'all',
};

export const recipeFilterCache: RecipeFilterState = { ...defaultFilterState };

export const resetRecipeFilterCache = () => {
  Object.assign(recipeFilterCache, defaultFilterState, { mealFilters: [] });
};
