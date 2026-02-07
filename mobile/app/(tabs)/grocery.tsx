/**
 * Grocery screen - Shopping list from meal plan.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { borderRadius, colors, spacing, fontSize, letterSpacing, fontWeight, fontFamily } from '@/lib/theme';
import { useMealPlan, useRecipes, useGroceryState } from '@/lib/hooks';
import { showAlert, showNotification } from '@/lib/alert';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import { AnimatedPressable, GroceryListView, GradientBackground, BouncingLoader, GroceryListSkeleton } from '@/components';
import type { GroceryItem } from '@/lib/types';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(): { start: string; end: string } {
  const today = new Date();
  const currentDay = today.getDay();
  // Calculate days since Saturday
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    start: formatDateLocal(saturday),
    end: formatDateLocal(friday),
  };
}

export default function GroceryScreen() {
  const router = useRouter();
  const { checkedItems, setCheckedItems, clearChecked, refreshFromStorage } = useGroceryState();
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({}); // key -> servings
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { t } = useTranslation();
  const { isItemAtHome } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { data: recipes = [] } = useRecipes();

  // Filter function to hide items that are "at home"
  const filterOutItemsAtHome = useCallback((itemName: string) => {
    return isItemAtHome(itemName);
  }, [isItemAtHome]);

  // Load data from AsyncStorage whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          console.log('[Grocery] Screen focused, loading data...');
          const [customData, mealsData, servingsData] = await Promise.all([
            AsyncStorage.getItem('grocery_custom_items'),
            AsyncStorage.getItem('grocery_selected_meals'),
            AsyncStorage.getItem('grocery_meal_servings'),
          ]);

          console.log('[Grocery] Raw data from storage:', { customData, mealsData, servingsData });

          if (customData) {
            const items = JSON.parse(customData);
            console.log('[Grocery] Loaded custom items:', items.length);
            setCustomItems(items);
          } else {
            setCustomItems([]);
          }

          if (mealsData) {
            const meals = JSON.parse(mealsData);
            console.log('[Grocery] Loaded selected meals:', meals);
            setSelectedMealKeys(meals);
          } else {
            setSelectedMealKeys([]);
          }

          if (servingsData) {
            const servings = JSON.parse(servingsData);
            console.log('[Grocery] Loaded meal servings:', servings);
            setMealServings(servings);
          } else {
            setMealServings({});
          }
        } catch (error) {
          console.error('[Grocery] Error loading data:', error);
        } finally {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      };

      loadData();
    }, []) // Empty deps - only run once on mount/focus
  );

  // Fallback: ensure loading state is cleared even if useFocusEffect doesn't fire
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasLoadedOnce) {
        console.log('[Grocery] Fallback: clearing loading state');
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isLoading, hasLoadedOnce]);

  // Memoize serialized values to prevent infinite loops
  const mealPlanMealsJson = useMemo(() => JSON.stringify(mealPlan?.meals || {}), [mealPlan?.meals]);
  const mealServingsJson = useMemo(() => JSON.stringify(mealServings), [mealServings]);
  const selectedMealKeysStr = useMemo(() => selectedMealKeys.join(','), [selectedMealKeys]);

  // Track if we need to clear items
  const prevGeneratedItemsLengthRef = useRef(0);
  prevGeneratedItemsLengthRef.current = generatedItems.length;

  // Generate grocery items from selected meals
  useEffect(() => {
    console.log('[Grocery] Generate effect:', {
      hasMealPlan: !!mealPlan,
      selectedMealKeysLength: selectedMealKeys.length,
      recipesLength: recipes.length,
    });

    if (!mealPlan || !selectedMealKeys.length) {
      // Only update if there are items to clear
      if (prevGeneratedItemsLengthRef.current > 0) {
        setGeneratedItems([]);
      }
      return;
    }

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const ingredientsMap = new Map<string, GroceryItem>();

    // Helper to strip step references like "(steg 2)", "(step 3)", "till stekning", "till smör", etc.
    const stripStepReference = (text: string): string => {
      return text
        .replace(/\s*\(steg\s*\d+\)\s*$/i, '')  // (steg 2)
        .replace(/\s*\(step\s*\d+\)\s*$/i, '')  // (step 2)
        .replace(/\s+till\s+\w+$/i, '')          // till stekning, till smör, etc.
        .trim();
    };

    selectedMealKeys.forEach((key) => {
      const recipeId = mealPlan.meals[key];
      console.log(`[Grocery] Processing key: ${key}, recipeId: ${recipeId}`);

      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      console.log(`[Grocery] Found recipe:`, recipe?.title, `with ${recipe?.ingredients.length} ingredients`);

      if (!recipe) return;

      // Calculate servings multiplier
      const requestedServings = mealServings[key] || recipe.servings || 2;
      const recipeServings = recipe.servings || 2;
      const multiplier = requestedServings / recipeServings;

      // Format source with servings info
      const sourceLabel = multiplier !== 1
        ? `${recipe.title} (×${requestedServings})`
        : recipe.title;

      recipe.ingredients.forEach((ingredient) => {
        // Strip step references for grouping key
        const cleanedIngredient = stripStepReference(ingredient);
        const name = cleanedIngredient.toLowerCase().trim();

        if (!ingredientsMap.has(name)) {
          ingredientsMap.set(name, {
            name: cleanedIngredient, // Use cleaned name without step reference
            quantity: null,
            unit: null,
            category: 'other',
            checked: false,
            recipe_sources: [sourceLabel],
            quantity_sources: [],
          });
        } else {
          // Add this recipe to the sources
          const item = ingredientsMap.get(name)!;
          if (!item.recipe_sources.includes(sourceLabel)) {
            item.recipe_sources.push(sourceLabel);
          }
        }
      });
    });

    const items = Array.from(ingredientsMap.values());
    console.log('[Grocery] Generated items:', items.length);
    setGeneratedItems(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlanMealsJson, recipes.length, selectedMealKeysStr, mealServingsJson]);

  // Save custom items to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('grocery_custom_items', JSON.stringify(customItems))
        .then(() => console.log('[Grocery] Saved custom items:', customItems.length))
        .catch((error) => console.error('[Grocery] Error saving custom items:', error));
    }
  }, [customItems, isLoading]);

  // Combine generated and custom items
  const groceryListWithChecked = useMemo(() => {
    const allItems = [...generatedItems, ...customItems];

    return {
      user_id: 'default',
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

  const handleClearChecked = () => {
    clearChecked();
  };

  const handleClearAll = async () => {
    console.log('[Grocery] Clear button clicked!');

    // Cross-platform confirmation
    const doClear = async () => {
      try {
        console.log('[Grocery] Clearing all data...');
        await Promise.all([
          AsyncStorage.removeItem('grocery_selected_meals'),
          AsyncStorage.removeItem('grocery_custom_items'),
          AsyncStorage.removeItem('grocery_checked_items'),
        ]);

        setCustomItems([]);
        setGeneratedItems([]);
        setSelectedMealKeys([]);
        clearChecked();

        console.log('[Grocery] All data cleared');
      } catch (error) {
        console.error('[Grocery] Error clearing data:', error);
        showNotification(t('common.error'), t('grocery.failedToClearList'));
      }
    };

    showAlert(
      t('grocery.clearEntireList'),
      t('grocery.clearEntireListMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('grocery.clear'), style: 'destructive', onPress: doClear },
      ]
    );
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
    setShowAddItem(false);
  };

  const totalItems = generatedItems.length + customItems.length;
  const checkedCount = checkedItems.size;

  // Count items that are filtered out (at home)
  const hiddenAtHomeCount = useMemo(() => {
    return groceryListWithChecked.items.filter(item => isItemAtHome(item.name)).length;
  }, [groceryListWithChecked.items, isItemAtHome]);

  // Items to buy = total - at home items
  const itemsToBuy = totalItems - hiddenAtHomeCount;
  // Checked items that are not at home (for progress display)
  const checkedItemsToBuy = useMemo(() => {
    return groceryListWithChecked.items.filter(item =>
      !isItemAtHome(item.name) && checkedItems.has(item.name)
    ).length;
  }, [groceryListWithChecked.items, isItemAtHome, checkedItems]);

  // Show skeleton on initial load only (not on subsequent focus events)
  if (isLoading && !hasLoadedOnce) {
    return (
      <GradientBackground>
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 44, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: fontSize['4xl'],
                fontFamily: fontFamily.display,
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
              }}>{t('grocery.title')}</Text>
            </View>
          </View>
          <GroceryListSkeleton />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingBottom: 100 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 44, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontFamily: fontFamily.display,
              color: colors.text.primary,
              letterSpacing: letterSpacing.tight,
            }}>{t('grocery.title')}</Text>
          </View>
        </View>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        {/* Stats card */}
        <View style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: fontSize.sm, color: '#8B7355' }}>{t('grocery.thisWeeksShopping')}</Text>
              <Text style={{
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                color: '#5D4E40',
                marginTop: 2,
              }}>
                {itemsToBuy === 0
                  ? t('grocery.noItemsYet')
                  : t('grocery.itemsProgress', { checked: checkedItemsToBuy, total: itemsToBuy })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {/* Add Item button */}
              <AnimatedPressable
                onPress={() => setShowAddItem(!showAddItem)}
                hoverScale={1.08}
                pressScale={0.95}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: borderRadius.sm,
                  backgroundColor: showAddItem ? '#7A6858' : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <Ionicons name={showAddItem ? 'close' : 'add'} size={16} color={showAddItem ? colors.white : '#5D4E40'} />
              </AnimatedPressable>

              {/* Clear All button */}
              {totalItems > 0 && (
                <AnimatedPressable
                  onPress={handleClearAll}
                  hoverScale={1.08}
                  pressScale={0.95}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#5D4E40" />
                </AnimatedPressable>
              )}

              {/* Reset checked button */}
              {checkedCount > 0 && (
                <AnimatedPressable
                  onPress={handleClearChecked}
                  hoverScale={1.08}
                  pressScale={0.95}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#5D4E40" />
                </AnimatedPressable>
              )}
            </View>
          </View>

          {/* Progress bar */}
          {itemsToBuy > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ height: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 2, overflow: 'hidden' }}>
                <View
                  style={{ height: '100%', backgroundColor: '#7A6858', borderRadius: 2, width: `${(checkedItemsToBuy / itemsToBuy) * 100}%` }}
                />
              </View>
            </View>
          )}

          {/* Items at home indicator */}
          {hiddenAtHomeCount > 0 && (
            <AnimatedPressable
              onPress={() => router.push('/settings')}
              hoverScale={1.02}
              pressScale={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: 'rgba(180, 230, 180, 0.7)',
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Ionicons name="home-outline" size={14} color="#3D7A3D" />
              <Text style={{ fontSize: 12, color: '#2D5A2D', flex: 1, fontWeight: '500' }}>
                {t('grocery.hiddenAtHome', { count: hiddenAtHomeCount })}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#3D7A3D" />
            </AnimatedPressable>
          )}
        </View>

        {/* Add item input */}
        {showAddItem && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderRadius: borderRadius.md,
            padding: spacing.md,
          }}>
            <Text style={{ fontSize: 12, fontFamily: fontFamily.bodySemibold, color: '#5D4E40', marginBottom: 8 }}>{t('grocery.addItemLabel')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#5D4E40',
                }}
                placeholder={t('grocery.addItemExamplePlaceholder')}
                placeholderTextColor="#A09080"
                value={newItemText}
                onChangeText={setNewItemText}
                onSubmitEditing={handleAddItem}
                autoFocus
              />
              <AnimatedPressable
                onPress={handleAddItem}
                disabled={!newItemText.trim()}
                hoverScale={1.05}
                pressScale={0.95}
                disableAnimation={!newItemText.trim()}
                style={{
                  backgroundColor: newItemText.trim() ? '#7A6858' : 'rgba(200, 190, 180, 0.5)',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: fontFamily.bodySemibold, color: colors.white }}>{t('grocery.addButton')}</Text>
              </AnimatedPressable>
            </View>
          </View>
        )}
      </View>

      {/* Grocery list */}
      {totalItems > 0 ? (
        <GroceryListView
          groceryList={groceryListWithChecked}
          onItemToggle={handleItemToggle}
          filterOutItems={filterOutItemsAtHome}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#5D4E40', fontSize: 18, fontFamily: fontFamily.bodySemibold, textAlign: 'center' }}>
            {t('grocery.emptyList')}
          </Text>
          <Text style={{ color: 'rgba(93, 78, 64, 0.7)', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            {t('grocery.goToMealPlan')}
          </Text>
        </View>
      )}
      </View>
    </GradientBackground>
  );
}
