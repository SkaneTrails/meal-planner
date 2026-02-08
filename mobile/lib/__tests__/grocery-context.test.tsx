/**
 * Tests for GroceryProvider — verifies grocery state management.
 *
 * Real logic tested:
 * - toggleItem: adds item if not checked, removes if already checked
 * - setCheckedItems: replaces the full checked set
 * - clearChecked: resets all checked items
 * - loadFromStorage: handles both old format (strings) and new format ({ name } objects)
 * - useGroceryState: throws when used outside provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock AsyncStorage
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

const createGroceryWrapper = () => {
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
  });

  it('starts with empty state', async () => {
    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkedItems.size).toBe(0);
    expect(result.current.customItems).toEqual([]);
    expect(result.current.selectedMealKeys).toEqual([]);
  });

  it('loads persisted checked items from storage', async () => {
    mockStorage['grocery_checked_items'] = JSON.stringify(['milk', 'eggs']);

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.checkedItems.has('milk')).toBe(true);
    expect(result.current.checkedItems.has('eggs')).toBe(true);
  });

  it('loads custom items in old string format', async () => {
    mockStorage['grocery_custom_items'] = JSON.stringify(['bread', 'cheese']);

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.customItems).toEqual(['bread', 'cheese']);
  });

  it('loads custom items in new object format', async () => {
    mockStorage['grocery_custom_items'] = JSON.stringify([
      { name: 'bread' },
      { name: 'cheese' },
    ]);

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.customItems).toEqual(['bread', 'cheese']);
  });

  it('loads selected meal keys from storage', async () => {
    mockStorage['grocery_selected_meals'] = JSON.stringify([
      'monday-lunch',
      'tuesday-dinner',
    ]);

    const { result } = renderHook(() => useGroceryState(), {
      wrapper: createGroceryWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.selectedMealKeys).toEqual([
      'monday-lunch',
      'tuesday-dinner',
    ]);
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
      mockStorage['grocery_checked_items'] = JSON.stringify(['milk']);

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
      mockStorage['grocery_checked_items'] = JSON.stringify(['milk']);

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
      mockStorage['grocery_checked_items'] = JSON.stringify([
        'milk',
        'eggs',
        'butter',
      ]);

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

  describe('refreshFromStorage', () => {
    it('reloads state from AsyncStorage', async () => {
      const { result } = renderHook(() => useGroceryState(), {
        wrapper: createGroceryWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.checkedItems.size).toBe(0);

      // Simulate external storage change
      mockStorage['grocery_checked_items'] = JSON.stringify(['new-item']);

      await act(async () => {
        await result.current.refreshFromStorage();
      });

      expect(result.current.checkedItems.has('new-item')).toBe(true);
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
