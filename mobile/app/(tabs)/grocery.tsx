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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { borderRadius, colors, spacing, fontSize, letterSpacing, fontWeight } from '@/lib/theme';
import { useMealPlan, useRecipes, useEnhancedMode, useGroceryState } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { GroceryListView, GradientBackground, BouncingLoader, GroceryListSkeleton } from '@/components';
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

  useEnhancedMode(); // Keep for potential future use with enhanced recipes
  const { isItemAtHome } = useSettings();
  const { data: mealPlan } = useMealPlan();
  // Fetch both enhanced and non-enhanced recipes to ensure we find all recipes regardless of which mode was used when planning
  const { data: enhancedRecipes = [] } = useRecipes(undefined, true);
  const { data: regularRecipes = [] } = useRecipes(undefined, false);

  // Combine both recipe lists, prefer enhanced if available
  const recipes = useMemo(() => {
    const recipeMap = new Map(regularRecipes.map(r => [r.id, r]));
    // Enhanced recipes override regular ones
    enhancedRecipes.forEach(r => recipeMap.set(r.id, r));
    return Array.from(recipeMap.values());
  }, [enhancedRecipes, regularRecipes]);

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
        ? `${recipe.title} (${requestedServings}👤)`
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
        Alert.alert('Error', 'Failed to clear list');
      }
    };

    Alert.alert(
      'Clear Entire List?',
      'This will remove all items from your grocery list, including meal selections and custom items.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: doClear },
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
          <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: fontSize['4xl'],
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
              }}>Grocery List</Text>
            </View>
          </View>
          <GroceryListSkeleton />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontWeight: '600',
              color: colors.text.primary,
              letterSpacing: letterSpacing.tight,
            }}>Grocery List</Text>
          </View>
        </View>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: spacing['2xl'], paddingBottom: spacing.lg }}>
        {/* Stats card */}
        <View style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          marginBottom: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: fontSize.md, color: '#8B7355' }}>This week's shopping</Text>
              <Text style={{
                fontSize: fontSize['3xl'],
                fontWeight: fontWeight.bold,
                color: '#5D4E40',
                marginTop: 4,
              }}>
                {itemsToBuy === 0
                  ? 'No items yet'
                  : `${checkedItemsToBuy} of ${itemsToBuy} items`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {/* Add Item button */}
              <Pressable
                onPress={() => setShowAddItem(!showAddItem)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: borderRadius.sm,
                  backgroundColor: showAddItem ? '#7A6858' : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <Ionicons name={showAddItem ? 'close' : 'add'} size={18} color={showAddItem ? colors.white : '#5D4E40'} />
              </Pressable>

              {/* Clear All button */}
              {totalItems > 0 && (
                <Pressable
                  onPress={handleClearAll}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#5D4E40" />
                </Pressable>
              )}

              {/* Reset checked button */}
              {checkedCount > 0 && (
                <Pressable
                  onPress={handleClearChecked}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#5D4E40" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Progress bar */}
          {itemsToBuy > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ height: 6, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 3, overflow: 'hidden' }}>
                <View
                  style={{ height: '100%', backgroundColor: '#7A6858', borderRadius: 3, width: `${(checkedItemsToBuy / itemsToBuy) * 100}%` }}
                />
              </View>
            </View>
          )}

          {/* Items at home indicator */}
          {hiddenAtHomeCount > 0 && (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: 'rgba(180, 230, 180, 0.7)',
                borderRadius: 10,
                gap: 8,
              }}
            >
              <Ionicons name="home-outline" size={16} color="#3D7A3D" />
              <Text style={{ fontSize: 13, color: '#2D5A2D', flex: 1, fontWeight: '500' }}>
                {hiddenAtHomeCount} item{hiddenAtHomeCount > 1 ? 's' : ''} hidden (at home)
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#3D7A3D" />
            </Pressable>
          )}
        </View>

        {/* Add item input */}
        {showAddItem && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderRadius: borderRadius.md,
            padding: spacing.lg,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#5D4E40', marginBottom: 10 }}>Add custom item</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#5D4E40',
                }}
                placeholder="e.g. Milk, 2 liters"
                placeholderTextColor="#A09080"
                value={newItemText}
                onChangeText={setNewItemText}
                onSubmitEditing={handleAddItem}
                autoFocus
              />
              <Pressable
                onPress={handleAddItem}
                disabled={!newItemText.trim()}
                style={{
                  backgroundColor: newItemText.trim() ? '#7A6858' : 'rgba(200, 190, 180, 0.5)',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>Add</Text>
              </Pressable>
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
          <Text style={{ color: '#5D4E40', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            Your list is empty
          </Text>
          <Text style={{ color: 'rgba(93, 78, 64, 0.7)', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Go to Weekly Menu and tap "Create List" to generate your grocery list from planned meals
          </Text>
        </View>
      )}
      </View>
    </GradientBackground>
  );
}
