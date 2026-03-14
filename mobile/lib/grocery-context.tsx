/**
 * Global grocery state context.
 * Source of truth: Firestore via API. AsyncStorage used as offline cache.
 *
 * On mount: loads from API, falls back to AsyncStorage if offline.
 * On change: writes to API (debounced) and AsyncStorage (immediate).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { api } from './api';
import type { CustomGroceryItem, GroceryListState } from './types';

interface GroceryContextValue {
  checkedItems: Set<string>;
  customItems: CustomGroceryItem[];
  itemOrder: string[];
  removedItems: string[];
  selectedMealKeys: string[];
  mealServings: Record<string, number>;
  isLoading: boolean;
  tickSequence: string[];
  toggleItem: (itemName: string) => void;
  setCheckedItems: (items: Set<string>) => void;
  clearChecked: () => void;
  addCustomItem: (item: CustomGroceryItem) => void;
  setCustomItems: (items: CustomGroceryItem[]) => void;
  setItemOrder: (order: string[]) => void;
  setRemovedItems: (items: string[]) => void;
  resetTickSequence: () => void;
  saveSelections: (
    meals: string[],
    servings: Record<string, number>,
  ) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextValue | null>(null);

const DEBOUNCE_MS = 500;

const cacheToAsyncStorage = async (state: {
  checkedItems: string[];
  customItems: CustomGroceryItem[];
  itemOrder: string[];
  removedItems: string[];
  selectedMealKeys: string[];
  mealServings: Record<string, number>;
}) => {
  await Promise.all([
    AsyncStorage.setItem(
      'grocery_checked_items',
      JSON.stringify(state.checkedItems),
    ),
    AsyncStorage.setItem(
      'grocery_custom_items',
      JSON.stringify(state.customItems),
    ),
    AsyncStorage.setItem(
      'grocery_selected_meals',
      JSON.stringify(state.selectedMealKeys),
    ),
    AsyncStorage.setItem(
      'grocery_meal_servings',
      JSON.stringify(state.mealServings),
    ),
    AsyncStorage.setItem('grocery_item_order', JSON.stringify(state.itemOrder)),
    AsyncStorage.setItem(
      'grocery_removed_items',
      JSON.stringify(state.removedItems),
    ),
  ]).catch(() => {});
};

const normalizeCustomItems = (raw: unknown[]): CustomGroceryItem[] =>
  raw.map((item) =>
    typeof item === 'string'
      ? { name: item, category: 'other' as const }
      : (item as CustomGroceryItem),
  );

const loadFromAsyncStorage = async (): Promise<Partial<GroceryListState>> => {
  const [
    checkedData,
    customData,
    mealsData,
    servingsData,
    orderData,
    removedData,
  ] = await Promise.all([
    AsyncStorage.getItem('grocery_checked_items'),
    AsyncStorage.getItem('grocery_custom_items'),
    AsyncStorage.getItem('grocery_selected_meals'),
    AsyncStorage.getItem('grocery_meal_servings'),
    AsyncStorage.getItem('grocery_item_order'),
    AsyncStorage.getItem('grocery_removed_items'),
  ]);

  const rawCustom = customData ? JSON.parse(customData) : [];

  return {
    checked_items: checkedData ? JSON.parse(checkedData) : [],
    custom_items: Array.isArray(rawCustom)
      ? normalizeCustomItems(rawCustom)
      : [],
    selected_meals: mealsData ? JSON.parse(mealsData) : [],
    meal_servings: servingsData ? JSON.parse(servingsData) : {},
    item_order: orderData ? JSON.parse(orderData) : [],
    removed_items: removedData ? JSON.parse(removedData) : [],
  };
};

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const [checkedItems, setCheckedItemsState] = useState<Set<string>>(new Set());
  const [customItems, setCustomItemsState] = useState<CustomGroceryItem[]>([]);
  const [itemOrder, setItemOrderState] = useState<string[]>([]);
  const [removedItems, setRemovedItemsState] = useState<string[]>([]);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Record<string, unknown>>({});
  const checkedRef = useRef<Set<string>>(checkedItems);
  const customItemsRef = useRef<CustomGroceryItem[]>(customItems);
  const itemOrderRef = useRef<string[]>(itemOrder);
  const removedItemsRef = useRef<string[]>(removedItems);
  const tickSequenceRef = useRef<string[]>([]);
  const [tickSequence, setTickSequence] = useState<string[]>([]);

  const applyState = useCallback((state: GroceryListState) => {
    const checked = new Set(state.checked_items);
    setCheckedItemsState(checked);
    checkedRef.current = checked;
    const items = state.custom_items || [];
    setCustomItemsState(items);
    customItemsRef.current = items;
    const order = state.item_order || [];
    setItemOrderState(order);
    itemOrderRef.current = order;
    const removed = state.removed_items || [];
    setRemovedItemsState(removed);
    removedItemsRef.current = removed;
    setSelectedMealKeys(state.selected_meals || []);
    setMealServings(state.meal_servings || {});
  }, []);

  const flushPatch = useCallback((): Promise<void> => {
    const patch = { ...pendingPatchRef.current };
    pendingPatchRef.current = {};
    if (Object.keys(patch).length === 0) return Promise.resolve();
    return api
      .patchGroceryState(patch)
      .then((response) => {
        applyState(response);
        cacheToAsyncStorage({
          checkedItems: response.checked_items,
          customItems: response.custom_items || [],
          itemOrder: response.item_order || [],
          removedItems: response.removed_items || [],
          selectedMealKeys: response.selected_meals || [],
          mealServings: response.meal_servings || {},
        });
      })
      .catch(() => {
        pendingPatchRef.current = { ...patch, ...pendingPatchRef.current };
      });
  }, [applyState]);

  const enqueuePatch = useCallback(
    (fields: Record<string, unknown>) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...fields };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(flushPatch, DEBOUNCE_MS);
    },
    [flushPatch],
  );

  const loadFromApi = useCallback(async () => {
    try {
      const state = await api.getGroceryState();
      applyState(state);
      cacheToAsyncStorage({
        checkedItems: state.checked_items,
        customItems: state.custom_items || [],
        itemOrder: state.item_order || [],
        removedItems: state.removed_items || [],
        selectedMealKeys: state.selected_meals || [],
        mealServings: state.meal_servings || {},
      });
    } catch {
      const cached = await loadFromAsyncStorage();
      const checked = new Set(cached.checked_items || []);
      setCheckedItemsState(checked);
      checkedRef.current = checked;
      const items = cached.custom_items || [];
      setCustomItemsState(items);
      customItemsRef.current = items;
      const order = cached.item_order || [];
      setItemOrderState(order);
      itemOrderRef.current = order;
      const removed = cached.removed_items || [];
      setRemovedItemsState(removed);
      removedItemsRef.current = removed;
      setSelectedMealKeys(cached.selected_meals || []);
      setMealServings(cached.meal_servings || {});
    } finally {
      setIsLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  useEffect(() => {
    return () => {
      if (patchTimerRef.current) {
        clearTimeout(patchTimerRef.current);
        flushPatch();
      }
    };
  }, [flushPatch]);

  const setCheckedItems = useCallback(
    (items: Set<string>) => {
      setCheckedItemsState(items);
      checkedRef.current = items;
      const arr = Array.from(items);
      AsyncStorage.setItem('grocery_checked_items', JSON.stringify(arr)).catch(
        () => {},
      );
      enqueuePatch({ checked_items: arr });
    },
    [enqueuePatch],
  );

  const toggleItem = useCallback(
    (itemName: string) => {
      setCheckedItemsState((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemName)) {
          newSet.delete(itemName);
          // Remove from tick sequence when unchecked
          const updated = tickSequenceRef.current.filter((n) => n !== itemName);
          tickSequenceRef.current = updated;
          setTickSequence(updated);
        } else {
          newSet.add(itemName);
          // Track tick order for store layout learning
          const updated = [...tickSequenceRef.current, itemName];
          tickSequenceRef.current = updated;
          setTickSequence(updated);
        }
        checkedRef.current = newSet;
        const arr = Array.from(newSet);
        AsyncStorage.setItem(
          'grocery_checked_items',
          JSON.stringify(arr),
        ).catch(() => {});
        enqueuePatch({ checked_items: arr });
        return newSet;
      });
    },
    [enqueuePatch],
  );

  const clearChecked = useCallback(() => {
    setCheckedItemsState(new Set());
    checkedRef.current = new Set();
    AsyncStorage.setItem('grocery_checked_items', JSON.stringify([])).catch(
      () => {},
    );
    enqueuePatch({ checked_items: [] });
  }, [enqueuePatch]);

  const resetTickSequence = useCallback(() => {
    tickSequenceRef.current = [];
    setTickSequence([]);
  }, []);

  const addCustomItem = useCallback(
    (item: CustomGroceryItem) => {
      setCustomItemsState((prev) => {
        const updated = [...prev, item];
        customItemsRef.current = updated;
        AsyncStorage.setItem(
          'grocery_custom_items',
          JSON.stringify(updated),
        ).catch(() => {});
        enqueuePatch({ custom_items: updated });
        return updated;
      });
    },
    [enqueuePatch],
  );

  const setCustomItems = useCallback(
    (items: CustomGroceryItem[]) => {
      setCustomItemsState(items);
      customItemsRef.current = items;
      AsyncStorage.setItem('grocery_custom_items', JSON.stringify(items)).catch(
        () => {},
      );
      enqueuePatch({ custom_items: items });
    },
    [enqueuePatch],
  );

  const setItemOrder = useCallback(
    (order: string[]) => {
      setItemOrderState(order);
      itemOrderRef.current = order;
      AsyncStorage.setItem('grocery_item_order', JSON.stringify(order)).catch(
        () => {},
      );
      enqueuePatch({ item_order: order });
    },
    [enqueuePatch],
  );

  const setRemovedItems = useCallback(
    (items: string[]) => {
      const deduped = [...new Set(items)];
      setRemovedItemsState(deduped);
      removedItemsRef.current = deduped;
      AsyncStorage.setItem(
        'grocery_removed_items',
        JSON.stringify(deduped),
      ).catch(() => {});
      enqueuePatch({ removed_items: deduped });
    },
    [enqueuePatch],
  );

  const saveSelections = useCallback(
    async (meals: string[], servings: Record<string, number>) => {
      setSelectedMealKeys(meals);
      setMealServings(servings);
      AsyncStorage.setItem(
        'grocery_selected_meals',
        JSON.stringify(meals),
      ).catch(() => {});
      AsyncStorage.setItem(
        'grocery_meal_servings',
        JSON.stringify(servings),
      ).catch(() => {});
      const response = await api.patchGroceryState({
        selected_meals: meals,
        meal_servings: servings,
      });
      applyState(response);
      cacheToAsyncStorage({
        checkedItems: response.checked_items,
        customItems: response.custom_items || [],
        itemOrder: response.item_order || [],
        removedItems: response.removed_items || [],
        selectedMealKeys: response.selected_meals || [],
        mealServings: response.meal_servings || {},
      });
    },
    [applyState],
  );

  const clearAll = useCallback(async () => {
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    pendingPatchRef.current = {};
    setCheckedItemsState(new Set());
    checkedRef.current = new Set();
    setCustomItemsState([]);
    customItemsRef.current = [];
    setItemOrderState([]);
    itemOrderRef.current = [];
    setRemovedItemsState([]);
    removedItemsRef.current = [];
    setSelectedMealKeys([]);
    setMealServings({});
    tickSequenceRef.current = [];
    setTickSequence([]);
    await Promise.all([
      AsyncStorage.removeItem('grocery_selected_meals'),
      AsyncStorage.removeItem('grocery_custom_items'),
      AsyncStorage.removeItem('grocery_checked_items'),
      AsyncStorage.removeItem('grocery_meal_servings'),
      AsyncStorage.removeItem('grocery_item_order'),
      AsyncStorage.removeItem('grocery_removed_items'),
    ]).catch(() => {});
    api.clearGroceryState().catch(() => {});
  }, []);

  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    await flushPatch();
    await loadFromApi();
  }, [loadFromApi, flushPatch]);

  return (
    <GroceryContext.Provider
      value={{
        checkedItems,
        customItems,
        itemOrder,
        removedItems,
        selectedMealKeys,
        mealServings,
        isLoading,
        tickSequence,
        toggleItem,
        setCheckedItems,
        clearChecked,
        addCustomItem,
        setCustomItems,
        setItemOrder,
        setRemovedItems,
        resetTickSequence,
        saveSelections,
        clearAll,
        refreshFromApi,
      }}
    >
      {children}
    </GroceryContext.Provider>
  );
};

export const useGroceryState = () => {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGroceryState must be used within a GroceryProvider');
  }
  return context;
};
