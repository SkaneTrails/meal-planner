/**
 * React Query hooks for grocery lists.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

// Default user ID until auth is implemented
const DEFAULT_USER_ID = 'default';

// Query keys
export const groceryKeys = {
  all: ['grocery'] as const,
  list: (
    userId: string,
    options?: { start_date?: string; end_date?: string; days?: number }
  ) => [...groceryKeys.all, userId, options] as const,
};

interface GroceryListOptions {
  start_date?: string;
  end_date?: string;
  days?: number;
}

/**
 * Hook to fetch the grocery list for a user's meal plan.
 */
export function useGroceryList(
  userId: string = DEFAULT_USER_ID,
  options?: GroceryListOptions
) {
  return useQuery({
    queryKey: groceryKeys.list(userId, options),
    queryFn: () => api.getGroceryList(userId, options),
  });
}
