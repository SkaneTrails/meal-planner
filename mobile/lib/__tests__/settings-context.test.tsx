/**
 * Tests for SettingsProvider — verifies local settings state management.
 *
 * Real logic tested:
 * - addItemAtHome: normalizes to lowercase, trims whitespace, deduplicates, sorts alphabetically
 * - removeItemAtHome: normalizes before matching
 * - isItemAtHome: partial substring matching (both directions)
 * - setLanguage: persists language choice
 * - toggleFavorite: adds/removes recipe IDs
 * - isFavorite: checks membership
 * - useSettings: throws when used outside provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock AsyncStorage before importing the module under test
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

// Unmock @/lib/settings-context so we test the real implementation
// (setup.ts has a global mock for useSettings)
vi.unmock('@/lib/settings-context');

// Must import AFTER mocks are set up
import { SettingsProvider, useSettings } from '@/lib/settings-context';

function createSettingsWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(SettingsProvider, null, children);
  };
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  });

  it('starts with default settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.itemsAtHome).toEqual([]);
    expect(result.current.settings.language).toBe('en');
    expect(result.current.settings.favoriteRecipes).toEqual([]);
  });

  it('loads persisted settings from AsyncStorage', async () => {
    mockStorage['@meal_planner_settings'] = JSON.stringify({
      itemsAtHome: ['salt', 'pepper'],
      language: 'sv',
      favoriteRecipes: ['recipe-1'],
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.itemsAtHome).toEqual(['salt', 'pepper']);
    expect(result.current.settings.language).toBe('sv');
    expect(result.current.settings.favoriteRecipes).toEqual(['recipe-1']);
  });

  it('merges partial persisted settings with defaults', async () => {
    // Only language was saved — other fields should get defaults
    mockStorage['@meal_planner_settings'] = JSON.stringify({ language: 'it' });

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.language).toBe('it');
    expect(result.current.settings.itemsAtHome).toEqual([]);
    expect(result.current.settings.favoriteRecipes).toEqual([]);
  });

  describe('addItemAtHome', () => {
    it('normalizes to lowercase and trims whitespace', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('  Olive Oil  ');
      });

      expect(result.current.settings.itemsAtHome).toContain('olive oil');
    });

    it('deduplicates items', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('salt');
      });
      await act(async () => {
        await result.current.addItemAtHome('Salt');
      });

      const count = result.current.settings.itemsAtHome.filter(
        (i) => i === 'salt',
      ).length;
      expect(count).toBe(1);
    });

    it('sorts items alphabetically', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('pepper');
      });
      await act(async () => {
        await result.current.addItemAtHome('butter');
      });
      await act(async () => {
        await result.current.addItemAtHome('salt');
      });

      expect(result.current.settings.itemsAtHome).toEqual([
        'butter',
        'pepper',
        'salt',
      ]);
    });

    it('ignores empty/whitespace-only input', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('   ');
      });

      expect(result.current.settings.itemsAtHome).toEqual([]);
    });
  });

  describe('removeItemAtHome', () => {
    it('removes an existing item (case-insensitive via normalization)', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        itemsAtHome: ['butter', 'salt'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeItemAtHome('Salt');
      });

      expect(result.current.settings.itemsAtHome).toEqual(['butter']);
    });
  });

  describe('isItemAtHome', () => {
    it('returns true for exact match', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        itemsAtHome: ['salt', 'olive oil'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('salt')).toBe(true);
    });

    it('matches when grocery item contains a home item', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        itemsAtHome: ['salt'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // "sea salt" contains "salt"
      expect(result.current.isItemAtHome('sea salt')).toBe(true);
    });

    it('matches when home item contains the grocery item', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        itemsAtHome: ['olive oil'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // "oil" is contained within "olive oil"
      expect(result.current.isItemAtHome('oil')).toBe(true);
    });

    it('returns false for non-matching item', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        itemsAtHome: ['salt'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('chicken')).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('updates the language setting', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setLanguage('it');
      });

      expect(result.current.settings.language).toBe('it');
    });
  });

  describe('toggleFavorite', () => {
    it('adds a recipe to favorites', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('recipe-abc');
      });

      expect(result.current.isFavorite('recipe-abc')).toBe(true);
    });

    it('removes a recipe from favorites when toggled again', async () => {
      mockStorage['@meal_planner_settings'] = JSON.stringify({
        favoriteRecipes: ['recipe-abc'],
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isFavorite('recipe-abc')).toBe(true);

      await act(async () => {
        await result.current.toggleFavorite('recipe-abc');
      });

      expect(result.current.isFavorite('recipe-abc')).toBe(false);
    });
  });
});

describe('useSettings', () => {
  it('throws when used outside SettingsProvider', () => {
    // renderHook catches the error at React boundary level, so we check via error result
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // In React 19 + testing library, throwing in render is captured differently
    let hookError: Error | undefined;
    try {
      renderHook(() => {
        try {
          return useSettings();
        } catch (e) {
          hookError = e as Error;
          throw e;
        }
      });
    } catch {
      // Expected — React error boundary
    }

    expect(hookError?.message).toContain(
      'useSettings must be used within a SettingsProvider',
    );
    spy.mockRestore();
  });
});
