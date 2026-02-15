import type { GroceryItem } from '@/lib/types';
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
  servings?: number;
}

export const aggregateIngredients = (
  selectedMealKeys: string[],
  meals: Record<string, string>,
  recipes: RecipeForAggregation[],
  mealServings: Record<string, number>,
): GroceryItem[] => {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const ingredientsMap = new Map<string, GroceryItem>();

  selectedMealKeys.forEach((key) => {
    const recipeId = meals[key];
    if (!recipeId || recipeId.startsWith('custom:')) return;

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
