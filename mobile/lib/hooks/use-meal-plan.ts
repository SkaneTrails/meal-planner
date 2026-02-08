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
export const useMealPlan = () => {
  return useQuery({
    queryKey: mealPlanKeys.detail(),
    queryFn: () => api.getMealPlan(),
  });
}

/**
 * Hook to update the meal plan (batch update).
 */
export const useUpdateMealPlan = () => {
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
export const useUpdateMeal = () => {
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
export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NoteUpdateRequest) => api.updateNote(request),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
    onError: () => {
      // Refetch to ensure UI is in sync with server on error
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail() });
    },
  });
}

/**
 * Hook to clear the meal plan.
 */
export const useClearMealPlan = () => {
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
export const useSetMeal = () => {
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
    onError: () => {
      // Refetch to ensure UI is in sync with server on error
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail() });
    },
  });
}

/**
 * Hook to remove a meal from the plan.
 */
export const useRemoveMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, mealType }: { date: string; mealType: string }) => {
      return api.updateMeal({ date, meal_type: mealType, value: null });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(), data);
    },
    onError: () => {
      // Refetch to ensure UI is in sync with server on error
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail() });
    },
  });
}
