/**
 * React Query hooks for recipes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Recipe, RecipeCreate, RecipeUpdate } from '../types';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (search?: string, enhanced?: boolean) => [...recipeKeys.lists(), { search, enhanced }] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string, enhanced?: boolean) => [...recipeKeys.details(), id, { enhanced }] as const,
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
    mutationFn: (url: string) => api.scrapeRecipe(url),
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
    mutationFn: ({ id, updates, enhanced = false }: { id: string; updates: RecipeUpdate; enhanced?: boolean }) =>
      api.updateRecipe(id, updates, enhanced),
    onSuccess: (data, variables) => {
      // Update the cache with new data - use correct enhanced key
      queryClient.setQueryData(recipeKeys.detail(data.id, variables.enhanced), data);
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
    mutationFn: ({ id, enhanced = false }: { id: string; enhanced?: boolean }) => 
      api.deleteRecipe(id, enhanced),
    onSuccess: (_, variables) => {
      // Remove from cache - use correct enhanced key
      queryClient.removeQueries({ queryKey: recipeKeys.detail(variables.id, variables.enhanced) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
