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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing } from '@/lib/theme';
import { useRecipes, useSetMeal, useRemoveMeal, useEnhancedMode, useMealPlan } from '@/lib/hooks';
import { RecipeCard } from '@/components';
import type { MealType, Recipe } from '@/lib/types';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

// Map meal types to meal_label values for filtering
const MEAL_TYPE_TO_LABEL: Record<MealType, string[]> = {
  breakfast: ['breakfast'],
  lunch: ['meal', 'salad', 'starter'],
  dinner: ['meal', 'salad', 'starter', 'grill'],
  snack: ['dessert', 'drink'],
};

type TabType = 'library' | 'copy' | 'random' | 'quick';

export default function SelectRecipeScreen() {
  const { date, mealType, mode } = useLocalSearchParams<{
    date: string;
    mealType: MealType;
    mode?: 'library' | 'copy' | 'quick' | 'random';
  }>();
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();

  const { data: recipes = [] } = useRecipes(undefined, isEnhanced);
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();

  // Initialize tab based on mode param, default to library
  const [activeTab, setActiveTab] = useState<TabType>(
    mode === 'copy' ? 'copy' : mode === 'random' ? 'random' : mode === 'quick' ? 'quick' : 'library'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');
  const [randomSeed, setRandomSeed] = useState(0); // Used to trigger new random selection

  const filteredRecipes = useMemo(() => {
    if (searchQuery === '') return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  // Get recipes matching the current meal type for random selection
  const mealTypeRecipes = useMemo(() => {
    const allowedLabels = MEAL_TYPE_TO_LABEL[mealType] || ['meal'];
    return recipes.filter((recipe) => {
      // If recipe has a meal_label, check if it matches
      if (recipe.meal_label) {
        return allowedLabels.includes(recipe.meal_label);
      }
      // If no meal_label, include it for lunch/dinner (most common)
      return mealType === 'lunch' || mealType === 'dinner';
    });
  }, [recipes, mealType]);

  // Random recipe selection (changes when randomSeed changes)
  const randomRecipe = useMemo(() => {
    if (mealTypeRecipes.length === 0) return null;
    const index = Math.floor(Math.random() * mealTypeRecipes.length);
    return mealTypeRecipes[index];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealTypeRecipes, randomSeed]);

  const shuffleRandom = () => {
    setRandomSeed(prev => prev + 1);
  };

  // Get current week date range
  const currentWeekDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysSinceMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(monday), end: formatDate(sunday) };
  }, []);

  // Get existing meals from meal plan that can be copied (current week only)
  const existingMeals = useMemo(() => {
    if (!mealPlan?.meals) return [];

    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const meals: { key: string; date: string; mealType: string; recipe?: Recipe; customText?: string }[] = [];

    Object.entries(mealPlan.meals).forEach(([key, value]) => {
      const [dateStr, type] = key.split('_');
      // Don't show the current slot we're trying to fill
      if (key === `${date}_${mealType}`) return;

      // Only show meals from current week
      if (dateStr < currentWeekDates.start || dateStr > currentWeekDates.end) return;

      if (value.startsWith('custom:')) {
        meals.push({ key, date: dateStr, mealType: type, customText: value.slice(7) });
      } else {
        const recipe = recipeMap.get(value);
        if (recipe) {
          meals.push({ key, date: dateStr, mealType: type, recipe });
        }
      }
    });

    // Sort by date ascending (start of week first)
    return meals.sort((a, b) => a.date.localeCompare(b.date));
  }, [mealPlan, recipes, date, mealType, currentWeekDates]);

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
        {/* Tab switcher - always show all 4 tabs */}
        {!mode && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
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
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeTab === 'library' ? '#fff' : '#4A3728'
                }}>
                  📚 Library
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setActiveTab('random'); shuffleRandom(); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: activeTab === 'random' ? '#4A3728' : '#F5E6D3',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeTab === 'random' ? '#fff' : '#4A3728'
                }}>
                  🎲 Random
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('quick')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: activeTab === 'quick' ? '#4A3728' : '#F5E6D3',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeTab === 'quick' ? '#fff' : '#4A3728'
                }}>
                  ✏️ Quick
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
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeTab === 'copy' ? '#fff' : '#4A3728'
                }}>
                  📋 Copy
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick mode/tab - just show text input */}
        {(mode === 'quick' || activeTab === 'quick') ? (
          <View style={{ flex: 1, padding: 20 }}>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: spacing['2xl'],
              ...shadows.md,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#F5E6D3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="create-outline" size={28} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#4A3728' }}>
                  Quick Meal
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                  What are you having?
                </Text>
              </View>

              <TextInput
                style={{
                  backgroundColor: '#F5E6D3',
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  fontSize: 16,
                  color: '#4A3728',
                  marginBottom: 16,
                }}
                placeholder="e.g., Leftovers, Eating out, Pasta..."
                placeholderTextColor="#9ca3af"
                value={customText}
                onChangeText={setCustomText}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSetCustomText}
              />

              <Pressable
                onPress={handleSetCustomText}
                disabled={!customText.trim() || setMeal.isPending}
                style={({ pressed }) => ({
                  backgroundColor: customText.trim() ? '#4A3728' : '#E5E7EB',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: customText.trim() ? '#fff' : '#9CA3AF' }}>
                  Add Meal
                </Text>
              </Pressable>
            </View>
          </View>
        ) : activeTab === 'library' ? (
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
                      marginTop: spacing['2xl'],
                      paddingHorizontal: 28,
                      paddingVertical: 14,
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.sm,
                      ...shadows.lg,
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>Add a Recipe</Text>
                  </Pressable>
                </View>
              }
            />
          </>
        ) : activeTab === 'random' ? (
          /* Random recipe suggestion */
          <ScrollView contentContainerStyle={{ padding: 20, flex: 1 }}>
            {randomRecipe ? (
              <View style={{ alignItems: 'center' }}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Ionicons name="dice" size={32} color="#D97706" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary, textAlign: 'center' }}>
                    How about this?
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.text.secondary, marginTop: 4 }}>
                    {mealTypeRecipes.length} recipes match {MEAL_TYPE_LABELS[mealType].toLowerCase()}
                  </Text>
                </View>

                {/* Recipe Card with extra details */}
                <View style={{ width: '100%', marginBottom: 20 }}>
                  <Pressable
                    onPress={() => handleSelectRecipe(randomRecipe.id)}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: borderRadius.md,
                      overflow: 'hidden',
                      ...shadows.md,
                    }}
                  >
                    {randomRecipe.image_url && (
                      <Image
                        source={{ uri: randomRecipe.image_url }}
                        style={{ width: '100%', height: 180 }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ padding: 16 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 8 }}>
                        {randomRecipe.title}
                      </Text>

                      {/* Time and servings info */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                        {randomRecipe.total_time && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                            <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                              {randomRecipe.total_time} min
                            </Text>
                          </View>
                        )}
                        {randomRecipe.servings && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
                            <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                              {randomRecipe.servings} servings
                            </Text>
                          </View>
                        )}
                        {randomRecipe.diet_label && (
                          <View style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: randomRecipe.diet_label === 'veggie' ? '#DCFCE7' :
                                           randomRecipe.diet_label === 'fish' ? '#DBEAFE' : '#FEF3C7',
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: randomRecipe.diet_label === 'veggie' ? '#166534' :
                                     randomRecipe.diet_label === 'fish' ? '#1E40AF' : '#92400E',
                            }}>
                              {randomRecipe.diet_label === 'veggie' ? '🥬 Veggie' :
                               randomRecipe.diet_label === 'fish' ? '🐟 Fish' : '🥩 Meat'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Ingredients preview */}
                      {randomRecipe.ingredients && randomRecipe.ingredients.length > 0 && (
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 4 }}>
                            Ingredients ({randomRecipe.ingredients.length})
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.text.muted, lineHeight: 18 }} numberOfLines={2}>
                            {randomRecipe.ingredients.slice(0, 5).join(' • ')}
                            {randomRecipe.ingredients.length > 5 ? ' ...' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <Pressable
                    onPress={shuffleRandom}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 14,
                      borderRadius: borderRadius.sm,
                      backgroundColor: pressed ? '#E8D5C4' : colors.bgMid,
                    })}
                  >
                    <Ionicons name="shuffle" size={20} color={colors.primary} />
                    <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: colors.primary }}>
                      Shuffle
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSelectRecipe(randomRecipe.id)}
                    disabled={setMeal.isPending}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 14,
                      borderRadius: borderRadius.sm,
                      backgroundColor: pressed ? colors.primaryDark : colors.primary,
                      ...shadows.md,
                    })}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: colors.white }}>
                      Add to Plan
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* No recipes for this meal type */
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
                  <Ionicons name="dice-outline" size={36} color={colors.primary} />
                </View>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                  No {MEAL_TYPE_LABELS[mealType].toLowerCase()} recipes
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  Add some recipes with the "{MEAL_TYPE_LABELS[mealType].toLowerCase()}" meal type to use random selection
                </Text>
              </View>
            )}
          </ScrollView>
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
                    backgroundColor: pressed ? colors.bgDark : colors.white,
                    borderRadius: borderRadius.sm,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    ...shadows.sm,
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
