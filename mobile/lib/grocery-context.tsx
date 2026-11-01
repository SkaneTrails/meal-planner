/**
 * Global grocery state context.
 * Source of truth: Firestore via API. The signed-in user's last known state is kept on the
 * device, so the list shows at once on startup (and offline) while the server copy loads in
 * the background. Ticks are sent one by one (see utils/groceryPatch), so several devices can
 * tick at once; the sync status poll pulls other devices' changes via refreshGroceryFromServer.
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
import { useAuth } from './hooks/use-auth';
import type {
  CustomGroceryItem,
  GroceryListState,
  GroceryListStatePatch,
} from './types';
import {
  addCheckDelta,
  applyPendingChecks,
  isEmptyPatch,
  mergePatches,
} from './utils/groceryPatch';

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

const STORAGE_KEYS = {
  checked: 'grocery_checked_items',
  custom: 'grocery_custom_items',
  meals: 'grocery_selected_meals',
  servings: 'grocery_meal_servings',
  order: 'grocery_item_order',
  removed: 'grocery_removed_items',
  ticks: 'grocery_tick_sequence',
} as const;

type StorageField = keyof typeof STORAGE_KEYS;

/** Kept per user, so nobody sees another user's list on a shared device. */
export const groceryStorageKey = (field: StorageField, uid: string) =>
  `${STORAGE_KEYS[field]}:${uid}`;

const storeField = (
  uid: string | undefined,
  field: StorageField,
  value: unknown,
) => {
  if (!uid) return;
  AsyncStorage.setItem(
    groceryStorageKey(field, uid),
    JSON.stringify(value),
  ).catch(() => {});
};

const cacheState = (uid: string, state: GroceryListState) => {
  storeField(uid, 'checked', state.checked_items);
  storeField(uid, 'custom', state.custom_items || []);
  storeField(uid, 'meals', state.selected_meals || []);
  storeField(uid, 'servings', state.meal_servings || {});
  storeField(uid, 'order', state.item_order || []);
  storeField(uid, 'removed', state.removed_items || []);
};

// Device copy of app versions before it was kept per user.
const removeLegacyCache = () =>
  Promise.all(
    Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key)),
  ).catch(() => {});

const removeDeviceCopy = (uid: string) =>
  Promise.all(
    (Object.keys(STORAGE_KEYS) as StorageField[]).map((field) =>
      AsyncStorage.removeItem(groceryStorageKey(field, uid)),
    ),
  ).catch(() => {});

const normalizeCustomItems = (raw: unknown[]): CustomGroceryItem[] =>
  raw.map((item) =>
    typeof item === 'string'
      ? { name: item, category: 'other' as const }
      : (item as CustomGroceryItem),
  );

