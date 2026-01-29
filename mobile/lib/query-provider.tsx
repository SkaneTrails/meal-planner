/**
 * React Query provider with AsyncStorage persistence for offline support.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client with offline-friendly defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus (web) or app foreground (mobile)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Persist query cache to AsyncStorage
const CACHE_KEY = 'meal-planner-query-cache';

export async function persistQueryCache(): Promise<void> {
  const cache = queryClient.getQueryCache().getAll();
  const data = cache
    .filter((query) => query.state.data !== undefined)
    .map((query) => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export async function restoreQueryCache(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      data.forEach((item: { queryKey: unknown[]; data: unknown; dataUpdatedAt?: number }) => {
        queryClient.setQueryData(item.queryKey, item.data, {
          updatedAt: item.dataUpdatedAt,
        });
      });
    }
  } catch (error) {
    console.warn('Failed to restore query cache:', error);
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
