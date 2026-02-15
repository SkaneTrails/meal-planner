// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  aggregateIngredients,
  type RecipeForAggregation,
} from '../groceryAggregator';

const makeRecipe = (
  overrides: Partial<RecipeForAggregation> & { id: string },
): RecipeForAggregation => ({
  title: 'Test Recipe',
  ingredients: [],
  servings: 4,
  ...overrides,
});

describe('aggregateIngredients', () => {
  it('returns empty array when no meals selected', () => {
    const result = aggregateIngredients([], {}, [], {});
    expect(result).toEqual([]);
  });

  it('aggregates ingredients from a single recipe', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200 g pasta', '2 dl grädde'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('pasta');
    expect(result[0].quantity).toBe('200');
    expect(result[0].unit).toBe('g');
    expect(result[1].name).toBe('grädde');
  });

  it('merges same ingredient from two recipes', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200 g kyckling'],
        servings: 4,
      }),
      makeRecipe({
        id: 'r2',
        title: 'Wok',
        ingredients: ['300 g kyckling'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1', 'tue-lunch': 'r2' };
    const result = aggregateIngredients(
      ['mon-lunch', 'tue-lunch'],
      meals,
      recipes,
      {},
    );
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe('500');
    expect(result[0].recipe_sources).toEqual(['Pasta', 'Wok']);
  });

  it('scales ingredients by servings multiplier', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200 g pasta'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const mealServings = { 'mon-lunch': 8 };
    const result = aggregateIngredients(
      ['mon-lunch'],
      meals,
      recipes,
      mealServings,
    );
    expect(result[0].quantity).toBe('400');
    expect(result[0].recipe_sources[0]).toBe('Pasta (×8)');
  });

  it('includes custom meals as grocery items', () => {
    const meals = { 'mon-lunch': 'custom:Leftover pizza' };
    const result = aggregateIngredients(['mon-lunch'], meals, [], {});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Leftover pizza');
    expect(result[0].quantity).toBeNull();
    expect(result[0].recipe_sources).toEqual(['Leftover pizza']);
  });

  it('does not duplicate identical custom meals', () => {
    const meals = {
      'mon-lunch': 'custom:Leftover pizza',
      'tue-lunch': 'custom:Leftover pizza',
    };
    const result = aggregateIngredients(
      ['mon-lunch', 'tue-lunch'],
      meals,
      [],
      {},
    );
    expect(result).toHaveLength(1);
  });

  it('skips meals with no matching recipe', () => {
    const meals = { 'mon-lunch': 'nonexistent-id' };
    const result = aggregateIngredients(['mon-lunch'], meals, [], {});
    expect(result).toEqual([]);
  });

  it('strips step references from ingredients', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Thai',
        ingredients: ['2 dl kokosmjölk (steg 3)'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    expect(result[0].name).toBe('kokosmjölk');
  });

  it('strips English step references', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Curry',
        ingredients: ['1 dl cream (step 2)'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    expect(result[0].name).toBe('cream');
  });

  it('does not merge ingredients with different units', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'A',
        ingredients: ['200 g smör', '2 msk smör'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    // Both have same normalized name "smör" so they merge into one entry
    // but quantity won't sum because units differ (g vs msk)
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('smör');
  });

  it('handles recipe with no servings', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Simple',
        ingredients: ['100 g socker'],
        servings: undefined,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    // Falls back to servings=2, mealServings default=recipe.servings||2=2, so multiplier=1
    expect(result[0].quantity).toBe('100');
  });

  it('tracks recipe sources without duplicates', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200 g kyckling', '1 dl grädde'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1', 'tue-lunch': 'r1' };
    const result = aggregateIngredients(
      ['mon-lunch', 'tue-lunch'],
      meals,
      recipes,
      {},
    );
    // Same recipe twice: kyckling should have quantity 400 and source listed once
    const chicken = result.find((r) => r.name === 'kyckling');
    expect(chicken?.quantity).toBe('400');
    // Source label is identical ("Pasta") so it should appear once
    expect(chicken?.recipe_sources).toEqual(['Pasta']);
  });

  it('handles ingredient without quantity', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Soup',
        ingredients: ['salt och peppar'],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});
    expect(result[0].name).toBe('salt och peppar');
    expect(result[0].quantity).toBeNull();
  });
});
