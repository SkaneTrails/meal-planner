/**
 * Shared test utilities for mobile tests.
 * Provides helpers for wrapping components with React Query, mocking hooks, etc.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CurrentUser, UserRole, Recipe } from '@/lib/types';

/**
 * Create a fresh QueryClient for testing (no retries, instant cache GC).
 *
 * NOTE: `gcTime: 0` causes immediate garbage collection of cache entries
 * with no active observers. This is fine for query tests (renderHook creates
 * an observer), but breaks mutation tests that inspect cache via
 * `queryClient.getQueryData()` after `onSuccess` — the entry gets GC'd
 * before the assertion runs. For mutation cache tests, create a dedicated
 * QueryClient without `gcTime: 0`.
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Wrapper component that provides React Query context.
 */
export const createQueryWrapper = () => {
  const queryClient = createTestQueryClient();
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

/**
 * Build a mock CurrentUser for testing different roles.
 */
export const mockCurrentUser = (overrides: Partial<CurrentUser> = {}): CurrentUser => ({
  uid: 'test-uid-123',
  email: 'test@example.com',
  role: 'member' as UserRole,
  household_id: 'household-abc',
  household_name: 'Test Household',
  ...overrides,
});

/**
 * Build a mock Recipe for testing.
 */
export const mockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'recipe-1',
  title: 'Test Recipe',
  url: 'https://example.com/recipe',
  ingredients: ['ingredient 1', 'ingredient 2'],
  instructions: ['Step 1', 'Step 2'],
  image_url: null,
  thumbnail_url: null,
  servings: 4,
  prep_time: 15,
  cook_time: 30,
  total_time: 45,
  cuisine: null,
  category: null,
  tags: [],
  diet_label: null,
  meal_label: null,
  rating: null,
  hidden: false,
  favorited: false,
  ...overrides,
});
