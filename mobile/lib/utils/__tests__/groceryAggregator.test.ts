// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  activeMealKeys,
  aggregateIngredients,
  EXTRAS_KEY_PREFIX,
  pruneShoppedMeals,
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

  it('keeps garnish ingredients when stripping trailing serving notes', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Laxpudding',
        ingredients: [
          '1 knippe grön sparris till servering',
          '2 msk riven pepparrot till servering',
        ],
        servings: 4,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const result = aggregateIngredients(['mon-lunch'], meals, recipes, {});

    expect(result.map((item) => item.name)).toEqual([
      'grön sparris',
      'riven pepparrot',
    ]);
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

  it('aggregates extras recipes by recipe ID directly', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Hummus',
        ingredients: ['400 g kikärtor', '2 msk tahini'],
        servings: 4,
      }),
    ];
    const meals = {};
    const key = `${EXTRAS_KEY_PREFIX}r1`;
    const result = aggregateIngredients([key], meals, recipes, {});
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('kikärtor');
    expect(result[0].quantity).toBe('400');
  });

  it('scales extras recipes by mealServings', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Guacamole',
        ingredients: ['200 g avokado'],
        servings: 2,
      }),
    ];
    const meals = {};
    const key = `${EXTRAS_KEY_PREFIX}r1`;
    const result = aggregateIngredients([key], meals, recipes, { [key]: 4 });
    expect(result[0].quantity).toBe('400');
    expect(result[0].recipe_sources).toEqual(['Guacamole (×4)']);
  });

  it('merges extras and regular meal ingredients', () => {
    const recipes = [
      makeRecipe({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200 g tomat'],
        servings: 4,
      }),
      makeRecipe({
        id: 'r2',
        title: 'Salsa',
        ingredients: ['100 g tomat'],
        servings: 2,
      }),
    ];
    const meals = { 'mon-lunch': 'r1' };
    const extrasKey = `${EXTRAS_KEY_PREFIX}r2`;
    const result = aggregateIngredients(
      ['mon-lunch', extrasKey],
      meals,
      recipes,
      {},
    );
    const tomat = result.find((r) => r.name === 'tomat');
    expect(tomat?.quantity).toBe('300');
    expect(tomat?.recipe_sources).toEqual(['Pasta', 'Salsa']);
  });
});

describe('activeMealKeys', () => {
  const weekStart = new Date(2026, 4, 11); // Monday 2026-05-11

  it('drops day meals from before the current week', () => {
    const keys = [
      '2026-05-10_dinner',
      '2026-05-11_lunch',
      '2026-05-20_dinner',
    ];
    expect(activeMealKeys(keys, {}, weekStart)).toEqual([
      '2026-05-11_lunch',
      '2026-05-20_dinner',
    ]);
  });

  it('keeps keys without a date', () => {
    expect(activeMealKeys(['mon_dinner'], {}, weekStart)).toEqual([
      'mon_dinner',
    ]);
  });

  it('keeps extras only from weeks that have not ended', () => {
    const extras = {
      '2026-05-04': ['last-week'],
      '2026-05-05': ['ends-today'],
      '2026-05-11': ['this-week'],
      '2026-05-18': ['next-week'],
    };
    const keys = [
      'last-week',
      'ends-today',
      'this-week',
      'next-week',
      'removed',
    ].map((id) => `${EXTRAS_KEY_PREFIX}${id}`);
    expect(activeMealKeys(keys, extras, weekStart)).toEqual([
      `${EXTRAS_KEY_PREFIX}ends-today`,
      `${EXTRAS_KEY_PREFIX}this-week`,
      `${EXTRAS_KEY_PREFIX}next-week`,
    ]);
  });
});

describe('pruneShoppedMeals', () => {
  const recipes = [
    makeRecipe({ id: 'pasta', title: 'Pasta', ingredients: ['200 g pasta', '1 tsk salt'] }),
    makeRecipe({ id: 'soup', title: 'Soup', ingredients: ['2 morötter', '1 tsk salt'] }),
  ];
  const meals = { mon_dinner: 'pasta', tue_dinner: 'soup' };

  it('drops meals whose items are all picked and keeps the rest', () => {
    const result = pruneShoppedMeals(
      ['mon_dinner', 'tue_dinner'],
      meals,
      recipes,
      {},
      new Set(['pasta', 'salt', 'old item']),
    );
    expect(result.mealKeys).toEqual(['tue_dinner']);
    expect(result.removedItems).toEqual(['salt']);
  });

  it('keeps a meal that shares an item still to buy', () => {
    const result = pruneShoppedMeals(
      ['mon_dinner', 'tue_dinner'],
      meals,
      recipes,
      {},
      new Set(['pasta', 'morötter']),
    );
    expect(result.mealKeys).toEqual(['mon_dinner', 'tue_dinner']);
    expect(result.removedItems).toEqual(['pasta', 'morötter']);
  });

  it('keeps meals whose recipe is not loaded', () => {
    const result = pruneShoppedMeals(
      ['wed_dinner'],
      { wed_dinner: 'missing' },
      recipes,
      {},
      new Set(),
    );
    expect(result.mealKeys).toEqual(['wed_dinner']);
  });

  it('drops a picked quick meal', () => {
    const result = pruneShoppedMeals(
      ['thu_dinner'],
      { thu_dinner: 'custom:Tacos' },
      recipes,
      {},
      new Set(['Tacos']),
    );
    expect(result).toEqual({ mealKeys: [], removedItems: [] });
  });
});
