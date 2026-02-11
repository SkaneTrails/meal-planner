/**
 * React Query hooks for grocery list state (Firestore-backed).
 * Replaces AsyncStorage-only pattern with API-synced state
 * that is shared across all household members.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  GroceryListState,
  GroceryListStatePatch,
  GroceryListStateSave,
} from '../types';

export const groceryStateKeys = {
  all: ['grocery-state'] as const,
  current: () => [...groceryStateKeys.all, 'current'] as const,
};

/**
 * Hook to load the household's grocery list state from the API.
 */
export const useGroceryListState = () =>
  useQuery({
    queryKey: groceryStateKeys.current(),
    queryFn: () => api.getGroceryState(),
  });

/**
 * Hook to save (replace) the grocery list state.
 */
export const useSaveGroceryState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GroceryListStateSave) => api.saveGroceryState(body),
    onSuccess: (data) => {
      queryClient.setQueryData(groceryStateKeys.current(), data);
    },
  });
};

/**
 * Hook to partially update the grocery list state.
 */
export const usePatchGroceryState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: GroceryListStatePatch) => api.patchGroceryState(body),
    onSuccess: (data) => {
      queryClient.setQueryData(groceryStateKeys.current(), data);
    },
  });
};

/**
 * Hook to clear the grocery list state.
 */
export const useClearGroceryState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.clearGroceryState(),
    onSuccess: () => {
      queryClient.setQueryData(groceryStateKeys.current(), {
        selected_meals: [],
        meal_servings: {},
        checked_items: [],
        custom_items: [],
        updated_at: null,
        created_by: null,
      } satisfies GroceryListState);
    },
  });
};
