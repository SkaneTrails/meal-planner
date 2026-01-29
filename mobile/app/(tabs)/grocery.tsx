/**
 * Grocery screen - Shopping list from meal plan.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useGroceryList, useMealPlan, useRecipes, useEnhancedMode } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
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
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [mealServings, setMealServings] = useState<Record<string, number>>({}); // key -> servings
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isEnhanced } = useEnhancedMode();
  const { isItemAtHome, settings } = useSettings();
  const { data: mealPlan } = useMealPlan();
  const { data: recipes = [] } = useRecipes(undefined, isEnhanced);

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
      mealServings,
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

      // Calculate servings multiplier
      const requestedServings = mealServings[key] || recipe.servings || 2;
      const recipeServings = recipe.servings || 2;
      const multiplier = requestedServings / recipeServings;
      
      // Format source with servings info
      const sourceLabel = multiplier !== 1 
        ? `${recipe.title} (${requestedServings}👤)` 
        : recipe.title;

      recipe.ingredients.forEach((ingredient) => {
        const name = ingredient.toLowerCase().trim();
        if (!ingredientsMap.has(name)) {
          ingredientsMap.set(name, {
            name: ingredient,
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
  }, [mealPlan, recipes, selectedMealKeys, mealServings]);

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
  
  // Count items that are filtered out (at home)
  const hiddenAtHomeCount = useMemo(() => {
    return groceryListWithChecked.items.filter(item => isItemAtHome(item.name)).length;
  }, [groceryListWithChecked.items, isItemAtHome]);

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Shopping</Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', letterSpacing: -0.5 }}>Grocery List</Text>
          </View>
          <View style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 24, 
            backgroundColor: '#E8D5C4', 
            alignItems: 'center', 
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Ionicons name="cart" size={24} color="#4A3728" />
          </View>
        </View>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        {/* Stats card */}
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>This week's shopping</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', marginTop: 2 }}>
                {totalItems === 0
                  ? 'No items yet'
                  : `${checkedCount} of ${totalItems} items`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Add Item button */}
              <Pressable
                onPress={() => setShowAddItem(!showAddItem)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 14, 
                  paddingVertical: 10, 
                  borderRadius: 12, 
                  backgroundColor: showAddItem ? '#4A3728' : '#F5E6D3',
                }}
              >
                <Ionicons name={showAddItem ? 'close' : 'add'} size={18} color={showAddItem ? '#fff' : '#4A3728'} />
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
                    backgroundColor: '#F5E6D3',
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#4A3728" />
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
                    backgroundColor: '#F5E6D3',
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#4A3728" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Progress bar */}
          {totalItems > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ height: 8, backgroundColor: '#E8D5C4', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{ height: '100%', backgroundColor: '#4A3728', borderRadius: 4, width: `${(checkedCount / totalItems) * 100}%` }}
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
                backgroundColor: '#F0FDF4',
                borderRadius: 10,
                gap: 8,
              }}
            >
              <Ionicons name="home-outline" size={16} color="#166534" />
              <Text style={{ fontSize: 13, color: '#166534', flex: 1 }}>
                {hiddenAtHomeCount} item{hiddenAtHomeCount > 1 ? 's' : ''} hidden (at home)
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#166534" />
            </Pressable>
          )}
        </View>

        {/* Add item input */}
        {showAddItem && (
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#4A3728', marginBottom: 10 }}>Add custom item</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={{ 
                  flex: 1, 
                  backgroundColor: '#F5E6D3', 
                  borderRadius: 12, 
                  paddingHorizontal: 14, 
                  paddingVertical: 12, 
                  fontSize: 15, 
                  color: '#4A3728',
                }}
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
                style={{ 
                  backgroundColor: newItemText.trim() ? '#4A3728' : '#E8D5C4', 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 12,
                  shadowColor: newItemText.trim() ? '#4A3728' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: newItemText.trim() ? 3 : 0,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Add</Text>
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
          <View style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: '#E8D5C4', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="cart-outline" size={40} color="#4A3728" />
          </View>
          <Text style={{ color: '#4A3728', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            Your list is empty
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Go to Weekly Menu and tap "Create List" to generate your grocery list from planned meals
          </Text>
        </View>
      )}
      </View>
    </GradientBackground>
  );
}
