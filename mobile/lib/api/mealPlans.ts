/**
 * Meal plan and grocery API endpoints.
 */

import type {
  ExtrasUpdateRequest,
  GroceryList,
  GroceryListState,
  GroceryListStatePatch,
  GroceryListStateSave,
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

  updateExtras: (request: ExtrasUpdateRequest): Promise<MealPlan> => {
    return apiRequest<MealPlan>('/meal-plans/extras', {
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

  getGroceryState: (): Promise<GroceryListState> => {
    return apiRequest<GroceryListState>('/grocery/state');
  },

  saveGroceryState: (body: GroceryListStateSave): Promise<GroceryListState> => {
    return apiRequest<GroceryListState>('/grocery/state', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patchGroceryState: (
    body: GroceryListStatePatch,
  ): Promise<GroceryListState> => {
    return apiRequest<GroceryListState>('/grocery/state', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  clearGroceryState: (): Promise<void> => {
    return apiRequest<void>('/grocery/state', { method: 'DELETE' });
  },
};
