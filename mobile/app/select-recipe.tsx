/**
 * Select Recipe modal - Choose a recipe for a meal slot.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useSetMeal, useRemoveMeal, useEnhancedMode, useMealPlan } from '@/lib/hooks';
import { RecipeCard } from '@/components';
import type { MealType, Recipe } from '@/lib/types';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

type TabType = 'library' | 'copy';

export default function SelectRecipeScreen() {
  const { date, mealType, mode } = useLocalSearchParams<{
    date: string;
    mealType: MealType;
    mode?: 'library' | 'copy';
  }>();
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();

  const { data: recipes = [] } = useRecipes(undefined, isEnhanced);
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();

  // Initialize tab based on mode param, default to library
  const [activeTab, setActiveTab] = useState<TabType>(mode === 'copy' ? 'copy' : 'library');
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');

  const filteredRecipes = useMemo(() => {
    if (searchQuery === '') return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  // Get existing meals from meal plan that can be copied
  const existingMeals = useMemo(() => {
    if (!mealPlan?.meals) return [];
    
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const meals: { key: string; date: string; mealType: string; recipe?: Recipe; customText?: string }[] = [];
    
    Object.entries(mealPlan.meals).forEach(([key, value]) => {
      const [dateStr, type] = key.split('_');
      // Don't show the current slot we're trying to fill
      if (key === `${date}_${mealType}`) return;
      
      if (value.startsWith('custom:')) {
        meals.push({ key, date: dateStr, mealType: type, customText: value.slice(7) });
      } else {
        const recipe = recipeMap.get(value);
        if (recipe) {
          meals.push({ key, date: dateStr, mealType: type, recipe });
        }
      }
    });
    
    // Sort by date descending (most recent first)
    return meals.sort((a, b) => b.date.localeCompare(a.date));
  }, [mealPlan, recipes, date, mealType]);

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await setMeal.mutateAsync({
        date,
        mealType,
        recipeId,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to set meal');
    }
  };

  const handleSetCustomText = async () => {
    if (!customText.trim()) return;

    try {
      await setMeal.mutateAsync({
        date,
        mealType,
        customText: customText.trim(),
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to set meal');
    }
  };

  const handleCopyMeal = async (recipeId?: string, customTextValue?: string) => {
    try {
      if (recipeId) {
        await setMeal.mutateAsync({
          date,
          mealType,
          recipeId,
        });
      } else if (customTextValue) {
        await setMeal.mutateAsync({
          date,
          mealType,
          customText: customTextValue,
        });
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to copy meal');
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove meal');
    }
  };

  const formatMealDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${MEAL_TYPE_LABELS[mealType]} - ${formattedDate}`,
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#F5E6D3' }}>
        {/* Tab switcher */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable
              onPress={() => setActiveTab('library')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: activeTab === 'library' ? '#4A3728' : '#F5E6D3',
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: activeTab === 'library' ? '#fff' : '#4A3728' 
              }}>
                📚 From Library
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('copy')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: activeTab === 'copy' ? '#4A3728' : '#F5E6D3',
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: activeTab === 'copy' ? '#fff' : '#4A3728' 
              }}>
                📋 Copy Meal
              </Text>
            </Pressable>
          </View>
        </View>

        {activeTab === 'library' ? (
          <>
            {/* Search bar */}
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5E6D3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                <Ionicons name="search" size={20} color="#4A3728" />
                <TextInput
                  style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#4A3728' }}
                  placeholder="Search recipes..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#4A3728" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Custom text input */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
                Or enter custom text
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#F5E6D3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#4A3728' }}
                  placeholder="e.g., Leftovers, Eating out..."
                  placeholderTextColor="#9ca3af"
                  value={customText}
                  onChangeText={setCustomText}
                />
                <Pressable
                  onPress={handleSetCustomText}
                  disabled={!customText.trim() || setMeal.isPending}
                  style={{ marginLeft: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: customText.trim() ? '#4A3728' : '#9CA3AF' }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Recipe list */}
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  compact
                  onPress={() => handleSelectRecipe(item.id)}
                />
              )}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
                  <View style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 40, 
                    backgroundColor: '#E8D5C4', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Ionicons name={searchQuery ? "search" : "book-outline"} size={36} color="#4A3728" />
                  </View>
                  <Text style={{ color: '#4A3728', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                    {searchQuery ? 'No matches found' : 'No recipes yet'}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                    {searchQuery ? 'Try a different search term' : 'Add some recipes first to plan your meals'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      router.back();
                      router.push('/add-recipe');
                    }}
                    style={{ 
                      marginTop: 24, 
                      paddingHorizontal: 28, 
                      paddingVertical: 14, 
                      backgroundColor: '#4A3728', 
                      borderRadius: 14,
                      shadowColor: '#4A3728',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.25,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add a Recipe</Text>
                  </Pressable>
                </View>
              }
            />
          </>
        ) : (
          /* Copy from existing meals */
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Copy a meal from your existing plan:
            </Text>
            
            {existingMeals.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
                <View style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 40, 
                  backgroundColor: '#E8D5C4', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Ionicons name="calendar-outline" size={36} color="#4A3728" />
                </View>
                <Text style={{ color: '#4A3728', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                  No meals to copy
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  Plan some meals first, then you can copy them to other days
                </Text>
              </View>
            ) : (
              existingMeals.map((meal) => (
                <Pressable
                  key={meal.key}
                  onPress={() => handleCopyMeal(meal.recipe?.id, meal.customText)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? '#E8D5C4' : '#fff',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                      {meal.recipe?.title || meal.customText}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatMealDate(meal.date)} · {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                    </Text>
                  </View>
                  <View style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 18, 
                    backgroundColor: '#F5E6D3', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Ionicons name="copy-outline" size={18} color="#4A3728" />
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}

        {/* Remove meal button */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
          <Pressable
            onPress={handleRemoveMeal}
            disabled={removeMeal.isPending}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5E6D3' }}
          >
            <Ionicons name="trash-outline" size={18} color="#4A3728" />
            <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
              Clear This Meal
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
