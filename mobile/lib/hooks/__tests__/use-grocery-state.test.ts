/**
 * Tests for grocery state hooks — verifies API delegation and
 * React Query cache updates for Firestore-backed grocery list state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createQueryWrapper } from '@/test/helpers';
import type { GroceryListState } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    getGroceryState: vi.fn(),
    saveGroceryState: vi.fn(),
    patchGroceryState: vi.fn(),
    clearGroceryState: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import {
  useGroceryListState,
  useSaveGroceryState,
  usePatchGroceryState,
  useClearGroceryState,
  groceryStateKeys,
} from '@/lib/hooks/use-grocery-state';

const mockApi = vi.mocked(api);

const mockState: GroceryListState = {
  selected_meals: ['mon_lunch'],
  meal_servings: { mon_lunch: 4 },
  checked_items: ['salt'],
  custom_items: [{ name: 'bread', category: 'other' }],
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user@test.com',
};

/**
 * Creates a QueryClient + wrapper and exposes both for cache inspection.
 * Uses a fresh client per call to avoid cross-test contamination.
 */
const createMutationWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
};

describe('useGroceryListState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches grocery state from the API', async () => {
    mockApi.getGroceryState.mockResolvedValue(mockState);

    const { result } = renderHook(() => useGroceryListState(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockState);
  });
});

describe('useSaveGroceryState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls saveGroceryState and updates cache', async () => {
    const saved = { ...mockState, updated_at: '2024-01-02T00:00:00Z' };
    mockApi.saveGroceryState.mockResolvedValue(saved);

    const { queryClient, wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useSaveGroceryState(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        selected_meals: mockState.selected_meals,
        meal_servings: mockState.meal_servings,
      });
    });

    expect(mockApi.saveGroceryState).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryData(groceryStateKeys.current()),
    ).toEqual(saved);
  });
});

describe('usePatchGroceryState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls patchGroceryState with partial update and updates cache', async () => {
    const patched = { ...mockState, checked_items: ['salt', 'pepper'] };
    mockApi.patchGroceryState.mockResolvedValue(patched);

    const { queryClient, wrapper } = createMutationWrapper();
    const { result } = renderHook(() => usePatchGroceryState(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        checked_items: ['salt', 'pepper'],
      });
    });

    expect(mockApi.patchGroceryState).toHaveBeenCalledWith({
      checked_items: ['salt', 'pepper'],
    });
    expect(
      queryClient.getQueryData(groceryStateKeys.current()),
    ).toEqual(patched);
  });
});

describe('useClearGroceryState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls clearGroceryState and resets cache to empty state', async () => {
    mockApi.clearGroceryState.mockResolvedValue(undefined);

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(groceryStateKeys.current(), mockState);

    const { result } = renderHook(() => useClearGroceryState(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockApi.clearGroceryState).toHaveBeenCalledTimes(1);
    const cached = queryClient.getQueryData(
      groceryStateKeys.current(),
    ) as GroceryListState;
    expect(cached.selected_meals).toEqual([]);
    expect(cached.checked_items).toEqual([]);
    expect(cached.custom_items).toEqual([]);
  });
});
