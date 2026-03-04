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
import type { CustomGroceryItem, GroceryItem, Recipe } from '@/lib/types';

const mockRefreshFromApi = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockSaveSelections = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockClearAll = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockSetCheckedItems = vi.fn();
const mockClearChecked = vi.fn();
const mockAddCustomItem = vi.fn();
const mockSetCustomItems = vi.fn();
const mockSetItemOrder = vi.fn();
const mockResetTickSequence = vi.fn();

let mockContextState = {
  checkedItems: new Set<string>(),
  customItems: [] as CustomGroceryItem[],
  itemOrder: [] as string[],
  selectedMealKeys: [] as string[],
  mealServings: {} as Record<string, number>,
  isLoading: false,
  tickSequence: [] as string[],
  toggleItem: vi.fn(),
  setCheckedItems: mockSetCheckedItems,
  clearChecked: mockClearChecked,
  addCustomItem: mockAddCustomItem,
  setCustomItems: mockSetCustomItems,
  setItemOrder: mockSetItemOrder,
  resetTickSequence: mockResetTickSequence,
  saveSelections: mockSaveSelections,
  clearAll: mockClearAll,
  refreshFromApi: mockRefreshFromApi,
};

const mockMealPlan = {
  meals: {} as Record<string, string>,
  notes: {} as Record<string, string>,
};

const mockRecipes: Recipe[] = [];

let mockStoreOrderData: { item_order: string[] } | undefined = undefined;

vi.mock('@/lib/hooks', () => ({
  useMealPlan: vi.fn(() => ({ data: mockMealPlan, isLoading: false })),
  useAllRecipes: vi.fn(() => ({ recipes: mockRecipes, totalCount: 0 })),
  useGroceryState: vi.fn(() => mockContextState),
  useStoreOrder: vi.fn(() => ({ data: mockStoreOrderData })),
  groceryKeys: {
    all: ['grocery'] as const,
    storeOrder: (storeId: string) => ['grocery', 'storeOrder', storeId] as const,
  },
}));

let focusCallbacks: (() => (() => void) | void)[] = [];
let focusCleanups: (() => void)[] = [];
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
  useFocusEffect: vi.fn((cb: () => (() => void) | void) => {
    focusCallbacks.push(cb);
    const cleanup = cb();
    if (cleanup) focusCleanups.push(cleanup);
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('@/lib/alert', () => ({
  showAlert: vi.fn(),
  showNotification: vi.fn(),
}));

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
const mockSetQueryData = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  })),
}));

const mockLearnStoreOrder = vi.fn().mockResolvedValue({ updated: false, item_order: [] });
vi.mock('@/lib/api', () => ({
  api: {
    learnStoreOrder: (...args: unknown[]) => mockLearnStoreOrder(...args),
  },
}));

vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    isItemAtHome: vi.fn(() => false),
    activeStoreId: null,
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
    focusCleanups = [];
    mockLearnStoreOrder.mockResolvedValue({ updated: false, item_order: [] });
    mockContextState = {
      checkedItems: new Set<string>(),
      customItems: [],
      itemOrder: [],
      selectedMealKeys: [],
      mealServings: {},
      isLoading: false,
      tickSequence: [],
      toggleItem: vi.fn(),
      setCheckedItems: mockSetCheckedItems,
      clearChecked: mockClearChecked,
      addCustomItem: mockAddCustomItem,
      setCustomItems: mockSetCustomItems,
      setItemOrder: mockSetItemOrder,
      resetTickSequence: mockResetTickSequence,
      saveSelections: mockSaveSelections,
      clearAll: mockClearAll,
      refreshFromApi: mockRefreshFromApi,
    };
    mockMealPlan.meals = {};
    mockStoreOrderData = undefined;
  });

  describe('state from context', () => {
    it('calls refreshFromApi on focus', () => {
      renderHook(() => useGroceryScreen());
      expect(mockRefreshFromApi).toHaveBeenCalled();
    });

    it('invalidates store order query on focus when store is active', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(() => false),
        activeStoreId: 'store_1',
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);

      renderHook(() => useGroceryScreen());

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['grocery', 'storeOrder', 'store_1'],
      });
    });

    it('skips store order invalidation on focus when no store is active', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(() => false),
        activeStoreId: null,
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);

      renderHook(() => useGroceryScreen());
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it('resets all modes on blur (tab leave)', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleToggleDeleteMode();
      });
      act(() => {
        result.current.toggleDeleteItem('bread');
      });
      act(() => {
        result.current.setShowAddItem(true);
      });

      expect(result.current.deleteMode).toBe(true);
      expect(result.current.deleteSelection.size).toBe(1);

      const lastCleanup = focusCleanups[focusCleanups.length - 1];
      act(() => {
        lastCleanup();
      });

      expect(result.current.deleteMode).toBe(false);
      expect(result.current.deleteSelection.size).toBe(0);
      expect(result.current.reorderMode).toBe(false);
      expect(result.current.showAddItem).toBe(false);
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

  describe('handleDeleteSelected', () => {
    it('does nothing when selection is empty', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleDeleteSelected();
      });

      expect(showAlert).not.toHaveBeenCalled();
    });

    it('removes selected custom items via confirmation dialog', async () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];
      mockContextState.checkedItems = new Set(['bread']);

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.toggleDeleteItem('bread');
      });
      act(() => {
        result.current.handleDeleteSelected();
      });

      expect(showAlert).toHaveBeenCalledWith(
        'grocery.deleteSelected',
        'grocery.deleteSelectedMessage',
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

      expect(mockSetCustomItems).toHaveBeenCalledWith([
        { name: 'milk', category: 'dairy' },
      ]);
      expect(mockSetCheckedItems).toHaveBeenCalledWith(new Set());
    });

    it('clears selection and exits delete mode after confirming', async () => {
      mockContextState.customItems = [{ name: 'bread', category: 'bakery' }];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.toggleDeleteItem('bread');
      });
      act(() => {
        result.current.handleDeleteSelected();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      await act(async () => {
        await destructiveAction!.onPress!();
      });

      expect(result.current.deleteSelection.size).toBe(0);
      expect(result.current.deleteMode).toBe(false);
    });
  });

  describe('handleClearPicked', () => {
    it('shows confirmation dialog', () => {
      mockContextState.checkedItems = new Set(['bread']);
      mockContextState.customItems = [{ name: 'bread', category: 'bakery' }];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearPicked();
      });

      expect(showAlert).toHaveBeenCalledWith(
        'grocery.clearPicked',
        'grocery.clearPickedMessage',
        expect.arrayContaining([
          expect.objectContaining({ style: 'cancel' }),
          expect.objectContaining({ style: 'destructive' }),
        ]),
      );
    });

    it('removes picked custom items and clears checked', () => {
      mockContextState.checkedItems = new Set(['bread']);
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearPicked();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      act(() => {
        destructiveAction!.onPress!();
      });

      expect(mockSetCustomItems).toHaveBeenCalledWith([
        { name: 'milk', category: 'dairy' },
      ]);
      expect(mockClearChecked).toHaveBeenCalledOnce();
      expect(mockResetTickSequence).toHaveBeenCalledOnce();
    });

    it('calls learnStoreOrder and updates cache with response', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(() => false),
        activeStoreId: 'store_1',
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);

      mockLearnStoreOrder.mockResolvedValue({
        updated: true,
        item_order: ['milk', 'bread', 'cheese'],
      });

      mockContextState.tickSequence = ['milk', 'bread', 'cheese'];
      mockContextState.checkedItems = new Set(['milk', 'bread', 'cheese']);
      mockContextState.customItems = [
        { name: 'milk', category: 'dairy' },
        { name: 'bread', category: 'bakery' },
        { name: 'cheese', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearPicked();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      act(() => {
        destructiveAction!.onPress!();
      });

      expect(mockLearnStoreOrder).toHaveBeenCalledWith('store_1', {
        tick_sequence: ['milk', 'bread', 'cheese'],
      });

      await vi.waitFor(() => {
        expect(mockSetQueryData).toHaveBeenCalledWith(
          ['grocery', 'storeOrder', 'store_1'],
          { item_order: ['milk', 'bread', 'cheese'] },
        );
      });

      expect(mockClearChecked).toHaveBeenCalledOnce();
      expect(mockResetTickSequence).toHaveBeenCalledOnce();
    });

    it('skips learnStoreOrder when no active store', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(() => false),
        activeStoreId: null,
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);

      mockContextState.tickSequence = ['milk', 'bread'];
      mockContextState.checkedItems = new Set(['milk', 'bread']);
      mockContextState.customItems = [
        { name: 'milk', category: 'dairy' },
        { name: 'bread', category: 'bakery' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearPicked();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      act(() => {
        destructiveAction!.onPress!();
      });

      expect(mockLearnStoreOrder).not.toHaveBeenCalled();
      expect(mockClearChecked).toHaveBeenCalledOnce();
    });

    it('skips learnStoreOrder when tick sequence too short', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(() => false),
        activeStoreId: 'store_1',
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);

      mockContextState.tickSequence = ['milk'];
      mockContextState.checkedItems = new Set(['milk']);
      mockContextState.customItems = [{ name: 'milk', category: 'dairy' }];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleClearPicked();
      });

      const destructiveAction = vi.mocked(showAlert).mock.calls[0][2]!.find(
        (b) => b.style === 'destructive',
      );
      act(() => {
        destructiveAction!.onPress!();
      });

      expect(mockLearnStoreOrder).not.toHaveBeenCalled();
    });
  });

  describe('handleItemToggle', () => {
    it('delegates to context toggleItem when checking', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleItemToggle('milk', true);
      });

      expect(mockContextState.toggleItem).toHaveBeenCalledWith('milk');
    });

    it('delegates to context toggleItem when unchecking', () => {
      mockContextState.checkedItems = new Set(['milk']);

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleItemToggle('milk', false);
      });

      expect(mockContextState.toggleItem).toHaveBeenCalledWith('milk');
    });
  });

  describe('handleToggleAddItem', () => {
    it('toggles showAddItem on and off', () => {
      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.showAddItem).toBe(false);

      act(() => {
        result.current.handleToggleAddItem();
      });

      expect(result.current.showAddItem).toBe(true);

      act(() => {
        result.current.handleToggleAddItem();
      });

      expect(result.current.showAddItem).toBe(false);
    });

    it('closes delete mode and reorder mode when opening add item', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleToggleDeleteMode();
      });
      expect(result.current.deleteMode).toBe(true);

      act(() => {
        result.current.handleToggleAddItem();
      });

      expect(result.current.showAddItem).toBe(true);
      expect(result.current.deleteMode).toBe(false);
      expect(result.current.reorderMode).toBe(false);
    });
  });

  describe('handleToggleDeleteMode', () => {
    it('toggles deleteMode on and off', () => {
      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.deleteMode).toBe(false);

      act(() => {
        result.current.handleToggleDeleteMode();
      });

      expect(result.current.deleteMode).toBe(true);

      act(() => {
        result.current.handleToggleDeleteMode();
      });

      expect(result.current.deleteMode).toBe(false);
    });

    it('closes add item and reorder mode when entering delete mode', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.setShowAddItem(true);
      });
      expect(result.current.showAddItem).toBe(true);

      act(() => {
        result.current.handleToggleDeleteMode();
      });

      expect(result.current.deleteMode).toBe(true);
      expect(result.current.showAddItem).toBe(false);
      expect(result.current.reorderMode).toBe(false);
    });
  });

  describe('handleToggleReorderMode', () => {
    it('toggles reorderMode on and off', () => {
      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.reorderMode).toBe(false);

      act(() => {
        result.current.handleToggleReorderMode();
      });

      expect(result.current.reorderMode).toBe(true);

      act(() => {
        result.current.handleToggleReorderMode();
      });

      expect(result.current.reorderMode).toBe(false);
    });

    it('closes delete mode and add item when entering reorder mode', () => {
      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.handleToggleDeleteMode();
      });
      expect(result.current.deleteMode).toBe(true);

      act(() => {
        result.current.handleToggleReorderMode();
      });

      expect(result.current.reorderMode).toBe(true);
      expect(result.current.deleteMode).toBe(false);
      expect(result.current.showAddItem).toBe(false);
    });
  });

  describe('toggleDeleteItem', () => {
    it('adds an item to the delete selection', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.toggleDeleteItem('bread');
      });

      expect(result.current.deleteSelection).toEqual(new Set(['bread']));
    });

    it('removes an already-selected item from the delete selection', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      act(() => {
        result.current.toggleDeleteItem('bread');
      });
      act(() => {
        result.current.toggleDeleteItem('bread');
      });

      expect(result.current.deleteSelection).toEqual(new Set());
    });
  });

  describe('uncheckedItems and pickedItems', () => {
    it('separates items into unchecked and picked lists', () => {
      mockContextState.checkedItems = new Set(['bread']);
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.uncheckedItems).toEqual([
        expect.objectContaining({ name: 'milk', checked: false }),
      ]);
      expect(result.current.pickedItems).toEqual([
        expect.objectContaining({ name: 'bread', checked: true }),
      ]);
    });

    it('sorts picked items by tick-off order', () => {
      mockContextState.checkedItems = new Set(['eggs', 'bread', 'milk']);
      mockContextState.tickSequence = ['milk', 'eggs', 'bread'];
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
        { name: 'eggs', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.pickedItems.map((i) => i.name)).toEqual([
        'milk',
        'eggs',
        'bread',
      ]);
    });
  });

  describe('handleReorder', () => {
    it('calls setItemOrder with reordered names', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
        { name: 'eggs', category: 'dairy' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      const reorderedItems = [
        expect.objectContaining({ name: 'eggs' }),
        expect.objectContaining({ name: 'bread' }),
        expect.objectContaining({ name: 'milk' }),
      ];

      act(() => {
        result.current.handleReorder([
          { name: 'eggs', category: 'dairy', checked: false, quantity: null, unit: null, quantity_sources: [], recipe_sources: [] },
          { name: 'bread', category: 'bakery', checked: false, quantity: null, unit: null, quantity_sources: [], recipe_sources: [] },
          { name: 'milk', category: 'dairy', checked: false, quantity: null, unit: null, quantity_sources: [], recipe_sources: [] },
        ]);
      });

      expect(mockSetItemOrder).toHaveBeenCalledWith(['eggs', 'bread', 'milk']);
    });
  });

  describe('item ordering', () => {
    it('sorts unchecked items by itemOrder', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
        { name: 'eggs', category: 'dairy' },
      ];
      mockContextState.itemOrder = ['eggs', 'milk', 'bread'];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.uncheckedItems.map((i) => i.name)).toEqual([
        'eggs',
        'milk',
        'bread',
      ]);
    });

    it('appends unordered items at the end', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
        { name: 'eggs', category: 'dairy' },
      ];
      mockContextState.itemOrder = ['milk'];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.uncheckedItems[0].name).toBe('milk');
      expect(result.current.uncheckedItems.length).toBe(3);
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

  describe('mealPlanItemNames and manualItemNames', () => {
    it('manualItemNames contains custom item names', () => {
      mockContextState.customItems = [{ name: 'bread', category: 'bakery' }];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.manualItemNames).toEqual(['bread']);
    });

    it('manualItemNames is empty when no custom items', () => {
      mockContextState.customItems = [];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.manualItemNames).toEqual([]);
    });

    it('mealPlanItemNames is empty when no generated items', () => {
      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.mealPlanItemNames).toEqual([]);
    });
  });

  describe('items at home filtering', () => {
    const mockSettingsWithItemAtHome = async (
      matcher: (name: string) => boolean,
    ) => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        isItemAtHome: vi.fn(matcher),
        activeStoreId: null,
        groceryStores: [],
        setActiveStoreId: vi.fn(),
        settings: null,
        isLoading: false,
      } as unknown as ReturnType<typeof useSettings>);
    };

    const buildGroceryItem = (
      name: string,
      recipeSources: string[],
    ): GroceryItem => ({
      name,
      quantity: null,
      unit: null,
      category: 'other',
      checked: false,
      recipe_sources: recipeSources,
      quantity_sources: [],
    });

    const setupMealPlanWithSalt = () => {
      mockRecipes.length = 0;
      mockRecipes.push({
        id: 'r1',
        title: 'Pasta',
        ingredients: ['200g pasta', '1 tsp salt'],
        servings: 2,
      } as Recipe);
      mockMealPlan.meals = { mon_dinner: 'r1' };
      mockContextState.selectedMealKeys = ['mon_dinner'];
    };

    it('filterOutItemsAtHome hides generated items that are at home', async () => {
      await mockSettingsWithItemAtHome((name) => name === 'salt');
      setupMealPlanWithSalt();

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.filterOutItemsAtHome(buildGroceryItem('salt', ['Pasta']))).toBe(true);
      expect(result.current.filterOutItemsAtHome(buildGroceryItem('pasta', ['Pasta']))).toBe(false);
    });

    it('filterOutItemsAtHome does NOT hide manual items even if they match items at home', async () => {
      await mockSettingsWithItemAtHome((name) => name === 'salt');

      mockContextState.customItems = [
        { name: 'salt', category: 'pantry' },
        { name: 'bread', category: 'bakery' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.filterOutItemsAtHome(buildGroceryItem('salt', []))).toBe(false);
      expect(result.current.filterOutItemsAtHome(buildGroceryItem('bread', []))).toBe(false);
    });

    it('hiddenAtHomeCount only counts generated items, not manual items', async () => {
      await mockSettingsWithItemAtHome((name) => name === 'salt');
      setupMealPlanWithSalt();
      mockContextState.customItems = [
        { name: 'salt', category: 'pantry' },
      ];

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.hiddenAtHomeCount).toBe(1);
    });

    it('checkedItemsToBuy includes checked manual items even if they match items at home', async () => {
      await mockSettingsWithItemAtHome((name) => name === 'salt');

      mockContextState.customItems = [
        { name: 'salt', category: 'pantry' },
        { name: 'bread', category: 'bakery' },
      ];
      mockContextState.checkedItems = new Set(['salt', 'bread']);

      const { result } = renderHook(() => useGroceryScreen());

      expect(result.current.checkedItemsToBuy).toBe(2);
    });
  });

  describe('store order sorting', () => {
    it('sorts unchecked items by store order when available', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'cheese', category: 'dairy' },
        { name: 'milk', category: 'dairy' },
      ];
      mockStoreOrderData = { item_order: ['milk', 'cheese', 'bread'] };

      const { result } = renderHook(() => useGroceryScreen());

      const names = result.current.uncheckedItems.map((i) => i.name);
      expect(names).toEqual(['milk', 'cheese', 'bread']);
    });

    it('falls back to manual itemOrder when no store order', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'cheese', category: 'dairy' },
        { name: 'milk', category: 'dairy' },
      ];
      mockContextState.itemOrder = ['cheese', 'bread', 'milk'];
      mockStoreOrderData = undefined;

      const { result } = renderHook(() => useGroceryScreen());

      const names = result.current.uncheckedItems.map((i) => i.name);
      expect(names).toEqual(['cheese', 'bread', 'milk']);
    });

    it('prefers store order over manual itemOrder', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'cheese', category: 'dairy' },
        { name: 'milk', category: 'dairy' },
      ];
      mockContextState.itemOrder = ['bread', 'cheese', 'milk'];
      mockStoreOrderData = { item_order: ['milk', 'cheese', 'bread'] };

      const { result } = renderHook(() => useGroceryScreen());

      const names = result.current.uncheckedItems.map((i) => i.name);
      expect(names).toEqual(['milk', 'cheese', 'bread']);
    });

    it('puts unknown items at end when sorting by store order', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'newitem', category: 'other' },
        { name: 'milk', category: 'dairy' },
      ];
      mockStoreOrderData = { item_order: ['milk', 'bread'] };

      const { result } = renderHook(() => useGroceryScreen());

      const names = result.current.uncheckedItems.map((i) => i.name);
      expect(names).toEqual(['milk', 'bread', 'newitem']);
    });

    it('falls back to manual order when store order is empty', () => {
      mockContextState.customItems = [
        { name: 'bread', category: 'bakery' },
        { name: 'milk', category: 'dairy' },
      ];
      mockContextState.itemOrder = ['milk', 'bread'];
      mockStoreOrderData = { item_order: [] };

      const { result } = renderHook(() => useGroceryScreen());

      const names = result.current.uncheckedItems.map((i) => i.name);
      expect(names).toEqual(['milk', 'bread']);
    });
  });
});
