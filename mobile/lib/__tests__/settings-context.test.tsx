/**
 * Tests for SettingsProvider — verifies settings state management.
 *
 * Real logic tested:
 * - addItemAtHome: normalizes to lowercase, trims whitespace
 * - removeItemAtHome: normalizes before matching
 * - isItemAtHome: partial substring matching (both directions)
 * - setLanguage: writes to cloud via household settings
 * - toggleFavorite: adds/removes recipe IDs via cloud
 * - isFavorite: checks membership from cloud data
 * - toggleShowHiddenRecipes: persists locally
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

// Cloud state
let mockItemsAtHome: string[] = [];
let mockFavoriteRecipes: string[] = [];
let mockHouseholdLanguage = 'en';

// Store mock implementations that can be reconfigured
const mockUseCurrentUser = vi.fn();
const mockUseItemsAtHome = vi.fn();
const mockUseAddItemAtHome = vi.fn();
const mockUseRemoveItemAtHome = vi.fn();
const mockUseFavoriteRecipes = vi.fn();
const mockUseAddFavoriteRecipe = vi.fn();
const mockUseRemoveFavoriteRecipe = vi.fn();
const mockUseHouseholdSettings = vi.fn();
const mockUseUpdateHouseholdSettings = vi.fn();

vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: (...args: unknown[]) => mockUseCurrentUser(...args),
  useItemsAtHome: (...args: unknown[]) => mockUseItemsAtHome(...args),
  useAddItemAtHome: (...args: unknown[]) => mockUseAddItemAtHome(...args),
  useRemoveItemAtHome: (...args: unknown[]) => mockUseRemoveItemAtHome(...args),
  useFavoriteRecipes: (...args: unknown[]) => mockUseFavoriteRecipes(...args),
  useAddFavoriteRecipe: (...args: unknown[]) => mockUseAddFavoriteRecipe(...args),
  useRemoveFavoriteRecipe: (...args: unknown[]) => mockUseRemoveFavoriteRecipe(...args),
  useHouseholdSettings: (...args: unknown[]) => mockUseHouseholdSettings(...args),
  useUpdateHouseholdSettings: (...args: unknown[]) => mockUseUpdateHouseholdSettings(...args),
}));

// Unmock @/lib/settings-context so we test the real implementation
vi.unmock('@/lib/settings-context');

// Must import AFTER mocks are set up
import { SettingsProvider, useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/hooks/use-auth';

const mockUseAuth = vi.mocked(useAuth);

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
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    mockItemsAtHome = [];
    mockFavoriteRecipes = [];
    mockHouseholdLanguage = 'en';

    mockUseCurrentUser.mockImplementation(() => ({
      data: { uid: 'test-uid', email: 'test@example.com', household_id: 'test-household' },
      isLoading: false,
    }));

    mockUseItemsAtHome.mockImplementation(() => ({
      data: { items_at_home: mockItemsAtHome },
      isLoading: false,
    }));

    mockUseAddItemAtHome.mockImplementation(() => ({
      mutateAsync: async (params: { householdId: string; item: string }) => {
        const normalized = params.item.toLowerCase().trim();
        if (normalized && !mockItemsAtHome.includes(normalized)) {
          mockItemsAtHome = [...mockItemsAtHome, normalized].sort();
        }
        return { items_at_home: mockItemsAtHome };
      },
    }));

    mockUseRemoveItemAtHome.mockImplementation(() => ({
      mutateAsync: async (params: { householdId: string; item: string }) => {
        const normalized = params.item.toLowerCase().trim();
        mockItemsAtHome = mockItemsAtHome.filter(i => i !== normalized);
        return { items_at_home: mockItemsAtHome };
      },
    }));

    mockUseFavoriteRecipes.mockImplementation(() => ({
      data: { favorite_recipes: mockFavoriteRecipes },
      isLoading: false,
    }));

    mockUseAddFavoriteRecipe.mockImplementation(() => ({
      mutateAsync: async (params: { householdId: string; recipeId: string }) => {
        if (!mockFavoriteRecipes.includes(params.recipeId)) {
          mockFavoriteRecipes = [...mockFavoriteRecipes, params.recipeId];
        }
        return { favorite_recipes: mockFavoriteRecipes };
      },
    }));

    mockUseRemoveFavoriteRecipe.mockImplementation(() => ({
      mutateAsync: async (params: { householdId: string; recipeId: string }) => {
        mockFavoriteRecipes = mockFavoriteRecipes.filter(r => r !== params.recipeId);
        return { favorite_recipes: mockFavoriteRecipes };
      },
    }));

    mockUseHouseholdSettings.mockImplementation(() => ({
      data: { language: mockHouseholdLanguage },
      isLoading: false,
    }));

    mockUseUpdateHouseholdSettings.mockImplementation(() => ({
      mutateAsync: async (params: { householdId: string; settings: { language?: string } }) => {
        if (params.settings.language) {
          mockHouseholdLanguage = params.settings.language;
        }
        return { language: mockHouseholdLanguage };
      },
    }));
  });

  it('starts with default settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.itemsAtHome).toEqual([]);
    expect(result.current.settings.favoriteRecipes).toEqual([]);
    expect(result.current.settings.language).toBe('en');
    expect(result.current.settings.showHiddenRecipes).toBe(false);
  });

  it('loads cloud settings', async () => {
    mockItemsAtHome = ['salt', 'pepper'];
    mockFavoriteRecipes = ['recipe-1'];
    mockHouseholdLanguage = 'sv';

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.itemsAtHome).toEqual(['salt', 'pepper']);
    expect(result.current.settings.favoriteRecipes).toEqual(['recipe-1']);
    expect(result.current.settings.language).toBe('sv');
  });

  it('loads showHiddenRecipes from AsyncStorage', async () => {
    mockStorage['@meal_planner_settings'] = JSON.stringify({ showHiddenRecipes: true });

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.showHiddenRecipes).toBe(true);
  });

  it('falls back to en for unsupported language', async () => {
    mockHouseholdLanguage = 'fr';

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.language).toBe('en');
  });

  describe('addItemAtHome', () => {
    it('normalizes to lowercase and trims whitespace', async () => {
      let capturedItem: string | undefined;
      mockUseAddItemAtHome.mockImplementation(() => ({
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

      expect(capturedItem).toBe('olive oil');
    });

    it('ignores empty/whitespace-only input', async () => {
      const mutationCalls: string[] = [];
      mockUseAddItemAtHome.mockImplementation(() => ({
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

      expect(mutationCalls).toEqual([]);
    });
  });

  describe('removeItemAtHome', () => {
    it('removes an existing item (case-insensitive via normalization)', async () => {
      let capturedItem: string | undefined;
      mockUseRemoveItemAtHome.mockImplementation(() => ({
        mutateAsync: async (params: { householdId: string; item: string }) => {
          capturedItem = params.item;
          return { items_at_home: [] };
        },
      }));

      mockItemsAtHome = ['butter', 'salt'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeItemAtHome('Salt');
      });

      expect(capturedItem).toBe('salt');
    });
  });

  describe('isItemAtHome', () => {
    it('returns true for exact match', async () => {
      mockItemsAtHome = ['salt', 'olive oil'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('salt')).toBe(true);
    });

    it('matches when grocery item contains a home item', async () => {
      mockItemsAtHome = ['salt'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('sea salt')).toBe(true);
    });

    it('matches when home item contains the grocery item', async () => {
      mockItemsAtHome = ['olive oil'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('oil')).toBe(true);
    });

    it('returns false for non-matching item', async () => {
      mockItemsAtHome = ['salt'];

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isItemAtHome('chicken')).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('updates the household language setting in cloud', async () => {
      let capturedLanguage: string | undefined;
      mockUseUpdateHouseholdSettings.mockImplementation(() => ({
        mutateAsync: async (params: { householdId: string; settings: { language?: string } }) => {
          capturedLanguage = params.settings.language;
          return { language: params.settings.language };
        },
      }));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setLanguage('it');
      });

      expect(capturedLanguage).toBe('it');
    });
  });

  describe('toggleFavorite', () => {
    it('adds a recipe to favorites via cloud', async () => {
      let capturedRecipeId: string | undefined;
      mockUseAddFavoriteRecipe.mockImplementation(() => ({
        mutateAsync: async (params: { householdId: string; recipeId: string }) => {
          capturedRecipeId = params.recipeId;
          return { favorite_recipes: [params.recipeId] };
        },
      }));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.toggleFavorite('recipe-abc');
      });

      expect(capturedRecipeId).toBe('recipe-abc');
    });

    it('removes a recipe from favorites when toggled again', async () => {
      mockFavoriteRecipes = ['recipe-abc'];

      let capturedRecipeId: string | undefined;
      mockUseRemoveFavoriteRecipe.mockImplementation(() => ({
        mutateAsync: async (params: { householdId: string; recipeId: string }) => {
          capturedRecipeId = params.recipeId;
          return { favorite_recipes: [] };
        },
      }));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isFavorite('recipe-abc')).toBe(true);

      await act(async () => {
        await result.current.toggleFavorite('recipe-abc');
      });

      expect(capturedRecipeId).toBe('recipe-abc');
    });
  });

  describe('toggleShowHiddenRecipes', () => {
    it('toggles the showHiddenRecipes setting locally', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: createSettingsWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.settings.showHiddenRecipes).toBe(false);

      await act(async () => {
        await result.current.toggleShowHiddenRecipes();
      });

      expect(result.current.settings.showHiddenRecipes).toBe(true);
    });
  });
});

describe('useSettings', () => {
  it('throws when used outside SettingsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');

    spy.mockRestore();
  });
});

/**
 * Regression tests for infinite re-render loop (React error #185).
 *
 * Bug: PR #204 added useCurrentUser() in SettingsProvider without gating on
 * auth readiness. In production, this fired API calls before Firebase auth
 * resolved, causing 401 errors and cascading re-renders.
 *
 * Fix (PR #209): Gate useCurrentUser with { enabled: isAuthenticated }.
 */
describe('SettingsProvider auth gate', () => {
  it('disables useCurrentUser when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    });

    renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    expect(mockUseCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('disables useCurrentUser when user is null (not signed in)', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    });

    renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    expect(mockUseCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('enables useCurrentUser when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' } as any,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    });

    renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    expect(mockUseCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });

  it('reports loading while auth is resolving', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      getIdToken: vi.fn(),
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: createSettingsWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
