/**
 * API client for the Meal Planner backend.
 * Re-exports the modular API surface as a unified singleton.
 */

export { ApiClientError, setAuthTokenGetter, setOnUnauthorized } from './api/client';
export { recipeApi } from './api/recipes';
export { mealPlanApi, groceryApi } from './api/mealPlans';
export { adminApi } from './api/admin';

// Unified API singleton — preserves the `api.method()` calling convention
// used throughout the codebase (hooks, actions, tests).
import { recipeApi } from './api/recipes';
import { mealPlanApi, groceryApi } from './api/mealPlans';
import { adminApi } from './api/admin';

export const api = {
  ...recipeApi,
  ...mealPlanApi,
  ...groceryApi,
  ...adminApi,
};
