/**
 * Global grocery state context.
 * Source of truth: Firestore via API (online-only, synced across household devices).
 *
 * Waits for Firebase Auth to resolve before loading from the API.
 * On change: writes to API (debounced for item-level changes, immediate for selections).
 */

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
import { useAuth } from './hooks/use-auth';
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
    removedItems?: string[],
  ) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextValue | null>(null);

const DEBOUNCE_MS = 500;

const EMPTY_GROCERY_STATE: GroceryListState = {
  selected_meals: [],
  meal_servings: {},
  checked_items: [],
  custom_items: [],
  item_order: [],
  removed_items: [],
};

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

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
  const isMountedRef = useRef(true);

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
        if (!isMountedRef.current) return;
        const hasPending = Object.keys(pendingPatchRef.current).length > 0;
        const effective = hasPending
          ? { ...response, ...pendingPatchRef.current }
          : response;
        applyState(effective as GroceryListState);
      })
      .catch((err: unknown) => {
        console.warn('[GroceryContext] Patch failed, will retry:', err);
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
      if (!isMountedRef.current) return;
      applyState(state);
      const checkedSet = new Set(state.checked_items || []);
      const reconciledTicks = tickSequenceRef.current.filter((t) =>
        checkedSet.has(t),
      );
      tickSequenceRef.current = reconciledTicks;
      setTickSequence(reconciledTicks);
    } catch {
      // Online-only: do not fall back to local storage on error
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyState]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      applyState(EMPTY_GROCERY_STATE);
      tickSequenceRef.current = [];
      setTickSequence([]);
      setIsLoading(false);
      return;
    }
    void loadFromApi();
  }, [authLoading, isAuthenticated, loadFromApi, applyState]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
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
        enqueuePatch({ checked_items: arr });
        return newSet;
      });
    },
    [enqueuePatch],
  );

  const clearChecked = useCallback(() => {
    setCheckedItemsState(new Set());
    checkedRef.current = new Set();
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
      enqueuePatch({ custom_items: items });
    },
    [enqueuePatch],
  );

  const setItemOrder = useCallback(
    (order: string[]) => {
      setItemOrderState(order);
      itemOrderRef.current = order;
      enqueuePatch({ item_order: order });
    },
    [enqueuePatch],
  );

  const setRemovedItems = useCallback(
    (items: string[]) => {
      const deduped = [...new Set(items)];
      setRemovedItemsState(deduped);
      removedItemsRef.current = deduped;
      enqueuePatch({ removed_items: deduped });
    },
    [enqueuePatch],
  );

  const saveSelections = useCallback(
    async (
      meals: string[],
      servings: Record<string, number>,
      removedItemsOverride?: string[],
    ) => {
      if (patchTimerRef.current) {
        clearTimeout(patchTimerRef.current);
        patchTimerRef.current = null;
      }
      await flushPatch();

      setSelectedMealKeys(meals);
      setMealServings(servings);

      const response = await api.patchGroceryState({
        selected_meals: meals,
        meal_servings: servings,
        ...(removedItemsOverride !== undefined
          ? { removed_items: removedItemsOverride }
          : {}),
      });
      applyState(response);
    },
    [applyState, flushPatch],
  );

  const clearAll = useCallback(async () => {
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    pendingPatchRef.current = {};
    applyState(EMPTY_GROCERY_STATE);
    tickSequenceRef.current = [];
    setTickSequence([]);
    api.clearGroceryState().catch(() => {});
  }, [applyState]);

  const refreshFromApi = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    await flushPatch();
    await loadFromApi();
  }, [isAuthenticated, loadFromApi, flushPatch]);

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
