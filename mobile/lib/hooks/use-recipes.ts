/**
 * React Query hooks for recipes.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, api } from '../api';
import type { RecipeCreate, RecipeUpdate } from '../types';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (search?: string, enhanced?: boolean) =>
    [...recipeKeys.lists(), { search, enhanced }] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string, enhanced?: boolean) =>
    [...recipeKeys.details(), id, { enhanced }] as const,
};

/**
 * Hook to fetch all recipes.
 */
export function useRecipes(search?: string, enhanced: boolean = false) {
  return useQuery({
    queryKey: recipeKeys.list(search, enhanced),
    queryFn: () => api.getRecipes(search, enhanced),
  });
}

/**
 * Hook to fetch a single recipe by ID.
 */
export function useRecipe(id: string, enhanced: boolean = false) {
  return useQuery({
    queryKey: recipeKeys.detail(id, enhanced),
    queryFn: () => api.getRecipe(id, enhanced),
    enabled: !!id,
  });
}

/**
 * Hook to check if an enhanced version of a recipe exists.
 * Returns true if recipe exists in enhanced DB, false otherwise.
 * @param id - Recipe ID
 * @param isAuthReady - Whether auth is ready (prevents premature fetching)
 */
export function useEnhancedRecipeExists(
  id: string,
  isAuthReady: boolean = true,
) {
  return useQuery({
    queryKey: [...recipeKeys.detail(id, true), 'exists'] as const,
    queryFn: async () => {
      try {
        await api.getRecipe(id, true);
        return true;
      } catch (error) {
        // 404 = no enhanced version, other errors = rethrow
        if (error instanceof ApiClientError && error.status === 404) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!id && isAuthReady,
    retry: false,
    staleTime: 30000,
  });
}

/**
 * Hook to create a new recipe.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipe: RecipeCreate) => api.createRecipe(recipe),
    onSuccess: () => {
      // Invalidate recipe lists to refetch
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to scrape a recipe from URL.
 */
export function useScrapeRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      url,
      enhance = false,
    }: {
      url: string;
      enhance?: boolean;
    }) => api.scrapeRecipe(url, enhance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to update a recipe.
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      enhanced = false,
    }: {
      id: string;
      updates: RecipeUpdate;
      enhanced?: boolean;
    }) => api.updateRecipe(id, updates, enhanced),
    onSuccess: (data, variables) => {
      // Update the cache with new data - use correct enhanced key
      queryClient.setQueryData(
        recipeKeys.detail(data.id, variables.enhanced),
        data,
      );
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to delete a recipe.
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      enhanced = false,
    }: {
      id: string;
      enhanced?: boolean;
    }) => api.deleteRecipe(id, enhanced),
    onSuccess: (_, variables) => {
      // Remove from cache - use correct enhanced key
      queryClient.removeQueries({
        queryKey: recipeKeys.detail(variables.id, variables.enhanced),
      });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
