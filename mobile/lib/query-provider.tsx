/**
 * React Query provider with the cache saved on the device, so screens draw from the last
 * known data at startup and refresh in the background. The sync status poll decides when
 * synced data is refetched (see lib/sync).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  defaultShouldDehydrateQuery,
  type Query,
  QueryClient,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type React from 'react';

export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const CACHE_KEY = 'meal-planner-query-cache-v2';
const LEGACY_CACHE_KEY = 'meal-planner-query-cache';

/** Refetched only when the sync status poll reports a change (or after own mutations). */
const SYNCED_QUERY_PREFIXES: readonly (readonly string[])[] = [
  ['recipes'],
  ['meal-plans'],
  ['admin', 'settings'],
  ['admin', 'itemsAtHome'],
  ['admin', 'favorites'],
];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: PERSIST_MAX_AGE,
      retry: 3,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
    },
  },
});

for (const prefix of SYNCED_QUERY_PREFIXES) {
  queryClient.setQueryDefaults(prefix, {
    staleTime: Number.POSITIVE_INFINITY,
  });
}

const PII_FIELDS = ['created_by'] as const;

export function stripPii(
  data: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  const value = data as object;
  if (seen.has(value)) {
    return undefined;
  }
  seen.add(value);
  if (Array.isArray(data)) {
    return data.map((item) => stripPii(item, seen));
  }
  const obj = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if ((PII_FIELDS as readonly string[]).includes(key)) {
      continue;
    }
    result[key] = stripPii(obj[key], seen);
  }
  return result;
}

/**
 * Paged search results are short-lived, and the native recipe copy has its own file store
 * (too big for AsyncStorage); everything else is kept for a fast next start.
 */
export function shouldPersistQuery(query: Query): boolean {
  if (!defaultShouldDehydrateQuery(query)) return false;
  const [resource, type] = query.queryKey;
  return !(resource === 'recipes' && (type === 'list' || type === 'local'));
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  throttleTime: 2000,
  serialize: (client) => JSON.stringify(stripPii(client)),
});

AsyncStorage.removeItem(LEGACY_CACHE_KEY).catch(() => {});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
