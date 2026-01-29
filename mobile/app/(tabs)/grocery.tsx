/**
 * Grocery screen - Shopping list from meal plan.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGroceryList, useMealPlan, useRecipes } from '@/lib/hooks';
import { GroceryListView, GradientBackground, BouncingLoader } from '@/components';
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
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: mealPlan } = useMealPlan();
  const { data: recipes = [] } = useRecipes();

  // Load data from AsyncStorage whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          console.log('[Grocery] Screen focused, loading data...');
          const [customData, mealsData] = await Promise.all([
            AsyncStorage.getItem('grocery_custom_items'),
            AsyncStorage.getItem('grocery_selected_meals'),
          ]);

          console.log('[Grocery] Raw data from storage:', { customData, mealsData });

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
        } catch (error) {
          console.error('[Grocery] Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [])
  );

  // Generate grocery items from selected meals
  useEffect(() => {
    console.log('[Grocery] Generate effect:', {
      hasMealPlan: !!mealPlan,
      selectedMealKeysLength: selectedMealKeys.length,
      recipesLength: recipes.length,
      mealPlanMeals: mealPlan?.meals,
    });

    if (!mealPlan || !selectedMealKeys.length) {
      setGeneratedItems([]);
      return;
    }

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const ingredientsMap = new Map<string, GroceryItem>();

    selectedMealKeys.forEach((key) => {
      const recipeId = mealPlan.meals[key];
      console.log(`[Grocery] Processing key: ${key}, recipeId: ${recipeId}`);

      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      console.log(`[Grocery] Found recipe:`, recipe?.title, `with ${recipe?.ingredients.length} ingredients`);

      if (!recipe) return;

      recipe.ingredients.forEach((ingredient) => {
        const name = ingredient.toLowerCase().trim();
        if (!ingredientsMap.has(name)) {
          ingredientsMap.set(name, {
            name: ingredient,
            quantity: null,
            unit: null,
            category: 'other',
            checked: false,
            recipe_sources: [recipe.title],
            quantity_sources: [],
          });
        } else {
          // Add this recipe to the sources
          const item = ingredientsMap.get(name)!;
          if (!item.recipe_sources.includes(recipe.title)) {
            item.recipe_sources.push(recipe.title);
          }
        }
      });
    });

    const items = Array.from(ingredientsMap.values());
    console.log('[Grocery] Generated items:', items.length);
    setGeneratedItems(items);
  }, [mealPlan, recipes, selectedMealKeys]);

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
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemName);
      } else {
        newSet.delete(itemName);
      }
      return newSet;
    });
  };

  const handleClearChecked = () => {
    setCheckedItems(new Set());
  };

  const handleClearAll = async () => {
    console.log('[Grocery] Clear button clicked!');

    // Use window.confirm for web instead of Alert.alert
    const confirmed = confirm('Clear Entire List?\n\nThis will remove all items from your grocery list, including meal selections and custom items.');

    if (!confirmed) {
      console.log('[Grocery] User cancelled');
      return;
    }

    try {
      console.log('[Grocery] Clearing all data...');
      await Promise.all([
        AsyncStorage.removeItem('grocery_selected_meals'),
        AsyncStorage.removeItem('grocery_custom_items'),
      ]);

      setCustomItems([]);
      setGeneratedItems([]);
      setSelectedMealKeys([]);
      setCheckedItems(new Set());

      console.log('[Grocery] All data cleared');
    } catch (error) {
      console.error('[Grocery] Error clearing data:', error);
      alert('Error: Failed to clear list');
    }
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

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="cart-outline" size={22} color="#4A3728" />
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#4A3728', marginLeft: 8 }}>Grocery List</Text>
        </View>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>This week's shopping</Text>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#4A3728' }}>
              {totalItems === 0
                ? 'No items'
                : `${checkedCount} of ${totalItems} items`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Add Item button */}
            <Pressable
              onPress={() => setShowAddItem(!showAddItem)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: showAddItem ? '#4A3728' : '#fff' }}
            >
              <Ionicons name="add" size={16} color={showAddItem ? '#fff' : '#4A3728'} />
              <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: '600', color: showAddItem ? '#fff' : '#4A3728' }}>Add</Text>
            </Pressable>

            {/* Clear All button */}
            {totalItems > 0 && (
              <Pressable
                onPress={handleClearAll}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff' }}
              >
                <Ionicons name="trash-outline" size={16} color="#4A3728" />
                <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#4A3728' }}>Clear</Text>
              </Pressable>
            )}

            {/* Reset checked button */}
            {checkedCount > 0 && (
              <Pressable
                onPress={handleClearChecked}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff' }}
              >
                <Ionicons name="refresh" size={16} color="#4A3728" />
                <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#4A3728' }}>Reset</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Add item input */}
        {showAddItem && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#4A3728' }}
                placeholder="e.g. Milk, 2 liters"
                placeholderTextColor="#9ca3af"
                value={newItemText}
                onChangeText={setNewItemText}
                onSubmitEditing={handleAddItem}
                autoFocus
              />
              <Pressable
                onPress={handleAddItem}
                disabled={!newItemText.trim()}
                style={{ backgroundColor: newItemText.trim() ? '#4A3728' : '#E8D5C4', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Progress bar */}
        {totalItems > 0 && (
          <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 9999, overflow: 'hidden' }}>
            <View
              style={{ height: '100%', backgroundColor: '#4A3728', borderRadius: 9999, width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </View>
        )}
      </View>

      {/* Grocery list */}
      {totalItems > 0 ? (
        <GroceryListView
          groceryList={groceryListWithChecked}
          onItemToggle={handleItemToggle}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="cart-outline" size={56} color="#4A3728" />
          <Text style={{ color: '#6b7280', fontSize: 17, marginTop: 16, textAlign: 'center', lineHeight: 24 }}>
            Go to Weekly Menu and select "Create List" to generate your grocery list from your meals
          </Text>
        </View>
      )}
      </View>
    </GradientBackground>
  );
}
