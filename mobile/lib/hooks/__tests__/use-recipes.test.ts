/**
 * Tests for recipe hooks — verifies enabled guards and cache management.
 *
 * Real logic tested:
 * - useRecipe: enabled guard (doesn't fetch when id is undefined)
 * - useRecipes: basic fetch behavior
 * - useUpdateRecipe: calls updateRecipe mutation
 * - useDeleteRecipe: removes queries from cache on success
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper, createTestQueryClient, mockRecipe } from '@/test/helpers';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api', () => ({
  api: {
    getRecipes: vi.fn(),
    getRecipe: vi.fn(),
    createRecipe: vi.fn(),
    scrapeRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  },
}));

vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    settings: { showHiddenRecipes: false },
  })),
}));

// Import AFTER mock setup
import { api } from '@/lib/api';
import {
  useRecipes,
  useRecipe,
  useAllRecipes,
  useCreateRecipe,
  useScrapeRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
} from '@/lib/hooks/use-recipes';

// Cast for easy access
const mockApi = vi.mocked(api);

describe('useRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getRecipes.mockResolvedValue({
      items: [
        mockRecipe({ id: '1', title: 'Pasta' }),
        mockRecipe({ id: '2', title: 'Soup' }),
      ],
      total_count: 2,
      next_cursor: null,
      has_more: false,
    });
  });

  it('fetches the recipe list using infinite query', async () => {
    const { result } = renderHook(() => useRecipes(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getRecipes).toHaveBeenCalledTimes(1);
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].items).toHaveLength(2);
  });

  it('exposes total_count from first page', async () => {
    mockApi.getRecipes.mockResolvedValue({
      items: [mockRecipe({ id: '1', title: 'Pasta' })],
      total_count: 75,
      next_cursor: 'abc',
      has_more: true,
    });

    const { result } = renderHook(() => useRecipes(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].total_count).toBe(75);
    expect(result.current.hasNextPage).toBe(true);
  });
});

describe('useRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getRecipe.mockResolvedValue(mockRecipe({ id: 'abc', title: 'Pasta' }));
  });

  it('fetches a recipe when id is provided', async () => {
    const { result } = renderHook(() => useRecipe('abc'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getRecipe).toHaveBeenCalledWith('abc');
  });

  it('does NOT fetch when id is undefined', async () => {
    const { result } = renderHook(() => useRecipe(undefined as unknown as string), {
      wrapper: createQueryWrapper(),
    });

    // Should remain idle — never call the API
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockApi.getRecipe).not.toHaveBeenCalled();
  });

  it('does NOT fetch when id is empty string', async () => {
    const { result } = renderHook(() => useRecipe(''), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockApi.getRecipe).not.toHaveBeenCalled();
  });
});

describe('useUpdateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateRecipe with id and updates', async () => {
    const updatedRecipe = mockRecipe({ id: 'abc', title: 'Updated Pasta' });
    mockApi.updateRecipe.mockResolvedValue(updatedRecipe);

    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'abc',
        updates: { title: 'Updated Pasta' },
      });
    });

    expect(mockApi.updateRecipe).toHaveBeenCalledWith('abc', {
      title: 'Updated Pasta',
    });
  });
});

describe('useDeleteRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes recipe from cache on success', async () => {
    mockApi.deleteRecipe.mockResolvedValue(undefined);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['recipes', 'detail', 'abc'], mockRecipe({
      id: 'abc',
      title: 'Pasta',
    }));
    queryClient.setQueryData(['recipes', 'list'], [mockRecipe({ id: 'abc', title: 'Pasta' })]);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteRecipe(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('abc');
    });

    // Recipe-specific cache should be removed
    const cached = queryClient.getQueryData(['recipes', 'detail', 'abc']);
    expect(cached).toBeUndefined();
  });
});

describe('useCreateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.createRecipe.mockResolvedValue(mockRecipe({
      id: 'new-1',
      title: 'New Recipe',
    }));
  });

  it('creates a recipe and calls the API', async () => {
    const { result } = renderHook(() => useCreateRecipe(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'New Recipe',
        ingredients: ['flour', 'water'],
        instructions: ['Mix'],
      } as any);
    });

    expect(mockApi.createRecipe).toHaveBeenCalledTimes(1);
  });
});

describe('useScrapeRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.scrapeRecipe.mockResolvedValue(mockRecipe({
      id: 'scraped-1',
      title: 'Scraped Recipe',
    }));
  });

  it('scrapes a recipe from URL', async () => {
    const { result } = renderHook(() => useScrapeRecipe(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ url: 'https://example.com/recipe' });
    });

    expect(mockApi.scrapeRecipe).toHaveBeenCalledWith(
      'https://example.com/recipe',
      false,
      undefined,
      undefined,
    );
  });

  it('passes enhance flag through', async () => {
    const { result } = renderHook(() => useScrapeRecipe(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        url: 'https://example.com/recipe',
        enhance: true,
      });
    });

    expect(mockApi.scrapeRecipe).toHaveBeenCalledWith(
      'https://example.com/recipe',
      true,
      undefined,
      undefined,
    );
  });
});

describe('useAllRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flattens pages into a single recipes array', async () => {
    mockApi.getRecipes.mockResolvedValueOnce({
      items: [mockRecipe({ id: '1', title: 'Pasta' })],
      total_count: 2,
      next_cursor: 'cursor1',
      has_more: true,
    });
    mockApi.getRecipes.mockResolvedValueOnce({
      items: [mockRecipe({ id: '2', title: 'Soup' })],
      total_count: 2,
      next_cursor: null,
      has_more: false,
    });

    const { result } = renderHook(() => useAllRecipes(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.recipes).toHaveLength(2));
    expect(result.current.recipes[0].id).toBe('1');
    expect(result.current.recipes[1].id).toBe('2');
    expect(result.current.totalCount).toBe(2);
  });

  it('auto-fetches next page when has_more is true', async () => {
    mockApi.getRecipes.mockResolvedValueOnce({
      items: [mockRecipe({ id: '1', title: 'A' })],
      total_count: 2,
      next_cursor: 'c1',
      has_more: true,
    });
    mockApi.getRecipes.mockResolvedValueOnce({
      items: [mockRecipe({ id: '2', title: 'B' })],
      total_count: 2,
      next_cursor: null,
      has_more: false,
    });

    const { result } = renderHook(() => useAllRecipes(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(mockApi.getRecipes).toHaveBeenCalledTimes(2));
    expect(result.current.recipes).toHaveLength(2);
  });

  it('returns empty array when no data', () => {
    mockApi.getRecipes.mockResolvedValue({
      items: [],
      total_count: 0,
      next_cursor: null,
      has_more: false,
    });

    const { result } = renderHook(() => useAllRecipes(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.recipes).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });
});
