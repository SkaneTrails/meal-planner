import { describe, it, expect } from 'vitest';
import { mockRecipe } from '@/test/helpers';
import { sortRecipes } from '../recipeSorter';

const quickRecipe = mockRecipe({ id: 'quick', title: 'Quick Pasta', total_time: 15 });
const mediumRecipe = mockRecipe({ id: 'medium', title: 'Grilled Chicken', total_time: 45 });
const slowRecipe = mockRecipe({ id: 'slow', title: 'Beef Stew', total_time: 120 });
const noTimeRecipe = mockRecipe({ id: 'notime', title: 'Mystery Dish', total_time: null });
const anotherNoTime = mockRecipe({ id: 'notime2', title: 'Another Mystery', total_time: null });

const recipes = [mediumRecipe, quickRecipe, slowRecipe, noTimeRecipe, anotherNoTime];

describe('sortRecipes', () => {
  it('returns recipes unchanged for "newest" sort', () => {
    const result = sortRecipes(recipes, 'newest');
    expect(result).toEqual(recipes);
  });

  it('reverses order for "oldest" sort', () => {
    const result = sortRecipes(recipes, 'oldest');
    expect(result.map((r) => r.id)).toEqual([
      'notime2', 'notime', 'slow', 'quick', 'medium',
    ]);
  });

  it('sorts alphabetically by title for "name" sort', () => {
    const result = sortRecipes(recipes, 'name');
    expect(result.map((r) => r.title)).toEqual([
      'Another Mystery', 'Beef Stew', 'Grilled Chicken', 'Mystery Dish', 'Quick Pasta',
    ]);
  });

  describe('quickest sort', () => {
    it('sorts by total_time ascending', () => {
      const result = sortRecipes(recipes, 'quickest');
      expect(result.map((r) => r.id)).toEqual([
        'quick', 'medium', 'slow', 'notime', 'notime2',
      ]);
    });

    it('places recipes without total_time at the end', () => {
      const result = sortRecipes(recipes, 'quickest');
      const lastTwo = result.slice(-2);
      expect(lastTwo.every((r) => r.total_time == null)).toBe(true);
    });
  });

  describe('longest sort', () => {
    it('sorts by total_time descending', () => {
      const result = sortRecipes(recipes, 'longest');
      expect(result.map((r) => r.id)).toEqual([
        'slow', 'medium', 'quick', 'notime', 'notime2',
      ]);
    });

    it('places recipes without total_time at the end', () => {
      const result = sortRecipes(recipes, 'longest');
      const lastTwo = result.slice(-2);
      expect(lastTwo.every((r) => r.total_time == null)).toBe(true);
    });
  });

  it('does not mutate the original array', () => {
    const original = [...recipes];
    sortRecipes(recipes, 'quickest');
    expect(recipes).toEqual(original);
  });
});
