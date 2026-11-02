/**
 * The recipe list rules the API applies (recipe_queries.py), for the copy kept on the device:
 * hidden filter, a household's copy replacing the shared original, URL de-duplication, newest first.
 */

import type { Recipe } from '@/lib/types';

/** Same as the API's normalize_url: lowercase scheme, host and path, without a trailing slash. */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  const lowered = url.trim().toLowerCase();
  try {
    const parsed = new URL(lowered);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return lowered.replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
};

const newestFirst = (a: Recipe, b: Recipe): number => {
  const byCreated = (b.created_at ?? '').localeCompare(a.created_at ?? '');
  return byCreated !== 0 ? byCreated : b.id.localeCompare(a.id);
};

/** A household's copy of a shared recipe hides the original and other households' copies of it. */
const excludeCopiedOriginals = (
  recipes: Recipe[],
  householdId: string | null,
): Recipe[] => {
  if (!householdId) return recipes;
  const myOrigins = new Set(
    recipes
      .filter((r) => r.copied_from && r.household_id === householdId)
      .map((r) => r.copied_from as string),
  );
  if (myOrigins.size === 0) return recipes;
  return recipes.filter(
    (r) =>
      !myOrigins.has(r.id) &&
      !(
        r.copied_from &&
        myOrigins.has(r.copied_from) &&
        r.household_id !== householdId
      ),
  );
};

const deduplicateByUrl = (recipes: Recipe[]): Recipe[] => {
  const seen = new Set<string>();
  return recipes.filter((recipe) => {
    const key = recipe.url ? normalizeUrl(recipe.url) : `__no_url_${recipe.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * The recipes to show, newest first.
 * @param householdId The user's household, or null for a superuser (no copy rules).
 */
export const visibleRecipes = (
  recipes: Recipe[],
  {
    householdId,
    showHidden,
  }: { householdId: string | null; showHidden: boolean },
): Recipe[] => {
  const shown = showHidden ? recipes : recipes.filter((r) => !r.hidden);
  return deduplicateByUrl(
    [...excludeCopiedOriginals(shown, householdId)].sort(newestFirst),
  );
};

/** Same matching as the API's search: case-insensitive substring of title, a tag or an ingredient. */
export const searchRecipes = (recipes: Recipe[], query: string): Recipe[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return recipes;
  return recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(needle) ||
      (r.tags ?? []).some((tag) => tag.toLowerCase().includes(needle)) ||
      (r.ingredients ?? []).some((ing) => ing.toLowerCase().includes(needle)),
  );
};
