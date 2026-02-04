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
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing, iconContainer } from '@/lib/theme';
import { GradientBackground } from '@/components';
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
// For random shuffle in meal plan, only use 'meal' and 'grill' for lunch/dinner
const MEAL_TYPE_TO_LABEL: Record<MealType, string[]> = {
  breakfast: ['breakfast'],
  lunch: ['meal', 'grill'],
  dinner: ['meal', 'grill'],
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

      <GradientBackground style={{ flex: 1 }}>
        {/* Tab switcher - always show all 4 tabs */}
        {!mode && (
          <View style={{ backgroundColor: colors.glass.card, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Pressable
                onPress={() => setActiveTab('library')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: activeTab === 'library' ? colors.primary : colors.glass.light,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: '600',
                  color: activeTab === 'library' ? colors.white : colors.text.inverse
                }}>
                  📚 Library
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setActiveTab('random'); shuffleRandom(); }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: activeTab === 'random' ? colors.primary : colors.glass.light,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: '600',
                  color: activeTab === 'random' ? colors.white : colors.text.inverse
                }}>
                  🎲 Random
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('quick')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: activeTab === 'quick' ? colors.primary : colors.glass.light,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: '600',
                  color: activeTab === 'quick' ? colors.white : colors.text.inverse
                }}>
                  ✏️ Quick
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('copy')}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: activeTab === 'copy' ? colors.primary : colors.glass.light,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: '600',
                  color: activeTab === 'copy' ? colors.white : colors.text.inverse
                }}>
                  📋 Copy
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick mode/tab - just show text input */}
        {(mode === 'quick' || activeTab === 'quick') ? (
          <View style={{ flex: 1, padding: spacing.xl }}>
            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.lg,
              padding: spacing['2xl'],
              ...shadows.md,
            }}>
              <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                <View style={{
                  width: iconContainer.xl,
                  height: iconContainer.xl,
                  borderRadius: iconContainer.xl / 2,
                  backgroundColor: colors.glass.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                }}>
                  <Ionicons name="create-outline" size={28} color={colors.text.inverse} />
                </View>
                <Text style={{ fontSize: fontSize['3xl'], fontWeight: '600', color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                  Quick Meal
                </Text>
                <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }}>
                  What are you having?
                </Text>
              </View>

              <TextInput
                style={{
                  backgroundColor: colors.glass.light,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.lg,
                  fontSize: fontSize.lg,
                  color: colors.text.inverse,
                  marginBottom: spacing.lg,
                }}
                placeholder="e.g., Leftovers, Eating out, Pasta..."
                placeholderTextColor={colors.gray[500]}
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
                  backgroundColor: customText.trim() ? colors.primary : colors.gray[300],
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.lg,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                  ...shadows.sm,
                })}
              >
                <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: customText.trim() ? colors.white : colors.gray[500] }}>
                  Add Meal
                </Text>
              </Pressable>
            </View>
          </View>
        ) : activeTab === 'library' ? (
          <>  
            {/* Search bar */}
            <View style={{ backgroundColor: colors.glass.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass.light, borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                <Ionicons name="search" size={20} color={colors.gray[500]} />
                <TextInput
                  style={{ flex: 1, marginLeft: spacing.sm, fontSize: fontSize.lg, color: colors.text.inverse }}
                  placeholder="Search recipes..."
                  placeholderTextColor={colors.gray[500]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Custom text input */}
            <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.glass.dark }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.sm }}>
                Or enter custom text
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: colors.glass.light, borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSize.lg, color: colors.text.inverse }}
                  placeholder="e.g., Leftovers, Eating out..."
                  placeholderTextColor={colors.gray[500]}
                  value={customText}
                  onChangeText={setCustomText}
                />
                <Pressable
                  onPress={handleSetCustomText}
                  disabled={!customText.trim() || setMeal.isPending}
                  style={({ pressed }) => ({ marginLeft: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.sm, backgroundColor: customText.trim() ? colors.primary : colors.gray[300], opacity: pressed ? 0.9 : 1 })}
                >
                  <Text style={{ color: customText.trim() ? colors.white : colors.gray[500], fontSize: fontSize.lg, fontWeight: '600' }}>Add</Text>
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
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'] * 2, paddingHorizontal: spacing['3xl'] }}>
                  <View style={{
                    width: iconContainer['2xl'],
                    height: iconContainer['2xl'],
                    borderRadius: iconContainer['2xl'] / 2,
                    backgroundColor: colors.glass.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.xl,
                  }}>
                    <Ionicons name={searchQuery ? "search" : "book-outline"} size={36} color={colors.text.inverse} />
                  </View>
                  <Text style={{ color: colors.text.inverse, fontSize: fontSize['3xl'], fontWeight: '600', textAlign: 'center', letterSpacing: letterSpacing.normal }}>
                    {searchQuery ? 'No matches found' : 'No recipes yet'}
                  </Text>
                  <Text style={{ color: colors.gray[600], fontSize: fontSize.lg, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }}>
                    {searchQuery ? 'Try a different search term' : 'Add some recipes first to plan your meals'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      router.back();
                      router.push('/add-recipe');
                    }}
                    style={({ pressed }) => ({
                      marginTop: spacing['2xl'],
                      paddingHorizontal: spacing['2xl'],
                      paddingVertical: spacing.md,
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.sm,
                      ...shadows.lg,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <Text style={{ color: colors.white, fontSize: fontSize.lg, fontWeight: '600' }}>Add a Recipe</Text>
                  </Pressable>
                </View>
              }
            />
          </>
        ) : activeTab === 'random' ? (
          /* Random recipe suggestion */
          <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100, flex: 1 }}>
            {randomRecipe ? (
              <View style={{ alignItems: 'center' }}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
                  <View style={{
                    width: iconContainer.xl,
                    height: iconContainer.xl,
                    borderRadius: iconContainer.xl / 2,
                    backgroundColor: colors.glass.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.md,
                  }}>
                    <Ionicons name="dice" size={32} color={colors.text.inverse} />
                  </View>
                  <Text style={{ fontSize: fontSize['3xl'], fontWeight: '700', color: colors.text.inverse, textAlign: 'center', letterSpacing: letterSpacing.normal }}>
                    How about this?
                  </Text>
                  <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }}>
                    {mealTypeRecipes.length} recipes match {MEAL_TYPE_LABELS[mealType].toLowerCase()}
                  </Text>
                </View>

                {/* Recipe Card with extra details */}
                <View style={{ width: '100%', marginBottom: spacing.xl }}>
                  <Pressable
                    onPress={() => handleSelectRecipe(randomRecipe.id)}
                    style={({ pressed }) => ({
                      backgroundColor: colors.glass.card,
                      borderRadius: borderRadius.lg,
                      overflow: 'hidden',
                      ...shadows.md,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    })}
                  >
                    {randomRecipe.image_url && (
                      <Image
                        source={{ uri: randomRecipe.image_url }}
                        style={{ width: '100%', height: 180 }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ padding: spacing.lg }}>
                      <Text style={{ fontSize: fontSize['3xl'], fontWeight: '700', color: colors.text.inverse, marginBottom: spacing.sm, letterSpacing: letterSpacing.normal }}>
                        {randomRecipe.title}
                      </Text>

                      {/* Time and servings info */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md }}>
                        {randomRecipe.total_time && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
                            <Text style={{ fontSize: fontSize.md, color: colors.gray[600] }}>
                              {randomRecipe.total_time} min
                            </Text>
                          </View>
                        )}
                        {randomRecipe.servings && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="people-outline" size={16} color={colors.gray[500]} />
                            <Text style={{ fontSize: fontSize.md, color: colors.gray[600] }}>
                              {randomRecipe.servings} servings
                            </Text>
                          </View>
                        )}
                        {randomRecipe.diet_label && (
                          <View style={{
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: borderRadius.sm,
                            backgroundColor: randomRecipe.diet_label === 'veggie' ? colors.diet.veggie.bg :
                                           randomRecipe.diet_label === 'fish' ? colors.diet.fish.bg : colors.diet.meat.bg,
                          }}>
                            <Text style={{
                              fontSize: fontSize.sm,
                              fontWeight: '600',
                              color: randomRecipe.diet_label === 'veggie' ? colors.diet.veggie.text :
                                     randomRecipe.diet_label === 'fish' ? colors.diet.fish.text : colors.diet.meat.text,
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
                          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.gray[600], marginBottom: spacing.xs }}>
                            Ingredients ({randomRecipe.ingredients.length})
                          </Text>
                          <Text style={{ fontSize: fontSize.base, color: colors.gray[500], lineHeight: 18 }} numberOfLines={2}>
                            {randomRecipe.ingredients.slice(0, 5).join(' • ')}
                            {randomRecipe.ingredients.length > 5 ? ' ...' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                  <Pressable
                    onPress={shuffleRandom}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.md,
                      borderRadius: borderRadius.sm,
                      backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
                      ...shadows.sm,
                    })}
                  >
                    <Ionicons name="shuffle" size={20} color={colors.text.inverse} />
                    <Text style={{ marginLeft: spacing.sm, fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
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
                      paddingVertical: spacing.md,
                      borderRadius: borderRadius.sm,
                      backgroundColor: pressed ? colors.primaryDark : colors.primary,
                      ...shadows.md,
                    })}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <Text style={{ marginLeft: spacing.sm, fontSize: fontSize.lg, fontWeight: '600', color: colors.white }}>
                      Add to Plan
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* No recipes for this meal type */
              <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing['3xl'] }}>
                <View style={{
                  width: iconContainer['2xl'],
                  height: iconContainer['2xl'],
                  borderRadius: iconContainer['2xl'] / 2,
                  backgroundColor: colors.glass.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xl,
                }}>
                  <Ionicons name="dice-outline" size={36} color={colors.text.inverse} />
                </View>
                <Text style={{ color: colors.text.inverse, fontSize: fontSize['3xl'], fontWeight: '600', textAlign: 'center', letterSpacing: letterSpacing.normal }}>
                  No {MEAL_TYPE_LABELS[mealType].toLowerCase()} recipes
                </Text>
                <Text style={{ color: colors.gray[600], fontSize: fontSize.lg, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }}>
                  Add some recipes with the "{MEAL_TYPE_LABELS[mealType].toLowerCase()}" meal type to use random selection
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* Copy from existing meals */
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
            <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginBottom: spacing.lg }}>
              Copy a meal from your existing plan:
            </Text>

            {existingMeals.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing['3xl'] }}>
                <View style={{
                  width: iconContainer['2xl'],
                  height: iconContainer['2xl'],
                  borderRadius: iconContainer['2xl'] / 2,
                  backgroundColor: colors.glass.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xl,
                }}>
                  <Ionicons name="calendar-outline" size={36} color={colors.text.inverse} />
                </View>
                <Text style={{ color: colors.text.inverse, fontSize: fontSize['3xl'], fontWeight: '600', textAlign: 'center', letterSpacing: letterSpacing.normal }}>
                  No meals to copy
                </Text>
                <Text style={{ color: colors.gray[600], fontSize: fontSize.lg, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 }}>
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
                    backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
                    borderRadius: borderRadius.sm,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    ...shadows.sm,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
                      {meal.recipe?.title || meal.customText}
                    </Text>
                    <Text style={{ fontSize: fontSize.md, color: colors.gray[600], marginTop: spacing.xs }}>
                      {formatMealDate(meal.date)} · {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                    </Text>
                  </View>
                  <View style={{
                    width: iconContainer.md,
                    height: iconContainer.md,
                    borderRadius: iconContainer.md / 2,
                    backgroundColor: colors.glass.light,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ionicons name="copy-outline" size={18} color={colors.text.inverse} />
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}

        {/* Remove meal button */}
        <View style={{ padding: spacing.lg, backgroundColor: colors.glass.card }}>
          <Pressable
            onPress={handleRemoveMeal}
            disabled={removeMeal.isPending}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: borderRadius.sm,
              backgroundColor: pressed ? colors.glass.medium : colors.glass.light,
            })}
          >
            <Ionicons name="trash-outline" size={18} color={colors.text.inverse} />
            <Text style={{ marginLeft: spacing.sm, fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
              Clear This Meal
            </Text>
          </Pressable>
        </View>
      </GradientBackground>
    </>
  );
}