const loadFromAsyncStorage = async (
  uid: string,
): Promise<GroceryListState | null> => {
  const [
    checkedData,
    customData,
    mealsData,
    servingsData,
    orderData,
    removedData,
    tickData,
  ] = await Promise.all(
    (Object.keys(STORAGE_KEYS) as StorageField[]).map((field) =>
      AsyncStorage.getItem(groceryStorageKey(field, uid)),
    ),
  );
  const cachedFields = [
    checkedData,
    customData,
    mealsData,
    servingsData,
    orderData,
    removedData,
  ];
  if (cachedFields.every((value) => value === null)) {
    return null;
  }

  const rawCustom = safeJsonParse<unknown>(customData ?? '[]', []);

  return {
    checked_items: safeJsonParse(checkedData ?? '[]', []),
    custom_items: Array.isArray(rawCustom)
      ? normalizeCustomItems(rawCustom)
      : [],
    selected_meals: safeJsonParse(mealsData ?? '[]', []),
    meal_servings: safeJsonParse(servingsData ?? '{}', {}),
    item_order: safeJsonParse(orderData ?? '[]', []),
    removed_items: safeJsonParse(removedData ?? '[]', []),
    tick_sequence: safeJsonParse(tickData ?? '[]', []),
  };
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

let serverRefresh: (() => Promise<void>) | null = null;
let scopeReset: (() => void) | null = null;

/**
 * Pull the server's grocery state into the open app (sync status poll). Rejects when it could
 * not be applied (a change is still being saved, or the request failed), so it is retried.
 */
export const refreshGroceryFromServer = async (): Promise<void> => {
  await serverRefresh?.();
};

/**
 * Forget the list of the previous household or role: shown state, unsent changes, the device
 * copy, and the results of writes still on their way. The sync poll then loads the new one.
 */
export const resetGroceryForNewScope = (): void => {
  scopeReset?.();
};

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const [checkedItems, setCheckedItemsState] = useState<Set<string>>(new Set());
  const [customItems, setCustomItemsState] = useState<CustomGroceryItem[]>([]);
  const [itemOrder, setItemOrderState] = useState<string[]>([]);
  const [removedItems, setRemovedItemsState] = useState<string[]>([]);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<GroceryListStatePatch>({});
  const patchesInFlightRef = useRef(0);
  // Writes run one after another, so an older change can never land after a newer one.
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());
  // Replaced when the user or household changes; results of writes made for the old one are dropped.
  const writeScopeRef = useRef<object>({});
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

  const applyTicks = useCallback(
    (ticks: string[], checked: readonly string[]) => {
      const checkedSet = new Set(checked);
      const reconciled = ticks.filter((t) => checkedSet.has(t));
      tickSequenceRef.current = reconciled;
      setTickSequence(reconciled);
    },
    [],
  );

  /** Show the server's state with changes that are not saved yet on top, and keep a copy. */
  const applyServerState = useCallback(
    (state: GroceryListState): GroceryListState => {
      const pending = pendingPatchRef.current;
      const effective: GroceryListState = {
        ...state,
        ...pending,
        checked_items: applyPendingChecks(state.checked_items, pending),
      };
      applyState(effective);
      if (userIdRef.current) cacheState(userIdRef.current, effective);
      return effective;
    },
    [applyState],
  );

  const enqueueWrite = useCallback((write: () => Promise<void>) => {
    const run = writeChainRef.current.then(write);
    writeChainRef.current = run.catch(() => {});
    return run;
  }, []);

  /** Send the unsent changes as they are when the write's turn comes. Never rejects. */
  const sendPending = useCallback(async () => {
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = {};
    if (isEmptyPatch(patch)) return;
    const scope = writeScopeRef.current;
    patchesInFlightRef.current += 1;
    try {
      const response = await api.patchGroceryState(patch);
      if (!isMountedRef.current || writeScopeRef.current !== scope) return;
      applyServerState(response);
    } catch (err) {
      if (writeScopeRef.current !== scope) return;
      console.warn('[GroceryContext] Patch failed, will retry:', err);
      pendingPatchRef.current = mergePatches(patch, pendingPatchRef.current);
    } finally {
      patchesInFlightRef.current -= 1;
    }
  }, [applyServerState]);

  const flushPatch = useCallback(
    (): Promise<void> => enqueueWrite(sendPending),
    [enqueueWrite, sendPending],
  );

  const scheduleFlush = useCallback(() => {
    if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    patchTimerRef.current = setTimeout(flushPatch, DEBOUNCE_MS);
  }, [flushPatch]);

  const enqueuePatch = useCallback(
    (fields: GroceryListStatePatch) => {
      pendingPatchRef.current = mergePatches(pendingPatchRef.current, fields);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const enqueueCheck = useCallback(
    (item: string, checked: boolean) => {
      pendingPatchRef.current = addCheckDelta(
        pendingPatchRef.current,
        item,
        checked,
      );
      scheduleFlush();
    },
    [scheduleFlush],
  );

  /**
   * Load the server's state; throws when it can't, so callers decide how to degrade. A response
   * that arrives after the user or household changed is discarded and rejects, so it is not
   * mistaken for a successful sync.
   */
  const fetchFromServer = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) throw new Error('Not signed in');
    const scope = writeScopeRef.current;
    const isStale = () =>
      userIdRef.current !== uid || writeScopeRef.current !== scope;
    const state = await api.getGroceryState();
    if (!isMountedRef.current) return;
    if (isStale()) throw new Error('Grocery list changed owner while loading');
    const effective = applyServerState(state);
    const tickData = await AsyncStorage.getItem(
      groceryStorageKey('ticks', uid),
    );
    if (isStale()) throw new Error('Grocery list changed owner while loading');
    applyTicks(
      safeJsonParse<string[]>(tickData ?? '[]', []),
      effective.checked_items,
    );
  }, [applyServerState, applyTicks]);

  const loadFromCache = useCallback(
    async (uid: string): Promise<boolean> => {
      let cached: GroceryListState | null;
      try {
        cached = await loadFromAsyncStorage(uid);
      } catch {
        return false;
      }
      if (!cached || userIdRef.current !== uid) return false;
      applyState(cached);
      applyTicks(cached.tick_sequence ?? [], cached.checked_items);
      return true;
    },
    [applyState, applyTicks],
  );

  const resetState = useCallback(() => {
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    pendingPatchRef.current = {};
    writeScopeRef.current = {};
    applyState({
      selected_meals: [],
      meal_servings: {},
      checked_items: [],
      custom_items: [],
      item_order: [],
      removed_items: [],
    });
    applyTicks([], []);
  }, [applyState, applyTicks]);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    resetState();
    setIsLoading(true);
    removeLegacyCache();
    void (async () => {
      if ((await loadFromCache(userId)) && !cancelled) setIsLoading(false);
      try {
        await fetchFromServer();
      } catch {
        // Offline or server unavailable: keep showing the device copy.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, resetState, loadFromCache, fetchFromServer]);

  useEffect(() => {
    serverRefresh = async () => {
      if (patchesInFlightRef.current > 0) {
        throw new Error('A grocery change is still being saved');
      }
      await fetchFromServer();
    };
    scopeReset = () => {
      resetState();
      const uid = userIdRef.current;
      if (uid) removeDeviceCopy(uid);
    };
    return () => {
      serverRefresh = null;
      scopeReset = null;
    };
  }, [fetchFromServer, resetState]);

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
      storeField(userIdRef.current, 'checked', arr);
      enqueuePatch({ checked_items: arr });
    },
    [enqueuePatch],
  );

  const toggleItem = useCallback(
    (itemName: string) => {
      setCheckedItemsState((prev) => {
        const newSet = new Set(prev);
        const checked = !newSet.has(itemName);
        const updated = checked
          ? // Track tick order for store layout learning
            [...tickSequenceRef.current, itemName]
          : tickSequenceRef.current.filter((n) => n !== itemName);
        if (checked) {
          newSet.add(itemName);
        } else {
          newSet.delete(itemName);
        }
        tickSequenceRef.current = updated;
        setTickSequence(updated);
        storeField(userIdRef.current, 'ticks', updated);
        checkedRef.current = newSet;
        storeField(userIdRef.current, 'checked', Array.from(newSet));
        enqueueCheck(itemName, checked);
        return newSet;
      });
    },
    [enqueueCheck],
  );

  const clearChecked = useCallback(() => {
    setCheckedItemsState(new Set());
    checkedRef.current = new Set();
    storeField(userIdRef.current, 'checked', []);
    enqueuePatch({ checked_items: [] });
  }, [enqueuePatch]);

  const resetTickSequence = useCallback(() => {
    tickSequenceRef.current = [];
    setTickSequence([]);
    const uid = userIdRef.current;
    if (uid) {
      AsyncStorage.removeItem(groceryStorageKey('ticks', uid)).catch(() => {});
    }
  }, []);

  const addCustomItem = useCallback(
    (item: CustomGroceryItem) => {
      setCustomItemsState((prev) => {
        const updated = [...prev, item];
        customItemsRef.current = updated;
        storeField(userIdRef.current, 'custom', updated);
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
      storeField(userIdRef.current, 'custom', items);
      enqueuePatch({ custom_items: items });
    },
    [enqueuePatch],
  );

  const setItemOrder = useCallback(
    (order: string[]) => {
      setItemOrderState(order);
      itemOrderRef.current = order;
      storeField(userIdRef.current, 'order', order);
      enqueuePatch({ item_order: order });
    },
    [enqueuePatch],
  );

  const setRemovedItems = useCallback(
    (items: string[]) => {
      const deduped = [...new Set(items)];
      setRemovedItemsState(deduped);
      removedItemsRef.current = deduped;
      storeField(userIdRef.current, 'removed', deduped);
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
      const scope = writeScopeRef.current;
      setSelectedMealKeys(meals);
      setMealServings(servings);
      storeField(userIdRef.current, 'meals', meals);
      storeField(userIdRef.current, 'servings', servings);

      await enqueueWrite(async () => {
        await sendPending();
        if (writeScopeRef.current !== scope) return;
        patchesInFlightRef.current += 1;
        try {
          const response = await api.patchGroceryState({
            selected_meals: meals,
            meal_servings: servings,
            ...(removedItemsOverride !== undefined
              ? { removed_items: removedItemsOverride }
              : {}),
          });
          if (!isMountedRef.current || writeScopeRef.current !== scope) return;
          applyServerState(response);
        } finally {
          patchesInFlightRef.current -= 1;
        }
      });
    },
    [applyServerState, enqueueWrite, sendPending],
  );

  const clearAll = useCallback(async () => {
    resetState();
    const scope = writeScopeRef.current;
    const uid = userIdRef.current;
    if (uid) await removeDeviceCopy(uid);
    // Queued behind other writes: by then another user may have signed in.
    enqueueWrite(async () => {
      if (writeScopeRef.current !== scope || userIdRef.current !== uid) return;
      await api.clearGroceryState();
    }).catch(() => {});
  }, [enqueueWrite, resetState]);

  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    if (patchTimerRef.current) {
      clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    await flushPatch();
    try {
      await fetchFromServer();
    } catch {
      // Keep what is shown; the next refresh or sync poll tries again.
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromServer, flushPatch]);

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
