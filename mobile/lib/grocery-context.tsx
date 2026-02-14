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
  selectedMealKeys: string[];
  mealServings: Record<string, number>;
  isLoading: boolean;
  toggleItem: (itemName: string) => void;
  setCheckedItems: (items: Set<string>) => void;
  clearChecked: () => void;
  addCustomItem: (item: CustomGroceryItem) => void;
  setCustomItems: (items: CustomGroceryItem[]) => void;
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
  ]).catch(() => {});
};

const normalizeCustomItems = (raw: unknown[]): CustomGroceryItem[] =>
  raw.map((item) =>
    typeof item === 'string'
      ? { name: item, category: 'other' as const }
      : (item as CustomGroceryItem),
  );

const loadFromAsyncStorage = async (): Promise<Partial<GroceryListState>> => {
  const [checkedData, customData, mealsData, servingsData] = await Promise.all([
    AsyncStorage.getItem('grocery_checked_items'),
    AsyncStorage.getItem('grocery_custom_items'),
    AsyncStorage.getItem('grocery_selected_meals'),
    AsyncStorage.getItem('grocery_meal_servings'),
  ]);

  const rawCustom = customData ? JSON.parse(customData) : [];

  return {
    checked_items: checkedData ? JSON.parse(checkedData) : [],
    custom_items: Array.isArray(rawCustom)
      ? normalizeCustomItems(rawCustom)
      : [],
    selected_meals: mealsData ? JSON.parse(mealsData) : [],
    meal_servings: servingsData ? JSON.parse(servingsData) : {},
  };
};

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const [checkedItems, setCheckedItemsState] = useState<Set<string>>(new Set());
  const [customItems, setCustomItemsState] = useState<CustomGroceryItem[]>([]);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Record<string, unknown>>({});
  const checkedRef = useRef<Set<string>>(checkedItems);
  const customItemsRef = useRef<CustomGroceryItem[]>(customItems);

  const flushPatch = useCallback(() => {
    const patch = { ...pendingPatchRef.current };
    pendingPatchRef.current = {};
    if (Object.keys(patch).length === 0) return;
    api.patchGroceryState(patch).catch((err: unknown) => {
      console.warn(
        '[GroceryContext] Patch failed, will resync on next focus:',
        err,
      );
    });
  }, []);

  const enqueuePatch = useCallback(
    (fields: Record<string, unknown>) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...fields };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(flushPatch, DEBOUNCE_MS);
    },
    [flushPatch],
  );

  const applyState = useCallback((state: GroceryListState) => {
    const checked = new Set(state.checked_items);
    setCheckedItemsState(checked);
    checkedRef.current = checked;
    const items = state.custom_items || [];
    setCustomItemsState(items);
    customItemsRef.current = items;
    setSelectedMealKeys(state.selected_meals || []);
    setMealServings(state.meal_servings || {});
  }, []);

  const loadFromApi = useCallback(async () => {
    try {
      const state = await api.getGroceryState();
      applyState(state);
      cacheToAsyncStorage({
        checkedItems: state.checked_items,
        customItems: state.custom_items || [],
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
        } else {
          newSet.add(itemName);
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
      await api.patchGroceryState({
        selected_meals: meals,
        meal_servings: servings,
      });
    },
    [],
  );

  const clearAll = useCallback(async () => {
    setCheckedItemsState(new Set());
    checkedRef.current = new Set();
    setCustomItemsState([]);
    customItemsRef.current = [];
    setSelectedMealKeys([]);
    setMealServings({});
    await Promise.all([
      AsyncStorage.removeItem('grocery_selected_meals'),
      AsyncStorage.removeItem('grocery_custom_items'),
      AsyncStorage.removeItem('grocery_checked_items'),
      AsyncStorage.removeItem('grocery_meal_servings'),
    ]).catch(() => {});
    api.clearGroceryState().catch(() => {});
  }, []);

  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    await loadFromApi();
  }, [loadFromApi]);

  return (
    <GroceryContext.Provider
      value={{
        checkedItems,
        customItems,
        selectedMealKeys,
        mealServings,
        isLoading,
        toggleItem,
        setCheckedItems,
        clearChecked,
        addCustomItem,
        setCustomItems,
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
