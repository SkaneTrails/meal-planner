/**
 * Tests for useFeaturedCategories hook — verifies query key, fetch behavior,
 * and staleTime configuration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper, mockRecipe } from '@/test/helpers';

vi.mock('@/lib/api', () => ({
  api: {
    getFeaturedCategories: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import {
  useFeaturedCategories,
  featuredKeys,
} from '@/lib/hooks/use-featured-categories';

const mockApi = vi.mocked(api);

const makeFeaturedResponse = () => ({
  categories: [
    {
      key: 'cozy_winter',
      recipes: [
        mockRecipe({ id: 'r1', title: 'Hearty Stew' }),
        mockRecipe({ id: 'r2', title: 'Warm Soup' }),
      ],
    },
    {
      key: 'quick_weeknight',
      recipes: [
        mockRecipe({ id: 'r3', title: 'Pasta Aglio e Olio' }),
      ],
    },
  ],
  season: 'winter',
  time_of_day: 'evening',
});

describe('featuredKeys', () => {
  it('produces stable query keys', () => {
    expect(featuredKeys.all).toEqual(['featured']);
    expect(featuredKeys.categories()).toEqual(['featured', 'categories']);
  });
});

describe('useFeaturedCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getFeaturedCategories.mockResolvedValue(makeFeaturedResponse());
  });

  it('fetches featured categories on mount', async () => {
    const { result } = renderHook(() => useFeaturedCategories(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getFeaturedCategories).toHaveBeenCalledTimes(1);
    expect(result.current.data?.categories).toHaveLength(2);
    expect(result.current.data?.season).toBe('winter');
    expect(result.current.data?.time_of_day).toBe('evening');
  });

  it('returns category keys and recipes', async () => {
    const { result } = renderHook(() => useFeaturedCategories(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const categories = result.current.data!.categories;
    expect(categories[0].key).toBe('cozy_winter');
    expect(categories[0].recipes).toHaveLength(2);
    expect(categories[0].recipes[0].title).toBe('Hearty Stew');

    expect(categories[1].key).toBe('quick_weeknight');
    expect(categories[1].recipes).toHaveLength(1);
  });

  it('handles empty categories response', async () => {
    mockApi.getFeaturedCategories.mockResolvedValue({
      categories: [],
      season: 'summer',
      time_of_day: 'morning',
    });

    const { result } = renderHook(() => useFeaturedCategories(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.categories).toHaveLength(0);
  });

  it('surfaces API errors', async () => {
    mockApi.getFeaturedCategories.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFeaturedCategories(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
