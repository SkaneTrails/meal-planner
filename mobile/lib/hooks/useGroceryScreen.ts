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
import { useAllRecipes, useGroceryState, useMealPlan } from '@/lib/hooks';
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
    selectedMealKeys,
    mealServings,
    addCustomItem,
    setCustomItems: setContextCustomItems,
    saveSelections,
    clearAll,
    refreshFromApi,
    isLoading: contextLoading,
  } = useGroceryState();

  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { t } = useTranslation();
  const { isItemAtHome } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { recipes } = useAllRecipes();

  const filterOutItemsAtHome = useCallback(
    (itemName: string) => isItemAtHome(itemName),
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

  const groceryListWithChecked = useMemo(() => {
    const allItems = [...generatedItems, ...customItems];
    return {
      items: allItems.map((item) => ({
        ...item,
        checked: checkedItems.has(item.name),
      })),
    };
  }, [generatedItems, customItems, checkedItems]);

  const handleItemToggle = (itemName: string, checked: boolean) => {
    const newSet = new Set(checkedItems);
    if (checked) {
      newSet.add(itemName);
    } else {
      newSet.delete(itemName);
    }
    setCheckedItems(newSet);
  };

  const handleClearChecked = () => clearChecked();

  const handleClearAll = () => {
    const doClear = async () => {
      try {
        await clearAll();
        setGeneratedItems([]);
        setShowClearMenu(false);
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
        setShowClearMenu(false);
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
        setShowClearMenu(false);
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

  const totalItems = generatedItems.length + customItems.length;
  const checkedCount = checkedItems.size;

  const hiddenAtHomeCount = useMemo(
    () =>
      groceryListWithChecked.items.filter((item) => isItemAtHome(item.name))
        .length,
    [groceryListWithChecked.items, isItemAtHome],
  );

  const itemsToBuy = totalItems - hiddenAtHomeCount;

  const checkedItemsToBuy = useMemo(
    () =>
      groceryListWithChecked.items.filter(
        (item) => !isItemAtHome(item.name) && checkedItems.has(item.name),
      ).length,
    [groceryListWithChecked.items, isItemAtHome, checkedItems],
  );

  return {
    isLoading: contextLoading,
    hasLoadedOnce,
    showAddItem,
    setShowAddItem,
    showClearMenu,
    setShowClearMenu,
    newItemText,
    setNewItemText,
    totalItems,
    checkedCount,
    hiddenAtHomeCount,
    itemsToBuy,
    checkedItemsToBuy,
    groceryListWithChecked,
    handleItemToggle,
    handleAddItem,
    handleClearChecked,
    handleClearAll,
    handleClearMealPlanItems,
    handleClearManualItems,
    filterOutItemsAtHome,
  };
};
