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
import { useMealPlan, useAllRecipes, useGroceryState } from '@/lib/hooks';
import { showAlert, showNotification } from '@/lib/alert';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import { AnimatedPressable, GroceryListView, GradientBackground, GroceryListSkeleton } from '@/components';
import { scaleIngredient, normalizeIngredientName, parseIngredient } from '@/lib/utils/ingredientParser';
import type { GroceryItem } from '@/lib/types';

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
  const { recipes } = useAllRecipes();

  const filterOutItemsAtHome = useCallback((itemName: string) => {
    return isItemAtHome(itemName);
  }, [isItemAtHome]);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const [customData, mealsData, servingsData] = await Promise.all([
            AsyncStorage.getItem('grocery_custom_items'),
            AsyncStorage.getItem('grocery_selected_meals'),
            AsyncStorage.getItem('grocery_meal_servings'),
          ]);

          if (customData) {
            const items = JSON.parse(customData);
            setCustomItems(items);
          } else {
            setCustomItems([]);
          }

          if (mealsData) {
            const meals = JSON.parse(mealsData);
            setSelectedMealKeys(meals);
          } else {
            setSelectedMealKeys([]);
          }

          if (servingsData) {
            const servings = JSON.parse(servingsData);
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

  const prevGeneratedItemsLengthRef = useRef(0);
  prevGeneratedItemsLengthRef.current = generatedItems.length;

  useEffect(() => {
    if (!mealPlan || !selectedMealKeys.length) {
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
      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      if (!recipe) return;

      const requestedServings = mealServings[key] || recipe.servings || 2;
      const recipeServings = recipe.servings || 2;
      const multiplier = requestedServings / recipeServings;

      const sourceLabel = multiplier !== 1
        ? `${recipe.title} (×${requestedServings})`
        : recipe.title;

      recipe.ingredients.forEach((ingredient) => {
        const cleanedIngredient = stripStepReference(ingredient);
        // Scale the ingredient if multiplier is not 1
        const scaledIngredient = scaleIngredient(cleanedIngredient, multiplier);
        const normalizedName = normalizeIngredientName(cleanedIngredient);
        const parsed = parseIngredient(scaledIngredient);

        if (!ingredientsMap.has(normalizedName)) {
          ingredientsMap.set(normalizedName, {
            name: parsed.name, // Just the ingredient name, not the full string
            quantity: parsed.quantity !== null ? String(parsed.quantity) : null,
            unit: parsed.unit,
            category: 'other',
            checked: false,
            recipe_sources: [sourceLabel],
            quantity_sources: [],
          });
        } else {
          // Aggregate quantities for the same ingredient
          const item = ingredientsMap.get(normalizedName)!;
          if (!item.recipe_sources.includes(sourceLabel)) {
            item.recipe_sources.push(sourceLabel);
          }
          // Add quantities if both have them and same unit
          if (parsed.quantity !== null && item.quantity !== null) {
            const existingQty = parseFloat(item.quantity);
            if (!isNaN(existingQty) && parsed.unit === item.unit) {
              const totalQty = existingQty + parsed.quantity;
              item.quantity = String(totalQty);
              // item.name stays as just the ingredient name
            }
          }
        }
      });
    });

    const items = Array.from(ingredientsMap.values());
    setGeneratedItems(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlanMealsJson, recipes.length, selectedMealKeysStr, mealServingsJson]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('grocery_custom_items', JSON.stringify(customItems))
        .catch((error) => console.error('[Grocery] Error saving custom items:', error));
    }
  }, [customItems, isLoading]);

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
    // Cross-platform confirmation
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

  const hiddenAtHomeCount = useMemo(() => {
    return groceryListWithChecked.items.filter(item => isItemAtHome(item.name)).length;
  }, [groceryListWithChecked.items, isItemAtHome]);

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
      <GradientBackground neutral>
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{
              fontSize: fontSize['3xl'],
              fontFamily: fontFamily.display,
              color: '#3D3D3D',
              letterSpacing: letterSpacing.tight,
              textAlign: 'center',
            }}>{t('grocery.title')}</Text>
            <Text style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.body,
              color: 'rgba(93, 78, 64, 0.6)',
              marginTop: 2,
              textAlign: 'center',
            }}>{t('grocery.thisWeeksShopping')}</Text>
          </View>
          <GroceryListSkeleton />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground neutral>
      <View style={{ flex: 1, paddingBottom: 100 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{
          fontSize: fontSize['3xl'],
          fontFamily: fontFamily.display,
          color: '#3D3D3D',
          letterSpacing: letterSpacing.tight,
          textAlign: 'center',
        }}>{t('grocery.title')}</Text>
        <Text style={{
          fontSize: fontSize.md,
          fontFamily: fontFamily.body,
          color: 'rgba(93, 78, 64, 0.6)',
          marginTop: 2,
          textAlign: 'center',
        }}>{t('grocery.thisWeeksShopping')}</Text>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: 20, paddingBottom: spacing.md }}>
        {/* Stats card - off-white surface for stacking effect */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.sm, color: 'rgba(93, 78, 64, 0.7)' }}>{t('grocery.thisWeeksShopping')}</Text>
              {/* Progress text - stronger hierarchy, emotional anchor */}
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#3D3D3D',
                marginTop: 4,
              }}>
                {itemsToBuy === 0
                  ? t('grocery.noItemsYet')
                  : t('grocery.itemsProgress', { checked: checkedItemsToBuy, total: itemsToBuy })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Add Item button - PRIMARY action */}
              <AnimatedPressable
                onPress={() => setShowAddItem(!showAddItem)}
                hoverScale={1.08}
                pressScale={0.95}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: '#6B8E6B',
                }}
              >
                <Ionicons name={showAddItem ? 'close' : 'add'} size={18} color="#FFFFFF" />
              </AnimatedPressable>

              {/* Clear All button - secondary, lower opacity */}
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
                    backgroundColor: 'rgba(93, 78, 64, 0.08)',
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="rgba(93, 78, 64, 0.5)" />
                </AnimatedPressable>
              )}

              {/* Reset checked button - secondary, lower opacity */}
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
                    backgroundColor: 'rgba(93, 78, 64, 0.08)',
                  }}
                >
                  <Ionicons name="refresh" size={16} color="rgba(93, 78, 64, 0.5)" />
                </AnimatedPressable>
              )}
            </View>
          </View>

          {/* Progress bar - thicker with rounded ends */}
          {itemsToBuy > 0 && (
            <View style={{ marginTop: 14 }}>
              <View style={{ height: 6, backgroundColor: 'rgba(107, 142, 107, 0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <View
                  style={{ height: '100%', backgroundColor: '#6B8E6B', borderRadius: 3, width: `${(checkedItemsToBuy / itemsToBuy) * 100}%` }}
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
                backgroundColor: 'rgba(107, 142, 107, 0.15)',
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Ionicons name="home-outline" size={14} color="#6B8E6B" />
              <Text style={{ fontSize: 12, color: '#5A7A5A', flex: 1, fontWeight: '500' }}>
                {t('grocery.hiddenAtHome', { count: hiddenAtHomeCount })}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#3D7A3D" />
            </AnimatedPressable>
          )}
        </View>

        {/* Add item input - clean card on neutral surface */}
        {showAddItem && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 12, fontFamily: fontFamily.bodySemibold, color: 'rgba(93, 78, 64, 0.7)', marginBottom: 8 }}>{t('grocery.addItemLabel')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(93, 78, 64, 0.06)',
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#3D3D3D',
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
                  backgroundColor: newItemText.trim() ? '#6B8E6B' : 'rgba(200, 190, 180, 0.5)',
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
