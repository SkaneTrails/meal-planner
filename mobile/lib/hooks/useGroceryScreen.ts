/**
 * Hook managing grocery screen state, item aggregation, and persistence.
 *
 * All state is managed by GroceryContext (Firestore-backed, household-level).
 * This hook handles: item aggregation, display formatting, and screen-level UI state.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { showAlert } from '@/lib/alert';
import { api } from '@/lib/api';
import {
  groceryKeys,
  useAllRecipes,
  useGroceryState,
  useMealPlan,
  useStoreOrder,
} from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import type { GroceryItem } from '@/lib/types';
import { aggregateIngredients } from '@/lib/utils/groceryAggregator';

export const useGroceryScreen = () => {
  const {
    checkedItems,
    setCheckedItems,
    clearChecked,
    customItems: contextCustomItems,
    itemOrder,
    selectedMealKeys,
    mealServings,
    addCustomItem,
    setCustomItems: setContextCustomItems,
    setItemOrder,
    tickSequence,
    toggleItem,
    resetTickSequence,
    saveSelections,
    clearAll,
    refreshFromApi,
    isLoading: contextLoading,
  } = useGroceryState();

  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<Set<string>>(
    new Set(),
  );
  const [removedGeneratedItems, setRemovedGeneratedItems] = useState<
    Set<string>
  >(new Set());
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { isItemAtHome, activeStoreId } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { recipes } = useAllRecipes();
  const { data: storeOrderData } = useStoreOrder(activeStoreId);

  const isGeneratedItemAtHome = useCallback(
    (item: GroceryItem) =>
      item.recipe_sources.length > 0 && isItemAtHome(item.name),
    [isItemAtHome],
  );

  // Track when first load completes to avoid skeleton flash on refresh
  useEffect(() => {
    if (!contextLoading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [contextLoading, hasLoadedOnce]);

  // Refresh from Firestore when screen gains focus; reset modes on blur
  useFocusEffect(
    React.useCallback(() => {
      void refreshFromApi().catch(() => {});
      if (activeStoreId) {
        void queryClient.invalidateQueries({
          queryKey: groceryKeys.storeOrder(activeStoreId),
        });
      }
      return () => {
        setDeleteMode(false);
        setDeleteSelection(new Set());
        setReorderMode(false);
        setShowAddItem(false);
      };
    }, [refreshFromApi, activeStoreId, queryClient]),
  );

  // Convert CustomGroceryItem[] from context to GroceryItem[] for display
  const customItems: GroceryItem[] = useMemo(
    () =>
      contextCustomItems.map((ci) => ({
        name: ci.name,
        quantity: null,
        unit: null,
        category: ci.category,
        checked: false,
        recipe_sources: [],
        quantity_sources: [],
      })),
    [contextCustomItems],
  );

  const prevGeneratedItemsLengthRef = useRef(0);
  prevGeneratedItemsLengthRef.current = generatedItems.length;

  useEffect(() => {
    if (!mealPlan || !selectedMealKeys.length) {
      if (prevGeneratedItemsLengthRef.current > 0) {
        setGeneratedItems([]);
      }
      return;
    }

    const items = aggregateIngredients(
      selectedMealKeys,
      mealPlan.meals,
      recipes.map((r) => ({
        id: r.id,
        title: r.title,
        ingredients: r.ingredients,
        servings: r.servings ?? undefined,
      })),
      mealServings,
    );
    setGeneratedItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recipes.length,
    mealPlan?.meals,
    mealPlan,
    recipes,
    mealServings,
    selectedMealKeys,
  ]);

  const visibleGeneratedItems = useMemo(
    () => generatedItems.filter((i) => !removedGeneratedItems.has(i.name)),
    [generatedItems, removedGeneratedItems],
  );

  const groceryListWithChecked = useMemo(() => {
    const allItems = [...visibleGeneratedItems, ...customItems];
    return {
      items: allItems.map((item) => ({
        ...item,
        checked: checkedItems.has(item.name),
      })),
    };
  }, [visibleGeneratedItems, customItems, checkedItems]);

  const uncheckedItems = useMemo(() => {
    const unordered = groceryListWithChecked.items.filter(
      (item) => !item.checked,
    );

    const storeOrder = storeOrderData?.item_order ?? [];
    const effectiveOrder = storeOrder.length > 0 ? storeOrder : itemOrder;

    if (effectiveOrder.length === 0) return unordered;
    const orderIndex = new Map(effectiveOrder.map((name, i) => [name, i]));
    return [...unordered].sort((a, b) => {
      const ai = orderIndex.get(a.name) ?? Number.MAX_SAFE_INTEGER;
      const bi = orderIndex.get(b.name) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }, [groceryListWithChecked.items, itemOrder, storeOrderData]);

  const pickedItems = useMemo(() => {
    const checked = groceryListWithChecked.items.filter((item) => item.checked);
    const tickIndex = new Map(tickSequence.map((name, i) => [name, i]));
    return [...checked].sort(
      (a, b) => (tickIndex.get(a.name) ?? -1) - (tickIndex.get(b.name) ?? -1),
    );
  }, [groceryListWithChecked.items, tickSequence]);

  const handleItemToggle = useCallback(
    (itemName: string, _checked: boolean) => {
      toggleItem(itemName);
    },
    [toggleItem],
  );

  const toggleDeleteItem = useCallback((itemName: string) => {
    setDeleteSelection((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  }, []);

  const handleToggleAddItem = useCallback(() => {
    setShowAddItem((prev) => !prev);
    setDeleteMode(false);
    setReorderMode(false);
  }, []);

  const handleToggleDeleteMode = useCallback(() => {
    setDeleteMode((prev) => !prev);
    setDeleteSelection(new Set());
    setReorderMode(false);
    setShowAddItem(false);
  }, []);

  const handleToggleReorderMode = useCallback(() => {
    setReorderMode((prev) => !prev);
    setDeleteMode(false);
    setShowAddItem(false);
  }, []);

  const handleReorder = useCallback(
    (items: GroceryItem[]) => {
      setItemOrder(items.map((i) => i.name));
    },
    [setItemOrder],
  );

  const MIN_TICK_SEQUENCE_LENGTH = 2;

  const handleClearPicked = useCallback(() => {
    const doClear = () => {
      if (activeStoreId && tickSequence.length >= MIN_TICK_SEQUENCE_LENGTH) {
        api
          .learnStoreOrder(activeStoreId, { tick_sequence: tickSequence })
          .then((response) => {
            queryClient.setQueryData(groceryKeys.storeOrder(activeStoreId), {
              item_order: response.item_order,
            });
          })
          .catch(() => {});
      }

      const pickedNames = new Set(
        [...checkedItems].filter(
          (name) =>
            contextCustomItems.some((ci) => ci.name === name) ||
            visibleGeneratedItems.some((gi) => gi.name === name),
        ),
      );

      setContextCustomItems(
        contextCustomItems.filter((ci) => !pickedNames.has(ci.name)),
      );
      setRemovedGeneratedItems((prev) => {
        const next = new Set(prev);
        for (const name of pickedNames) {
          if (!contextCustomItems.some((ci) => ci.name === name)) {
            next.add(name);
          }
        }
        return next;
      });

      resetTickSequence();
      clearChecked();
    };

    showAlert(t('grocery.clearPicked'), t('grocery.clearPickedMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
    ]);
  }, [
    activeStoreId,
    tickSequence,
    checkedItems,
    contextCustomItems,
    visibleGeneratedItems,
    setContextCustomItems,
    resetTickSequence,
    clearChecked,
    queryClient,
    t,
  ]);

  const handleDeleteSelected = useCallback(() => {
    if (deleteSelection.size === 0) return;

    const doDelete = () => {
      const customToRemove = new Set<string>();
      const generatedToRemove = new Set<string>();

      for (const name of deleteSelection) {
        if (contextCustomItems.some((ci) => ci.name === name)) {
          customToRemove.add(name);
        } else {
          generatedToRemove.add(name);
        }
      }

      if (customToRemove.size > 0) {
        setContextCustomItems(
          contextCustomItems.filter((ci) => !customToRemove.has(ci.name)),
        );
      }
      if (generatedToRemove.size > 0) {
        setRemovedGeneratedItems((prev) => {
          const next = new Set(prev);
          for (const name of generatedToRemove) next.add(name);
          return next;
        });
      }

      const newChecked = new Set(checkedItems);
      for (const name of deleteSelection) newChecked.delete(name);
      setCheckedItems(newChecked);

      setDeleteSelection(new Set());
      setDeleteMode(false);
    };

    showAlert(t('grocery.deleteSelected'), t('grocery.deleteSelectedMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('grocery.deleteSelected'),
        style: 'destructive',
        onPress: doDelete,
      },
    ]);
  }, [
    deleteSelection,
    contextCustomItems,
    checkedItems,
    setContextCustomItems,
    setCheckedItems,
    t,
  ]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addCustomItem({ name: newItemText.trim(), category: 'other' });
    setNewItemText('');
  };

  const totalItems = visibleGeneratedItems.length + customItems.length;
  const checkedCount = checkedItems.size;

  const hiddenAtHomeCount = useMemo(
    () => groceryListWithChecked.items.filter(isGeneratedItemAtHome).length,
    [groceryListWithChecked.items, isGeneratedItemAtHome],
  );

  const itemsToBuy = totalItems - hiddenAtHomeCount;

  const checkedItemsToBuy = useMemo(
    () =>
      groceryListWithChecked.items.filter(
        (item) => !isGeneratedItemAtHome(item) && checkedItems.has(item.name),
      ).length,
    [groceryListWithChecked.items, isGeneratedItemAtHome, checkedItems],
  );

  const mealPlanItemNames = useMemo(
    () => visibleGeneratedItems.map((i) => i.name),
    [visibleGeneratedItems],
  );
  const manualItemNames = useMemo(
    () => customItems.map((i) => i.name),
    [customItems],
  );

  return {
    isLoading: contextLoading,
    hasLoadedOnce,
    showAddItem,
    setShowAddItem,
    deleteMode,
    reorderMode,
    deleteSelection,
    newItemText,
    setNewItemText,
    totalItems,
    checkedCount,
    hiddenAtHomeCount,
    itemsToBuy,
    checkedItemsToBuy,
    uncheckedItems,
    pickedItems,
    groceryListWithChecked,
    mealPlanItemNames,
    manualItemNames,
    handleItemToggle,
    handleAddItem,
    toggleDeleteItem,
    handleToggleAddItem,
    handleToggleDeleteMode,
    handleToggleReorderMode,
    handleReorder,
    handleClearPicked,
    handleDeleteSelected,
    setDeleteSelection,
    filterOutItemsAtHome: isGeneratedItemAtHome,
  };
};
