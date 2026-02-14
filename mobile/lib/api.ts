/**
 * API client for the Meal Planner backend.
 * Re-exports the modular API surface as a unified singleton.
 */

export { adminApi } from './api/admin';
export {
  ApiClientError,
  setAuthTokenGetter,
  setOnUnauthorized,
} from './api/client';
export { groceryApi, mealPlanApi } from './api/mealPlans';
export { recipeApi } from './api/recipes';

import { adminApi } from './api/admin';
import { groceryApi, mealPlanApi } from './api/mealPlans';
// Unified API singleton — preserves the `api.method()` calling convention
// used throughout the codebase (hooks, actions, tests).
import { recipeApi } from './api/recipes';

export const api = {
  ...recipeApi,
  ...mealPlanApi,
  ...groceryApi,
  ...adminApi,
};
