/**
 * Hook managing grocery screen state, item aggregation, and persistence.
 *
 * All state is managed by GroceryContext (Firestore-backed, household-level).
 * This hook handles: item aggregation, display formatting, and screen-level UI state.
 */

import { useFocusEffect } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { showAlert, showNotification } from '@/lib/alert';
import { api } from '@/lib/api';
import {
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
  const [removedGeneratedItems, setRemovedGeneratedItems] = useState<
    Set<string>
  >(new Set());
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { t } = useTranslation();
  const { isItemAtHome, activeStoreId } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { recipes } = useAllRecipes();
  const { data: storeOrderData } = useStoreOrder(activeStoreId);

  const filterOutItemsAtHome = useCallback(
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

  // Refresh from Firestore when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      void refreshFromApi().catch(() => {});
    }, [refreshFromApi]),
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

  const handleDeleteItem = useCallback(
    (itemName: string) => {
      const isCustom = contextCustomItems.some((ci) => ci.name === itemName);
      if (isCustom) {
        setContextCustomItems(
          contextCustomItems.filter((ci) => ci.name !== itemName),
        );
      } else {
        setRemovedGeneratedItems((prev) => new Set([...prev, itemName]));
      }
      const newChecked = new Set(checkedItems);
      newChecked.delete(itemName);
      setCheckedItems(newChecked);
    },
    [contextCustomItems, setContextCustomItems, checkedItems, setCheckedItems],
  );

  const handleToggleAddItem = useCallback(() => {
    setShowAddItem((prev) => !prev);
    setDeleteMode(false);
    setReorderMode(false);
  }, []);

  const handleToggleDeleteMode = useCallback(() => {
    setDeleteMode((prev) => !prev);
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

  const handleClearChecked = useCallback(() => {
    if (activeStoreId && tickSequence.length >= MIN_TICK_SEQUENCE_LENGTH) {
      api
        .learnStoreOrder(activeStoreId, { tick_sequence: tickSequence })
        .catch(() => {});
    }
    resetTickSequence();
    clearChecked();
  }, [activeStoreId, tickSequence, resetTickSequence, clearChecked]);

  const handleClearAll = () => {
    const doClear = async () => {
      try {
        await clearAll();
        setGeneratedItems([]);
        setRemovedGeneratedItems(new Set());
        setDeleteMode(false);
        setReorderMode(false);
      } catch {
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(
      t('grocery.clearEntireList'),
      t('grocery.clearEntireListMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
      ],
    );
  };

  const handleClearMealPlanItems = () => {
    const doClear = async () => {
      try {
        const customNames = new Set(contextCustomItems.map((i) => i.name));
        setCheckedItems(
          new Set([...checkedItems].filter((name) => customNames.has(name))),
        );
        await saveSelections([], {});
        setGeneratedItems([]);
        setRemovedGeneratedItems(new Set());
        setDeleteMode(false);
        setReorderMode(false);
      } catch {
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(
      t('grocery.clearMealPlanItems'),
      t('grocery.clearMealPlanItemsMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
      ],
    );
  };

  const handleClearManualItems = () => {
    const doClear = async () => {
      try {
        const generatedNames = new Set(generatedItems.map((i) => i.name));
        setCheckedItems(
          new Set([...checkedItems].filter((name) => generatedNames.has(name))),
        );
        setContextCustomItems([]);
        setDeleteMode(false);
        setReorderMode(false);
      } catch {
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(
      t('grocery.clearManualItems'),
      t('grocery.clearManualItemsMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
      ],
    );
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addCustomItem({ name: newItemText.trim(), category: 'other' });
    setNewItemText('');
  };

  const totalItems = visibleGeneratedItems.length + customItems.length;
  const checkedCount = checkedItems.size;

  const hiddenAtHomeCount = useMemo(
    () =>
      groceryListWithChecked.items.filter(
        (item) => item.recipe_sources.length > 0 && isItemAtHome(item.name),
      ).length,
    [groceryListWithChecked.items, isItemAtHome],
  );

  const itemsToBuy = totalItems - hiddenAtHomeCount;

  const checkedItemsToBuy = useMemo(
    () =>
      groceryListWithChecked.items.filter(
        (item) =>
          !(item.recipe_sources.length > 0 && isItemAtHome(item.name)) &&
          checkedItems.has(item.name),
      ).length,
    [groceryListWithChecked.items, isItemAtHome, checkedItems],
  );

  return {
    isLoading: contextLoading,
    hasLoadedOnce,
    showAddItem,
    setShowAddItem,
    deleteMode,
    reorderMode,
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
    handleItemToggle,
    handleAddItem,
    handleDeleteItem,
    handleToggleAddItem,
    handleToggleDeleteMode,
    handleToggleReorderMode,
    handleReorder,
    handleClearChecked,
    handleClearAll,
    handleClearMealPlanItems,
    handleClearManualItems,
    filterOutItemsAtHome,
  };
};
