/**
 * React Query hooks for meal plans.
 * Note: household_id is resolved server-side from authentication.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  MealPlanUpdate,
  MealUpdateRequest,
  NoteUpdateRequest,
} from '../types';

// Query keys
export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  detail: () => [...mealPlanKeys.all, 'current'] as const,
};

/**
 * Hook to fetch the current household's meal plan.
 */
export function useMealPlan() {
  return useQuery({
    queryKey: mealPlanKeys.detail(),
    queryFn: () => api.getMealPlan(),
  });
}

/**
 * Hook to update the meal plan (batch update).
 */
export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: MealPlanUpdate) => api.updateMealPlan(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
  });
}

/**
 * Hook to update a single meal.
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MealUpdateRequest) => api.updateMeal(request),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
  });
}

/**
 * Hook to update a day note.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NoteUpdateRequest) => api.updateNote(request),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
  });
}

/**
 * Hook to clear the meal plan.
 */
export function useClearMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.clearMealPlan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail() });
    },
  });
}

/**
 * Hook to set a meal (recipe or custom text).
 */
export function useSetMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      date,
      mealType,
      recipeId,
      customText,
    }: {
      date: string;
      mealType: string;
      recipeId?: string;
      customText?: string;
    }) => {
      const value = recipeId || (customText ? `custom:${customText}` : null);
      return api.updateMeal({ date, meal_type: mealType, value });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
  });
}

/**
 * Hook to remove a meal from the plan.
 */
export function useRemoveMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, mealType }: { date: string; mealType: string }) => {
      return api.updateMeal({ date, meal_type: mealType, value: null });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
  });
}
