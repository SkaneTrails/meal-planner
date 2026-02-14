/**
 * React Query provider with AsyncStorage persistence for offline support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const CACHE_KEY = 'meal-planner-query-cache';

export async function persistQueryCache(): Promise<void> {
  const cache = queryClient.getQueryCache().getAll();
  const data = cache
    .filter((query) => query.state.data !== undefined)
    .filter((query) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) {
        return true;
      }

      const resource = key[0];
      const type = key[1];

      if (resource === 'recipes' && type === 'list') {
        return false;
      }

      if (resource === 'admin' && type === 'currentUser') {
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
    // Let AsyncStorage handle quota - catch will handle QuotaExceededError
    await AsyncStorage.setItem(CACHE_KEY, serialized);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'UnknownError';

    console.warn('Failed to persist query cache', {
      name,
      message,
    });

    const isQuotaOrStorageError = /quota|storage|capacity/i.test(message);

    if (isQuotaOrStorageError) {
      try {
        await AsyncStorage.removeItem(CACHE_KEY);
      } catch (cleanupError) {
        console.warn('Failed to clear persisted query cache after error', {
          error: cleanupError,
        });
      }
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

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { queryClient };
