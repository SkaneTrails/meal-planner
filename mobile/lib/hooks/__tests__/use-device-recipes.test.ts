/**
 * Tests for the device-backed recipe hooks (native).
 *
 * Real logic tested:
 * - The full list comes from the device copy with the recipe list rules applied
 * - The hidden setting filters locally, without a new download
 * - The library searches the whole copy, as one page with nothing more to load
 * - The recipe page opens straight from the copy
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, mockRecipe } from '@/test/helpers';

vi.mock('@/lib/api', () => ({ api: { getRecipe: vi.fn() } }));

const mockSettings = { showHiddenRecipes: false };
vi.mock('@/lib/settings-context', () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: () => ({ data: { role: 'member', household_id: 'hh1' } }),
}));

vi.mock('@/lib/recipes/recipe-sync', () => ({ syncRecipes: vi.fn() }));

import { api } from '@/lib/api';
import {
  recipeKeys,
  useAllRecipesFromDevice,
  useRecipe,
  useRecipesFromDevice,
} from '@/lib/hooks/use-recipes';
import { syncRecipes } from '@/lib/recipes/recipe-sync';

const copy = [
  mockRecipe({ id: 'soup', title: 'Tomato soup', url: 'u-soup', created_at: '2026-02-01T00:00:00Z' }),
  mockRecipe({ id: 'stew', title: 'Stew', url: 'u-stew', created_at: '2026-01-01T00:00:00Z' }),
  mockRecipe({ id: 'meh', title: 'Meh', url: 'u-meh', hidden: true }),
];

const wrapperFor = (client = createTestQueryClient()) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };

describe('device recipe hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings.showHiddenRecipes = false;
    vi.mocked(syncRecipes).mockResolvedValue(copy);
  });

  it('lists every visible recipe from the device copy, newest first', async () => {
    const { result } = renderHook(() => useAllRecipesFromDevice(), { wrapper: wrapperFor() });

    await waitFor(() => expect(result.current.recipes.map((r) => r.id)).toEqual(['soup', 'stew']));
    expect(result.current.totalCount).toBe(2);
  });

  it('shows hidden recipes when the setting says so, without downloading again', async () => {
    mockSettings.showHiddenRecipes = true;

    const { result } = renderHook(() => useAllRecipesFromDevice(), { wrapper: wrapperFor() });

    await waitFor(() => expect(result.current.recipes.map((r) => r.id)).toContain('meh'));
    expect(syncRecipes).toHaveBeenCalledOnce();
  });

  it('searches the whole library as one page with nothing more to load', async () => {
    const { result } = renderHook(() => useRecipesFromDevice('tomato'), { wrapper: wrapperFor() });

    await waitFor(() =>
      expect(result.current.data.pages[0].items.map((r) => r.id)).toEqual(['soup']),
    );
    expect(result.current.data.pages[0].total_count).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('opens a recipe straight from the device copy', () => {
    const client = createTestQueryClient();
    // As in the app: recipe queries are refreshed by the sync poll, not by age.
    client.setQueryDefaults(['recipes'], { staleTime: Number.POSITIVE_INFINITY });
    client.setQueryData(recipeKeys.local(), copy);

    const { result } = renderHook(() => useRecipe('stew'), { wrapper: wrapperFor(client) });

    expect(result.current.data?.title).toBe('Stew');
    expect(api.getRecipe).not.toHaveBeenCalled();
  });
});
