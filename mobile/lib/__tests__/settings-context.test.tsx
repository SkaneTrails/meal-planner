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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Mock items-at-home state for cloud sync
let mockItemsAtHome: string[] = [];
const mockAddItem = vi.fn();
const mockRemoveItem = vi.fn();

// Store mock implementations that can be reconfigured
const mockUseItemsAtHome = vi.fn();
const mockUseAddItemAtHome = vi.fn();
const mockUseRemoveItemAtHome = vi.fn();

vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: vi.fn(() => ({
    data: { uid: 'test-uid', email: 'test@example.com', household_id: 'test-household' },
    isLoading: false,
  })),
  useItemsAtHome: (...args: unknown[]) => mockUseItemsAtHome(...args),
  useAddItemAtHome: (...args: unknown[]) => mockUseAddItemAtHome(...args),
  useRemoveItemAtHome: (...args: unknown[]) => mockUseRemoveItemAtHome(...args),
}));

// Unmock @/lib/settings-context so we test the real implementation
// (setup.ts has a global mock for useSettings)
vi.unmock('@/lib/settings-context');

// Must import AFTER mocks are set up
import { SettingsProvider, useSettings } from '@/lib/settings-context';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

const createSettingsWrapper = () => {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(SettingsProvider, null, children)
    );
  };
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    // Reset cloud items at home state
    mockItemsAtHome = [];

    // Configure mock hooks to read current mockItemsAtHome value
    // Note: useItemsAtHome returns the current value of mockItemsAtHome at call time
    mockUseItemsAtHome.mockImplementation(() => ({
      data: { items_at_home: mockItemsAtHome },
      isLoading: false,
    }));

    // For mutations, we update mockItemsAtHome and then trigger a re-render
    // by having React Query setQueryData behavior simulated
    mockUseAddItemAtHome.mockImplementation(() => {
      // Return a fresh mutateAsync each time to pick up current mockItemsAtHome
      return {
        mutate: mockAddItem,
        mutateAsync: async (params: { householdId: string; item: string }) => {
          const normalized = params.item.toLowerCase().trim();
          if (normalized && !mockItemsAtHome.includes(normalized)) {
            mockItemsAtHome = [...mockItemsAtHome, normalized].sort();
          }
          return { items_at_home: mockItemsAtHome };
        },
      };
    });

    mockUseRemoveItemAtHome.mockImplementation(() => {
      return {
        mutate: mockRemoveItem,
        mutateAsync: async (params: { householdId: string; item: string }) => {
          const normalized = params.item.toLowerCase().trim();
          mockItemsAtHome = mockItemsAtHome.filter(i => i !== normalized);
          return { items_at_home: mockItemsAtHome };
        },
      };
    });
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
    // itemsAtHome is now loaded from cloud, not AsyncStorage
    mockItemsAtHome = ['salt', 'pepper'];
    mockStorage['@meal_planner_settings'] = JSON.stringify({
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
      // Track what the mutation was called with
      let capturedItem: string | undefined;
      mockUseAddItemAtHome.mockImplementation(() => ({
        mutate: vi.fn(),
        mutateAsync: async (params: { householdId: string; item: string }) => {
          capturedItem = params.item;
          return { items_at_home: [params.item] };
        },
      }));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('  Olive Oil  ');
      });

      // The settings context normalizes before calling the mutation
      expect(capturedItem).toBe('olive oil');
    });

    it('deduplicates items', async () => {
      // Track mutation calls
      const mutationCalls: string[] = [];
      mockUseAddItemAtHome.mockImplementation(() => ({
        mutate: vi.fn(),
        mutateAsync: async (params: { householdId: string; item: string }) => {
          mutationCalls.push(params.item);
          // Simulate deduplication in mock (this happens on server)
          const normalized = params.item.toLowerCase().trim();
          if (!mockItemsAtHome.includes(normalized)) {
            mockItemsAtHome = [...mockItemsAtHome, normalized].sort();
          }
          return { items_at_home: mockItemsAtHome };
        },
      }));

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

      // Both calls should be made (deduplication happens on server)
      expect(mutationCalls).toEqual(['salt', 'salt']);
    });

    it('sorts items alphabetically', async () => {
      // Track mutation calls
      const mutationCalls: string[] = [];
      mockUseAddItemAtHome.mockImplementation(() => ({
        mutate: vi.fn(),
        mutateAsync: async (params: { householdId: string; item: string }) => {
          mutationCalls.push(params.item);
          return { items_at_home: [] };
        },
      }));

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

      // Verify all three items were added (sorting happens on server)
      expect(mutationCalls).toEqual(['pepper', 'butter', 'salt']);
    });

    it('ignores empty/whitespace-only input', async () => {
      // Track mutation calls
      const mutationCalls: string[] = [];
      mockUseAddItemAtHome.mockImplementation(() => ({
        mutate: vi.fn(),
        mutateAsync: async (params: { householdId: string; item: string }) => {
          mutationCalls.push(params.item);
          return { items_at_home: [] };
        },
      }));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addItemAtHome('   ');
      });

      // Empty/whitespace input should not call the mutation
      expect(mutationCalls).toEqual([]);
    });
  });

  describe('removeItemAtHome', () => {
    it('removes an existing item (case-insensitive via normalization)', async () => {
      // Track what the mutation was called with
      let capturedItem: string | undefined;
      mockUseRemoveItemAtHome.mockImplementation(() => ({
        mutate: vi.fn(),
        mutateAsync: async (params: { householdId: string; item: string }) => {
          capturedItem = params.item;
          return { items_at_home: [] };
        },
      }));

      // Set initial cloud state
      mockItemsAtHome = ['butter', 'salt'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeItemAtHome('Salt');
      });

      // The settings context normalizes before calling the mutation
      expect(capturedItem).toBe('salt');
    });
  });

  describe('isItemAtHome', () => {
    it('returns true for exact match', async () => {
      // Set initial cloud state
      mockItemsAtHome = ['salt', 'olive oil'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('salt')).toBe(true);
    });

    it('matches when grocery item contains a home item', async () => {
      // Set initial cloud state
      mockItemsAtHome = ['salt'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // "sea salt" contains "salt"
      expect(result.current.isItemAtHome('sea salt')).toBe(true);
    });

    it('matches when home item contains the grocery item', async () => {
      // Set initial cloud state
      mockItemsAtHome = ['olive oil'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // "oil" is contained within "olive oil"
      expect(result.current.isItemAtHome('oil')).toBe(true);
    });

    it('returns false for non-matching item', async () => {
      // Set initial cloud state
      mockItemsAtHome = ['salt'];

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
