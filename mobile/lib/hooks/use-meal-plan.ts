/**
 * React Query hooks for meal plans.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { MealPlanUpdate, MealUpdateRequest, NoteUpdateRequest } from '../types';

// Default user ID until auth is implemented
const DEFAULT_USER_ID = 'default';

// Query keys
export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  detail: (userId: string) => [...mealPlanKeys.all, userId] as const,
};

/**
 * Hook to fetch a user's meal plan.
 */
export function useMealPlan(userId: string = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: mealPlanKeys.detail(userId),
    queryFn: () => api.getMealPlan(userId),
  });
}

/**
 * Hook to update the meal plan (batch update).
 */
export function useUpdateMealPlan(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: MealPlanUpdate) => api.updateMealPlan(updates, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(userId), data);
    },
  });
}

/**
 * Hook to update a single meal.
 */
export function useUpdateMeal(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: MealUpdateRequest) => api.updateMeal(request, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(userId), data);
    },
  });
}

/**
 * Hook to update a day note.
 */
export function useUpdateNote(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: NoteUpdateRequest) => api.updateNote(request, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(userId), data);
    },
  });
}

/**
 * Hook to clear the meal plan.
 */
export function useClearMealPlan(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.clearMealPlan(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(userId) });
    },
  });
}

/**
 * Hook to set a meal (recipe or custom text).
 */
export function useSetMeal(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ date, mealType, recipeId, customText }: {
      date: string;
      mealType: string;
      recipeId?: string;
      customText?: string;
    }) => {
      const value = recipeId || (customText ? `custom:${customText}` : null);
      return api.updateMeal({ date, meal_type: mealType, value }, userId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(userId), data);
    },
  });
}

/**
 * Hook to remove a meal from the plan.
 */
export function useRemoveMeal(userId: string = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ date, mealType }: { date: string; mealType: string }) => {
      return api.updateMeal({ date, meal_type: mealType, value: null }, userId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mealPlanKeys.detail(userId), data);
    },
  });
}
