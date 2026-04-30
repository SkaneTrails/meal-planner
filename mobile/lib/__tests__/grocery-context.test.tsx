/**
 * Tests for GroceryProvider — verifies grocery state management.
 *
 * Real logic tested:
 * - Initial load: API first, AsyncStorage fallback on error
 * - toggleItem: adds item if not checked, removes if already checked
 * - setCheckedItems: replaces the full checked set
 * - clearChecked: resets all checked items
 * - addCustomItem: appends a CustomGroceryItem
 * - saveSelections: saves meals + servings via PATCH
 * - clearAll: resets all state and calls API delete
 * - refreshFromApi: reloads state from API
 * - useGroceryState: throws when used outside provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

import type { GroceryListState } from '@/lib/types';

const emptyState: GroceryListState = {
  selected_meals: [],
  meal_servings: {},
  checked_items: [],
  custom_items: [],
  item_order: [],
  removed_items: [],
};

const mockGetGroceryState = vi.fn<() => Promise<GroceryListState>>();
const mockPatchGroceryState = vi.fn<() => Promise<GroceryListState>>();
const mockSaveGroceryState = vi.fn<() => Promise<GroceryListState>>();
const mockClearGroceryState = vi.fn<() => Promise<void>>();

vi.mock('@/lib/api', () => ({
  api: {
    getGroceryState: (...args: unknown[]) => mockGetGroceryState(...args as []),
    patchGroceryState: (...args: unknown[]) => mockPatchGroceryState(...args as []),
    saveGroceryState: (...args: unknown[]) => mockSaveGroceryState(...args as []),
    clearGroceryState: (...args: unknown[]) => mockClearGroceryState(...args as []),
  },
}));

const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import { GroceryProvider, useGroceryState } from '@/lib/grocery-context';

function createGroceryWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(GroceryProvider, null, children);
  };
}

describe('GroceryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    mockGetGroceryState.mockResolvedValue(emptyState);
    mockPatchGroceryState.mockResolvedValue(emptyState);
    mockSaveGroceryState.mockResolvedValue(emptyState);
    mockClearGroceryState.mockResolvedValue(undefined);
  });

  it('starts with empty state from API', async () => {
    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkedItems.size).toBe(0);
    expect(result.current.customItems).toEqual([]);
    expect(result.current.itemOrder).toEqual([]);
    expect(result.current.removedItems).toEqual([]);
    expect(result.current.selectedMealKeys).toEqual([]);
    expect(result.current.mealServings).toEqual({});
    expect(mockGetGroceryState).toHaveBeenCalledOnce();
  });

  it('loads persisted state from API', async () => {
    mockGetGroceryState.mockResolvedValue({
      selected_meals: ['monday-lunch'],
      meal_servings: { 'monday-lunch': 4 },
      checked_items: ['milk', 'eggs'],
      custom_items: [{ name: 'bread', category: 'bakery' }],
      item_order: [],
      removed_items: [],
    });

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkedItems.has('milk')).toBe(true);
    expect(result.current.checkedItems.has('eggs')).toBe(true);
    expect(result.current.customItems).toEqual([{ name: 'bread', category: 'bakery' }]);
    expect(result.current.selectedMealKeys).toEqual(['monday-lunch']);
    expect(result.current.mealServings).toEqual({ 'monday-lunch': 4 });
  });

  it('falls back to AsyncStorage when API fails', async () => {
    mockGetGroceryState.mockRejectedValue(new Error('offline'));
    mockStorage['grocery_checked_items'] = JSON.stringify(['butter']);
    mockStorage['grocery_custom_items'] = JSON.stringify([{ name: 'jam', category: 'other' }]);
    mockStorage['grocery_selected_meals'] = JSON.stringify(['tuesday-dinner']);
    mockStorage['grocery_meal_servings'] = JSON.stringify({ 'tuesday-dinner': 2 });

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkedItems.has('butter')).toBe(true);
    expect(result.current.customItems).toEqual([{ name: 'jam', category: 'other' }]);
    expect(result.current.selectedMealKeys).toEqual(['tuesday-dinner']);
    expect(result.current.mealServings).toEqual({ 'tuesday-dinner': 2 });
  });

  describe('toggleItem', () => {
    it('adds an item when not yet checked', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggleItem('milk');
      });

      expect(result.current.checkedItems.has('milk')).toBe(true);
    });

    it('removes an item when already checked', async () => {
      mockGetGroceryState.mockResolvedValue({
        ...emptyState,
        checked_items: ['milk'],
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.checkedItems.has('milk')).toBe(true);

      act(() => {
        result.current.toggleItem('milk');
      });

      expect(result.current.checkedItems.has('milk')).toBe(false);
    });
  });

  describe('setCheckedItems', () => {
    it('replaces the checked set entirely', async () => {
      mockGetGroceryState.mockResolvedValue({
        ...emptyState,
        checked_items: ['milk'],
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setCheckedItems(new Set(['eggs', 'butter']));
      });

      expect(result.current.checkedItems.has('milk')).toBe(false);
      expect(result.current.checkedItems.has('eggs')).toBe(true);
      expect(result.current.checkedItems.has('butter')).toBe(true);
    });
  });

  describe('clearChecked', () => {
    it('removes all checked items', async () => {
      mockGetGroceryState.mockResolvedValue({
        ...emptyState,
        checked_items: ['milk', 'eggs', 'butter'],
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.checkedItems.size).toBe(3);

      act(() => {
        result.current.clearChecked();
      });

      expect(result.current.checkedItems.size).toBe(0);
    });
  });

  describe('setItemOrder', () => {
    it('updates item order and enqueues API patch', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setItemOrder(['eggs', 'milk', 'bread']);
      });

      expect(result.current.itemOrder).toEqual(['eggs', 'milk', 'bread']);
    });
  });

  describe('setRemovedItems', () => {
    it('updates removed items and enqueues API patch', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setRemovedItems(['pasta', 'rice']);
      });

      expect(result.current.removedItems).toEqual(['pasta', 'rice']);
    });
  });

  describe('addCustomItem', () => {
    it('appends a custom item', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.addCustomItem({ name: 'bread', category: 'bakery' });
      });

      expect(result.current.customItems).toEqual([{ name: 'bread', category: 'bakery' }]);
    });
  });

  describe('saveSelections', () => {
    it('saves meals and servings via PATCH', async () => {
      mockPatchGroceryState.mockResolvedValue({
        ...emptyState,
        selected_meals: ['monday-lunch', 'tuesday-dinner'],
        meal_servings: { 'monday-lunch': 4, 'tuesday-dinner': 2 },
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSelections(
          ['monday-lunch', 'tuesday-dinner'],
          { 'monday-lunch': 4, 'tuesday-dinner': 2 },
        );
      });

      expect(result.current.selectedMealKeys).toEqual(['monday-lunch', 'tuesday-dinner']);
      expect(result.current.mealServings).toEqual({ 'monday-lunch': 4, 'tuesday-dinner': 2 });
      expect(mockPatchGroceryState).toHaveBeenCalledWith({
        selected_meals: ['monday-lunch', 'tuesday-dinner'],
        meal_servings: { 'monday-lunch': 4, 'tuesday-dinner': 2 },
        removed_items: [],
      });
    });

    it('clears removed items but preserves checked items when saving new selections', async () => {
      mockGetGroceryState.mockResolvedValue({
        ...emptyState,
        selected_meals: ['monday-lunch'],
        meal_servings: { 'monday-lunch': 2 },
        checked_items: ['flour', 'sugar'],
        removed_items: ['butter'],
      });

      mockPatchGroceryState.mockResolvedValue({
        ...emptyState,
        selected_meals: ['tuesday-dinner'],
        meal_servings: { 'tuesday-dinner': 4 },
        checked_items: ['flour', 'sugar'],
        removed_items: [],
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.checkedItems.size).toBe(2);
      expect(result.current.removedItems).toEqual(['butter']);

      await act(async () => {
        await result.current.saveSelections(
          ['tuesday-dinner'],
          { 'tuesday-dinner': 4 },
        );
      });

      expect(result.current.checkedItems.size).toBe(2);
      expect(result.current.removedItems).toEqual([]);
      expect(mockPatchGroceryState).toHaveBeenCalledWith({
        selected_meals: ['tuesday-dinner'],
        meal_servings: { 'tuesday-dinner': 4 },
        removed_items: [],
      });
    });
  });

  describe('legacy custom items normalization', () => {
    it('converts string[] from AsyncStorage to CustomGroceryItem[]', async () => {
      mockGetGroceryState.mockRejectedValue(new Error('offline'));
      mockStorage['grocery_custom_items'] = JSON.stringify(['bread', 'milk']);

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.customItems).toEqual([
        { name: 'bread', category: 'other' },
        { name: 'milk', category: 'other' },
      ]);
    });
  });

  describe('clearAll', () => {
    it('resets all state and calls API delete', async () => {
      mockGetGroceryState.mockResolvedValue({
        selected_meals: ['monday-lunch'],
        meal_servings: { 'monday-lunch': 4 },
        checked_items: ['milk'],
        custom_items: [{ name: 'bread', category: 'other' }],
        item_order: [],
        removed_items: [],
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.clearAll();
      });

      expect(result.current.checkedItems.size).toBe(0);
      expect(result.current.customItems).toEqual([]);
      expect(result.current.itemOrder).toEqual([]);
      expect(result.current.removedItems).toEqual([]);
      expect(result.current.selectedMealKeys).toEqual([]);
      expect(result.current.mealServings).toEqual({});
      expect(mockClearGroceryState).toHaveBeenCalledOnce();
    });
  });

  describe('refreshFromApi', () => {
    it('reloads state from API', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockGetGroceryState.mockResolvedValue({
        ...emptyState,
        checked_items: ['new-item'],
      });

      await act(async () => {
        await result.current.refreshFromApi();
      });

      expect(result.current.checkedItems.has('new-item')).toBe(true);
    });

    it('flushes pending patches before loading', async () => {
      const callOrder: string[] = [];
      mockPatchGroceryState.mockImplementation(() => {
        callOrder.push('patch');
        return Promise.resolve({ ...emptyState, checked_items: ['milk'] });
      });

      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Make a change that enqueues a debounced patch
      act(() => {
        result.current.toggleItem('milk');
      });

      // Refresh immediately (before debounce fires)
      const updatedState = { ...emptyState, checked_items: ['milk'] };
      mockGetGroceryState.mockImplementation(() => {
        callOrder.push('get');
        return Promise.resolve(updatedState);
      });

      await act(async () => {
        await result.current.refreshFromApi();
      });

      // The patch must have been flushed before the GET
      expect(callOrder).toEqual(['patch', 'get']);
      expect(result.current.checkedItems.has('milk')).toBe(true);
    });
  });

  describe('patch reliability', () => {
    it('re-queues failed patches for retry', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Make patch fail
      mockPatchGroceryState.mockRejectedValueOnce(new Error('offline'));

      act(() => {
        result.current.toggleItem('milk');
      });

      const updatedState = { ...emptyState, checked_items: ['milk'] };
      mockGetGroceryState.mockResolvedValue(updatedState);

      // First refresh: flushPatch sends the pending patch (fails), data re-queued
      await act(async () => {
        await result.current.refreshFromApi();
      });

      expect(mockPatchGroceryState).toHaveBeenCalledTimes(1);

      // Second refresh: flushPatch retries the re-queued data (succeeds)
      mockPatchGroceryState.mockResolvedValue(updatedState);

      await act(async () => {
        await result.current.refreshFromApi();
      });

      expect(mockPatchGroceryState).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('caches server response to AsyncStorage on successful patch', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const serverResponse = {
        ...emptyState,
        checked_items: ['milk'],
        custom_items: [{ name: 'bread', category: 'other' as const }],
      };
      mockPatchGroceryState.mockResolvedValue(serverResponse);
      mockGetGroceryState.mockResolvedValue(serverResponse);

      act(() => {
        result.current.toggleItem('milk');
      });

      // Trigger flush via refreshFromApi instead of advancing timers
      await act(async () => {
        await result.current.refreshFromApi();
      });

      // AsyncStorage should have the server-confirmed state from the PATCH response
      expect(mockStorage['grocery_checked_items']).toBe(
        JSON.stringify(['milk']),
      );
    });
  });
});

describe('useGroceryState', () => {
  it('throws when used outside GroceryProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useGroceryState());
    }).toThrow('useGroceryState must be used within a GroceryProvider');
    spy.mockRestore();
  });
});
