/**
 * Tests for useGroceryScreen — verifies grocery screen delegates to GroceryContext.
 *
 * Real logic tested:
 * - All state comes from GroceryContext (household-level Firestore), not AsyncStorage
 * - refreshFromApi is called on focus to sync household data
 * - handleAddItem delegates to context.addCustomItem
 * - handleClearAll delegates to context.clearAll
 * - handleClearMealPlanItems delegates to context.saveSelections
 * - handleClearManualItems delegates to context.setCustomItems
 * - customItems converts CustomGroceryItem[] to GroceryItem[] for display
 * - hasLoadedOnce prevents skeleton flash on subsequent refreshes
 * - groceryListWithChecked combines generated + custom items with checked state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { CustomGroceryItem, Recipe } from '@/lib/types';

const mockRefreshFromApi = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockSaveSelections = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockClearAll = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockSetCheckedItems = vi.fn();
const mockClearChecked = vi.fn();
const mockAddCustomItem = vi.fn();
const mockSetCustomItems = vi.fn();

let mockContextState = {
  checkedItems: new Set<string>(),
  customItems: [] as CustomGroceryItem[],
  selectedMealKeys: [] as string[],
  mealServings: {} as Record<string, number>,
  isLoading: false,
  toggleItem: vi.fn(),
  setCheckedItems: mockSetCheckedItems,
  clearChecked: mockClearChecked,
  addCustomItem: mockAddCustomItem,
  setCustomItems: mockSetCustomItems,
  saveSelections: mockSaveSelections,
  clearAll: mockClearAll,
  refreshFromApi: mockRefreshFromApi,
};

const mockMealPlan = {
  meals: {} as Record<string, string>,
  notes: {} as Record<string, string>,
};

const mockRecipes: Recipe[] = [];

vi.mock('@/lib/hooks', () => ({
  useMealPlan: vi.fn(() => ({ data: mockMealPlan, isLoading: false })),
  useAllRecipes: vi.fn(() => ({ recipes: mockRecipes, totalCount: 0 })),
  useGroceryState: vi.fn(() => mockContextState),
}));

let focusCallbacks: (() => void)[] = [];
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
  useFocusEffect: vi.fn((cb: () => void) => {
    focusCallbacks.push(cb);
    cb();
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('@/lib/alert', () => ({
  showAlert: vi.fn(),
  showNotification: vi.fn(),
}));

vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    isItemAtHome: vi.fn(() => false),
    settings: null,
    isLoading: false,
  })),
}));

import { showAlert } from '@/lib/alert';
import { useGroceryScreen } from '../useGroceryScreen';

describe('useGroceryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    focusCallbacks = [];
    mockContextState = {
      checkedItems: new Set<string>(),
      customItems: [],
      selectedMealKeys: [],
      mealServings: {},
      isLoading: false,
      toggleItem: vi.fn(),
      setCheckedItems: mockSetCheckedItems,
      clearChecked: mockClearChecked,
      addCustomItem: mockAddCustomItem,
      setCustomItems: mockSetCustomItems,
      saveSelections: mockSaveSelections,
      clearAll: mockClearAll,
      refreshFromApi: mockRefreshFromApi,
    };
    mockMealPlan.meals = {};
  });

  describe('state from context', () => {
    it('calls refreshFromApi on focus', () => {
      renderHook(() => useGroceryScreen());
      expect(mockRefreshFromApi).toHaveBeenCalled();
    });

    it('converts CustomGroceryItem[] to GroceryItem[] for display', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.groceryListWithChecked.items).toEqual([
        expect.objectContaining({
          name: 'bread',
          category: 'bakery',
          quantity: null,
          unit: null,
          checked: false,
          recipe_sources: [],
          quantity_sources: [],
        }),
        expect.objectContaining({
          name: 'milk',
          category: 'dairy',
          quantity: null,
          unit: null,
          checked: false,
        }),
      ]);
    });

    it('applies checked state from context to grocery list', () => {
      mockContextState.checkedItems = new Set(['bread']);
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      const breadItem = result.current.groceryListWithChecked.items.find(
        (i) => i.name === 'bread',
      );
      const milkItem = result.current.groceryListWithChecked.items.find(
        (i) => i.name === 'milk',
      );

      expect(breadItem?.checked).toBe(true);
      expect(milkItem?.checked).toBe(false);
    });

    it('tracks hasLoadedOnce after context finishes loading', () => {
      mockContextState.isLoading = true;
      const { result, rerender } = renderHook(() => useGroceryScreen());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasLoadedOnce).toBe(false);

      mockContextState.isLoading = false;
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLoadedOnce).toBe(true);
    });
  });

  describe('handleAddItem', () => {
    it('delegates to context.addCustomItem', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.setNewItemText('cheese');
      });
      act(() => {
        result.current.handleAddItem();
      });

      expect(mockAddCustomItem).toHaveBeenCalledWith({
        name: 'cheese',
        category: 'other',
      });
    });

    it('does nothing for empty text', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleAddItem();
      });

      expect(mockAddCustomItem).not.toHaveBeenCalled();
    });

    it('trims whitespace from item name', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.setNewItemText('  cheese  ');
      });
      act(() => {
        result.current.handleAddItem();
      });

      expect(mockAddCustomItem).toHaveBeenCalledWith({
        name: 'cheese',
        category: 'other',
      });
    });

    it('clears input after adding', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.setNewItemText('cheese');
      });
      act(() => {
        result.current.handleAddItem();
      });

      expect(result.current.newItemText).toBe('');
    });
  });

  describe('handleClearAll', () => {
    it('delegates to context.clearAll via confirmation dialog', async () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearAll();
      });

      expect(showAlert).toHaveBeenCalledWith(
        'grocery.clearEntireList',
        'grocery.clearEntireListMessage',
        expect.arrayContaining([
          expect.objectContaining({ style: 'cancel' }),
          expect.objectContaining({ style: 'destructive' }),
        ]),
      );

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      await act(async () => {
        await destructiveAction!.onPress!();
      });

      expect(mockClearAll).toHaveBeenCalledOnce();
    });
  });

  describe('handleClearMealPlanItems', () => {
    it('delegates to context.saveSelections to clear meal selections', async () => {
      mockContextState.customItems = [{ name: 'bread', category: 'bakery' }];
      mockContextState.checkedItems = new Set(['bread', 'chicken']);

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearMealPlanItems();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      await act(async () => {
        await destructiveAction!.onPress!();
      });

      expect(mockSaveSelections).toHaveBeenCalledWith([], {});
      expect(mockSetCheckedItems).toHaveBeenCalledWith(new Set(['bread']));
    });
  });

  describe('handleClearManualItems', () => {
    it('delegates to context.setCustomItems to clear custom items', async () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearManualItems();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      await act(async () => {
        await destructiveAction!.onPress!();
      });

      expect(mockSetCustomItems).toHaveBeenCalledWith([]);
    });
  });

  describe('handleClearChecked', () => {
    it('delegates to context.clearChecked', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearChecked();
      });

      expect(mockClearChecked).toHaveBeenCalledOnce();
    });
  });

  describe('handleItemToggle', () => {
    it('adds item to checked set when checked', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleItemToggle('milk', true);
      });

      expect(mockSetCheckedItems).toHaveBeenCalledWith(new Set(['milk']));
    });

    it('removes item from checked set when unchecked', () => {
      mockContextState.checkedItems = new Set(['milk']);

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleItemToggle('milk', false);
      });

      expect(mockSetCheckedItems).toHaveBeenCalledWith(new Set());
    });
  });

  describe('stats', () => {
    it('counts total items from context custom items', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.totalItems).toBe(2);
    });

    it('counts checked items from context', () => {
      mockContextState.checkedItems = new Set(['bread', 'milk']);
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.checkedCount).toBe(2);
      expect(result.current.checkedItemsToBuy).toBe(2);
    });
  });
});
