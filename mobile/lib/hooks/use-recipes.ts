/**
 * React Query hooks for recipes.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../api';
import type { PaginatedRecipeList, Recipe, RecipeCreate, RecipeUpdate } from '../types';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (search?: string) =>
    [...recipeKeys.lists(), { search }] as const,
  allRecipes: () => [...recipeKeys.all, 'all'] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) =>
    [...recipeKeys.details(), id] as const,
};

/**
 * Hook to fetch recipes with infinite scrolling (cursor-based pagination).
 * Used by the recipe library screen for paginated browsing.
 */
export const useRecipes = (search?: string) => {
  return useInfiniteQuery<PaginatedRecipeList>({
    queryKey: recipeKeys.list(search),
    queryFn: async ({ pageParam }) => {
      return api.getRecipes(search, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
};

/**
 * Hook to fetch ALL recipes across all pages.
 * Used by consumers that need the complete recipe list (meal planner, grocery, home screen).
 * Auto-fetches subsequent pages until all recipes are loaded.
 */
export const useAllRecipes = () => {
  const query = useInfiniteQuery<PaginatedRecipeList>({
    queryKey: recipeKeys.allRecipes(),
    queryFn: async ({ pageParam }) => {
      return api.getRecipes(undefined, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });

  // Auto-fetch next pages
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const recipes: Recipe[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const totalCount = query.data?.pages[0]?.total_count ?? 0;

  return {
    ...query,
    recipes,
    totalCount,
  };
};

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
