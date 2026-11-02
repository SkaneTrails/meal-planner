import { describe, expect, it } from 'vitest';
import { mockRecipe } from '@/test/helpers';
import { normalizeUrl, searchRecipes, visibleRecipes } from '../visible-recipes';

const ids = (recipes: { id: string }[]) => recipes.map((r) => r.id);

describe('normalizeUrl (same as the API)', () => {
  it('lowercases and drops trailing slashes, query and fragment', () => {
    expect(normalizeUrl('HTTPS://Example.com/Recipe/?q=1#top')).toBe(
      'https://example.com/recipe',
    );
  });

  it('is empty for no URL', () => {
    expect(normalizeUrl('')).toBe('');
  });
});

describe('visibleRecipes', () => {
  const opts = { householdId: 'hh1', showHidden: false };

  it('sorts newest first, by id when created at the same time', () => {
    const recipes = [
      mockRecipe({ id: 'a', url: 'u-a', created_at: '2026-01-01T00:00:00Z' }),
      mockRecipe({ id: 'c', url: 'u-c', created_at: '2026-03-01T00:00:00Z' }),
      mockRecipe({ id: 'b', url: 'u-b', created_at: '2026-03-01T00:00:00Z' }),
    ];

    expect(ids(visibleRecipes(recipes, opts))).toEqual(['c', 'b', 'a']);
  });

  it('leaves out hidden recipes unless they should be shown', () => {
    const recipes = [
      mockRecipe({ id: 'shown', url: 'u1' }),
      mockRecipe({ id: 'hidden', url: 'u2', hidden: true }),
    ];

    expect(ids(visibleRecipes(recipes, opts))).toEqual(['shown']);
    expect(ids(visibleRecipes(recipes, { ...opts, showHidden: true }))).toContain('hidden');
  });

  it("shows the household's copy instead of the shared original and other copies of it", () => {
    const recipes = [
      mockRecipe({ id: 'orig', url: 'u-orig', household_id: 'hh2', visibility: 'shared' }),
      mockRecipe({ id: 'mine', url: 'u-mine', household_id: 'hh1', copied_from: 'orig' }),
      mockRecipe({ id: 'theirs', url: 'u-theirs', household_id: 'hh3', copied_from: 'orig', visibility: 'shared' }),
    ];

    expect(ids(visibleRecipes(recipes, opts))).toEqual(['mine']);
  });

  it('applies no copy rules for a superuser', () => {
    const recipes = [
      mockRecipe({ id: 'orig', url: 'u-orig', household_id: 'hh2' }),
      mockRecipe({ id: 'copy', url: 'u-copy', household_id: 'hh1', copied_from: 'orig' }),
    ];

    expect(ids(visibleRecipes(recipes, { householdId: null, showHidden: false }))).toHaveLength(2);
  });

  it('keeps only the newest recipe per URL; recipes without a URL are all kept', () => {
    const recipes = [
      mockRecipe({ id: 'old', url: 'https://x.com/r/', created_at: '2026-01-01T00:00:00Z' }),
      mockRecipe({ id: 'new', url: 'https://X.com/r', created_at: '2026-02-01T00:00:00Z' }),
      mockRecipe({ id: 'n1', url: '', created_at: '2025-01-01T00:00:00Z' }),
      mockRecipe({ id: 'n2', url: '', created_at: '2025-01-01T00:00:00Z' }),
    ];

    expect(ids(visibleRecipes(recipes, opts))).toEqual(['new', 'n2', 'n1']);
  });
});

describe('searchRecipes (same matching as the API)', () => {
  const recipes = [
    mockRecipe({ id: 'title', title: 'Tomato Soup', tags: [], ingredients: [] }),
    mockRecipe({ id: 'tag', title: 'Stew', tags: ['Winter'], ingredients: [] }),
    mockRecipe({ id: 'ing', title: 'Salad', tags: [], ingredients: ['2 tomatoes'] }),
  ];

  it('matches title, tags and ingredients, case-insensitively', () => {
    expect(ids(searchRecipes(recipes, 'TOMATO'))).toEqual(['title', 'ing']);
    expect(ids(searchRecipes(recipes, 'winter'))).toEqual(['tag']);
  });

  it('returns everything for a blank query', () => {
    expect(searchRecipes(recipes, '  ')).toHaveLength(3);
  });
});
