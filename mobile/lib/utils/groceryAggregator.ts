import type { GroceryItem } from '@/lib/types';
import { formatDateLocal } from '@/lib/utils/dateFormatter';
import {
  normalizeIngredientName,
  parseIngredient,
  scaleIngredient,
} from '@/lib/utils/ingredientParser';

const stripStepReference = (text: string): string => {
  return text
    .replace(/\s*\(steg\s*\d+\)\s*$/i, '')
    .replace(/\s*\(step\s*\d+\)\s*$/i, '')
    .replace(/\s+till\s+\w+$/i, '')
    .trim();
};

export interface RecipeForAggregation {
  id: string;
  title: string;
  ingredients: string[];
  servings?: number | null;
}

export const EXTRAS_KEY_PREFIX = 'extras_';

export const aggregateIngredients = (
  selectedMealKeys: string[],
  meals: Record<string, string>,
  recipes: RecipeForAggregation[],
  mealServings: Record<string, number>,
): GroceryItem[] => {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const ingredientsMap = new Map<string, GroceryItem>();

  selectedMealKeys.forEach((key) => {
    const recipeId = key.startsWith(EXTRAS_KEY_PREFIX)
      ? key.slice(EXTRAS_KEY_PREFIX.length)
      : meals[key];
    if (!recipeId) return;

    // Include custom (quick) meals as simple grocery items
    if (recipeId.startsWith('custom:')) {
      const customText = recipeId.slice('custom:'.length);
      if (customText && !ingredientsMap.has(customText)) {
        ingredientsMap.set(customText, {
          name: customText,
          quantity: null,
          unit: null,
          category: 'other',
          checked: false,
          recipe_sources: [customText],
          quantity_sources: [],
        });
      }
      return;
    }

    const recipe = recipeMap.get(recipeId);
    if (!recipe) return;

    const requestedServings = mealServings[key] || recipe.servings || 2;
    const recipeServings = recipe.servings || 2;
    const multiplier = requestedServings / recipeServings;

    const sourceLabel =
      multiplier !== 1
        ? `${recipe.title} (×${requestedServings})`
        : recipe.title;

    recipe.ingredients.forEach((ingredient) => {
      const cleanedIngredient = stripStepReference(ingredient);
      const scaledIngredient = scaleIngredient(cleanedIngredient, multiplier);
      const normalizedName = normalizeIngredientName(cleanedIngredient);
      const parsed = parseIngredient(scaledIngredient);

      if (!ingredientsMap.has(normalizedName)) {
        ingredientsMap.set(normalizedName, {
          name: parsed.name,
          quantity: parsed.quantity !== null ? String(parsed.quantity) : null,
          unit: parsed.unit,
          category: 'other',
          checked: false,
          recipe_sources: [sourceLabel],
          quantity_sources: [],
        });
      } else {
        const item = ingredientsMap.get(normalizedName);
        if (!item) return;
        if (!item.recipe_sources.includes(sourceLabel)) {
          item.recipe_sources.push(sourceLabel);
        }
        if (parsed.quantity !== null && item.quantity !== null) {
          const existingQty = parseFloat(item.quantity);
          if (!Number.isNaN(existingQty) && parsed.unit === item.unit) {
            item.quantity = String(existingQty + parsed.quantity);
          }
        }
      }
    });
  });

  return Array.from(ingredientsMap.values());
};

const DAY_KEY = /^(\d{4}-\d{2}-\d{2})_/;

/**
 * Selected meals that still belong on the list: day meals from the current week on, and extras
 * in the Other section of a week that has not ended. Older ones drop off.
 */
export const activeMealKeys = (
  selectedMealKeys: string[],
  extras: Record<string, string[]>,
  currentWeekStart: Date,
): string[] => {
  const weekStart = formatDateLocal(currentWeekStart);
  // A week key is its first day; that week has not ended if it started at most 6 days earlier.
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(currentWeekStart.getDate() - 6);
  const earliestWeek = formatDateLocal(earliestWeekStart);
  const currentExtras = new Set(
    Object.entries(extras)
      .filter(([week]) => week >= earliestWeek)
      .flatMap(([, ids]) => ids),
  );
  return selectedMealKeys.filter((key) => {
    if (key.startsWith(EXTRAS_KEY_PREFIX)) {
      return currentExtras.has(key.slice(EXTRAS_KEY_PREFIX.length));
    }
    const day = DAY_KEY.exec(key)?.[1];
    return !day || day >= weekStart;
  });
};

const visibleSignature = (items: GroceryItem[], hidden: Set<string>) =>
  items
    .filter((item) => !hidden.has(item.name))
    .map((item) => `${item.name}|${item.quantity}|${item.unit}`)
    .sort()
    .join('\n');

/**
 * Drop meals that are fully shopped: a meal whose removal changes nothing still to buy (every
 * item it adds is picked or hidden). Meals whose recipe is not loaded are kept. The hidden list
 * is reduced to names the remaining meals still produce.
 */
export const pruneShoppedMeals = (
  mealKeys: string[],
  meals: Record<string, string>,
  recipes: RecipeForAggregation[],
  mealServings: Record<string, number>,
  hidden: Set<string>,
): { mealKeys: string[]; removedItems: string[] } => {
  const aggregate = (keys: string[]) =>
    aggregateIngredients(keys, meals, recipes, mealServings);
  let remaining = [...mealKeys];
  for (const key of mealKeys) {
    if (aggregate([key]).length === 0) continue;
    const without = remaining.filter((k) => k !== key);
    if (
      visibleSignature(aggregate(remaining), hidden) ===
      visibleSignature(aggregate(without), hidden)
    ) {
      remaining = without;
    }
  }
  const stillProduced = new Set(aggregate(remaining).map((item) => item.name));
  return {
    mealKeys: remaining,
    removedItems: [...hidden].filter((name) => stillProduced.has(name)),
  };
};
