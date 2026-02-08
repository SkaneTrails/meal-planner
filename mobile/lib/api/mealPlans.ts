/**
 * Meal plan and grocery API endpoints.
 */

import type {
  GroceryList,
  MealPlan,
  MealPlanUpdate,
  MealUpdateRequest,
  NoteUpdateRequest,
} from '../types';
import { apiRequest } from './client';

export const mealPlanApi = {
  getMealPlan: (): Promise<MealPlan> => {
    return apiRequest<MealPlan>('/meal-plans');
  },

  updateMealPlan: (updates: MealPlanUpdate): Promise<MealPlan> => {
    return apiRequest<MealPlan>('/meal-plans', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  updateMeal: (request: MealUpdateRequest): Promise<MealPlan> => {
    return apiRequest<MealPlan>('/meal-plans/meals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  updateNote: (request: NoteUpdateRequest): Promise<MealPlan> => {
    return apiRequest<MealPlan>('/meal-plans/notes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  clearMealPlan: (): Promise<void> => {
    return apiRequest<void>('/meal-plans', { method: 'DELETE' });
  },
};

export const groceryApi = {
  getGroceryList: (options?: {
    start_date?: string;
    end_date?: string;
    days?: number;
  }): Promise<GroceryList> => {
    const params = new URLSearchParams();
    if (options?.start_date) params.set('start_date', options.start_date);
    if (options?.end_date) params.set('end_date', options.end_date);
    if (options?.days) params.set('days', options.days.toString());
    const query = params.toString();
    return apiRequest<GroceryList>(`/grocery${query ? `?${query}` : ''}`);
  },
};
