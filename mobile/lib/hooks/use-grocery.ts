/**
 * React Query hooks for grocery lists.
 * Note: household_id is resolved server-side from authentication.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export const groceryKeys = {
  all: ['grocery'] as const,
  list: (options?: { start_date?: string; end_date?: string; days?: number }) =>
    [...groceryKeys.all, options] as const,
  storeOrder: (storeId: string) =>
    [...groceryKeys.all, 'storeOrder', storeId] as const,
};

interface GroceryListOptions {
  start_date?: string;
  end_date?: string;
  days?: number;
}

/**
 * Hook to fetch the grocery list for the current household's meal plan.
 */
export const useGroceryList = (options?: GroceryListOptions) => {
  return useQuery({
    queryKey: groceryKeys.list(options),
    queryFn: () => api.getGroceryList(options),
  });
};

/**
 * Hook to fetch the learned store order for a specific store.
 * Returns an empty item_order when no store is selected or no order exists.
 */
export const useStoreOrder = (storeId: string | null) => {
  return useQuery({
    queryKey: groceryKeys.storeOrder(storeId ?? ''),
    queryFn: () => api.getStoreOrder(storeId!),
    enabled: !!storeId,
  });
};
