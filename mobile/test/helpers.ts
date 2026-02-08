/**
 * Shared test utilities for mobile tests.
 * Provides helpers for wrapping components with React Query, mocking hooks, etc.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CurrentUser, UserRole } from '@/lib/types';

/**
 * Create a fresh QueryClient for testing (no retries, no cache).
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
