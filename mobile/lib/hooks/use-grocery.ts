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
}
