/**
 * React Query provider with AsyncStorage persistence for offline support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';

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
// Only persist smaller queries to avoid quota issues
const MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit

export async function persistQueryCache(): Promise<void> {
  const cache = queryClient.getQueryCache().getAll();
  const data = cache
    .filter((query) => query.state.data !== undefined)
    // Skip large data like full recipe lists - only cache smaller queries
    .filter((query) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) {
        return true;
      }

      const [resource, type] = key as unknown[];

      // Skip recipes list (can be large) but allow individual recipe details
      if (resource === 'recipes' && type === 'list') {
        return false;
      }

      return true;
    })
    .map((query) => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));

  try {
    const serialized = JSON.stringify(data);
    const byteLength = new TextEncoder().encode(serialized).length;
    // Only persist if under size limit
    if (byteLength < MAX_CACHE_SIZE_BYTES) {
      await AsyncStorage.setItem(CACHE_KEY, serialized);
    } else {
      console.warn('Query cache not persisted: size exceeds limit', {
        byteLength,
        maxCacheSizeBytes: MAX_CACHE_SIZE_BYTES,
      });
    }
  } catch (error) {
    // Quota exceeded or other storage error - clear cache and continue
    console.warn('Failed to persist query cache:', error);
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function restoreQueryCache(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      data.forEach(
        (item: {
          queryKey: unknown[];
          data: unknown;
          dataUpdatedAt?: number;
        }) => {
          queryClient.setQueryData(item.queryKey, item.data, {
            updatedAt: item.dataUpdatedAt,
          });
        },
      );
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { queryClient };
