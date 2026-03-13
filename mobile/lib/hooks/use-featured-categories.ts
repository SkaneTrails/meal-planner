/**
 * React Query hook for fetching featured recipe categories.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { FeaturedCategoriesResponse } from '../types';

export const featuredKeys = {
  all: ['featured'] as const,
  categories: () => [...featuredKeys.all, 'categories'] as const,
};

/**
 * Hook to fetch featured recipe categories from the API.
 * Categories change based on season and time of day, so we refetch
 * on mount but allow stale data for 5 minutes.
 */
export const useFeaturedCategories = () => {
  return useQuery<FeaturedCategoriesResponse>({
    queryKey: featuredKeys.categories(),
    queryFn: () => api.getFeaturedCategories(),
    staleTime: 5 * 60 * 1000,
  });
};
