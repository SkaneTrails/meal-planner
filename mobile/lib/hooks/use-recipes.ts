/**
 * React Query hooks for recipes.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { RecipeCreate, RecipeUpdate } from '../types';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (search?: string) =>
    [...recipeKeys.lists(), { search }] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) =>
    [...recipeKeys.details(), id] as const,
};

/**
 * Hook to fetch all recipes.
 */
export const useRecipes = (search?: string) => {
  return useQuery({
    queryKey: recipeKeys.list(search),
    queryFn: () => api.getRecipes(search),
  });
}

/**
 * Hook to fetch a single recipe by ID.
 */
export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => api.getRecipe(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new recipe.
 */
export const useCreateRecipe = () => {
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
export const useScrapeRecipe = () => {
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
export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: RecipeUpdate;
    }) => api.updateRecipe(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(recipeKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to delete a recipe.
 */
export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteRecipe(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: recipeKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
