/**
 * Hook managing grocery screen state, item aggregation, and persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showAlert, showNotification } from '@/lib/alert';
import { useAllRecipes, useGroceryState, useMealPlan } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import type { GroceryItem } from '@/lib/types';
import { aggregateIngredients } from '@/lib/utils/groceryAggregator';

export const useGroceryScreen = () => {
  const { checkedItems, setCheckedItems, clearChecked } = useGroceryState();
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({});
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { t } = useTranslation();
  const { isItemAtHome } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { recipes } = useAllRecipes();

  const filterOutItemsAtHome = useCallback(
    (itemName: string) => isItemAtHome(itemName),
    [isItemAtHome],
  );

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const [customData, mealsData, servingsData] = await Promise.all([
            AsyncStorage.getItem('grocery_custom_items'),
            AsyncStorage.getItem('grocery_selected_meals'),
            AsyncStorage.getItem('grocery_meal_servings'),
          ]);

          setCustomItems(customData ? JSON.parse(customData) : []);
          setSelectedMealKeys(mealsData ? JSON.parse(mealsData) : []);
          setMealServings(servingsData ? JSON.parse(servingsData) : {});
        } catch (error) {
          if (__DEV__) {
            console.error('[Grocery] Error loading data:', error);
          }
        } finally {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      };

      loadData();
    }, []),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasLoadedOnce) {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isLoading, hasLoadedOnce]);

  const mealPlanMealsJson = useMemo(
    () => JSON.stringify(mealPlan?.meals || {}),
    [mealPlan?.meals],
  );
  const mealServingsJson = useMemo(
    () => JSON.stringify(mealServings),
    [mealServings],
  );
  const selectedMealKeysStr = useMemo(
    () => selectedMealKeys.join(','),
    [selectedMealKeys],
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
      recipes,
      mealServings,
    );
    setGeneratedItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlanMealsJson, recipes.length, selectedMealKeysStr, mealServingsJson]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(
        'grocery_custom_items',
        JSON.stringify(customItems),
      ).catch((error) =>
        __DEV__ && console.error('[Grocery] Error saving custom items:', error),
      );
    }
  }, [customItems, isLoading]);

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
        await Promise.all([
          AsyncStorage.removeItem('grocery_selected_meals'),
          AsyncStorage.removeItem('grocery_custom_items'),
          AsyncStorage.removeItem('grocery_checked_items'),
        ]);
        setCustomItems([]);
        setGeneratedItems([]);
        setSelectedMealKeys([]);
        clearChecked();
        setShowClearMenu(false);
      } catch (error) {
        if (__DEV__) {
          console.error('[Grocery] Error clearing data:', error);
        }
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(t('grocery.clearEntireList'), t('grocery.clearEntireListMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
    ]);
  };

  const handleClearMealPlanItems = () => {
    const doClear = async () => {
      try {
        await Promise.all([
          AsyncStorage.removeItem('grocery_selected_meals'),
          AsyncStorage.removeItem('grocery_meal_servings'),
        ]);
        const customNames = new Set(customItems.map((i) => i.name));
        setCheckedItems(
          new Set([...checkedItems].filter((name) => customNames.has(name))),
        );
        setGeneratedItems([]);
        setSelectedMealKeys([]);
        setMealServings({});
        setShowClearMenu(false);
      } catch (error) {
        if (__DEV__) {
          console.error('[Grocery] Error clearing meal plan items:', error);
        }
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(t('grocery.clearMealPlanItems'), t('grocery.clearMealPlanItemsMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
    ]);
  };

  const handleClearManualItems = () => {
    const doClear = async () => {
      try {
        await AsyncStorage.removeItem('grocery_custom_items');
        const generatedNames = new Set(generatedItems.map((i) => i.name));
        setCheckedItems(
          new Set([...checkedItems].filter((name) => generatedNames.has(name))),
        );
        setCustomItems([]);
        setShowClearMenu(false);
      } catch (error) {
        if (__DEV__) {
          console.error('[Grocery] Error clearing manual items:', error);
        }
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(t('grocery.clearManualItems'), t('grocery.clearManualItemsMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
    ]);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const newItem: GroceryItem = {
      name: newItemText.trim(),
      quantity: null,
      unit: null,
      category: 'other',
      checked: false,
      recipe_sources: [],
      quantity_sources: [],
    };

    setCustomItems((prev) => [...prev, newItem]);
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
    isLoading,
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
