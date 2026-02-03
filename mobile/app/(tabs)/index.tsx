/**
 * Home screen - Dashboard with stats and quick actions.
 * Food delivery app inspired design with gradient background.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, borderRadius, colors, spacing } from '@/lib/theme';
import { useRecipes, useMealPlan, useEnhancedMode, useGroceryState } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { GradientBackground } from '@/components';
import type { Recipe, GroceryItem } from '@/lib/types';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(): { start: string; end: string } {
  const today = new Date();
  const currentDay = today.getDay();
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  return { start: formatDateLocal(saturday), end: formatDateLocal(friday) };
}

function getNextMeal(mealPlan: { meals?: Record<string, string> } | undefined, recipes: Recipe[]): { title: string; imageUrl?: string; isCustom: boolean; mealType: string; recipeId?: string; isTomorrow?: boolean } | null {
  if (!mealPlan?.meals) return null;
  const now = new Date();
  const today = formatDateLocal(now);
  const currentHour = now.getHours();

  // Determine which meal is "next"
  // Before 12: show lunch, after 12: show dinner
  const mealTypes = currentHour < 12 ? ['lunch', 'dinner'] : ['dinner'];

  // Check today's meals first
  for (const mealType of mealTypes) {
    const key = `${today}_${mealType}`;
    const value = mealPlan.meals[key];
    if (value) {
      if (value.startsWith('custom:')) {
        return { title: value.slice(7), isCustom: true, mealType };
      }
      const recipe = recipes.find(r => r.id === value);
      if (recipe) {
        return { title: recipe.title, imageUrl: recipe.image_url || undefined, isCustom: false, mealType, recipeId: recipe.id };
      }
    }
  }

  // If today is empty, check tomorrow's meals
  // Use 24h in ms to avoid DST edge cases with setDate()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = formatDateLocal(tomorrow);

  for (const mealType of ['lunch', 'dinner']) {
    const key = `${tomorrowStr}_${mealType}`;
    const value = mealPlan.meals[key];
    if (value) {
      if (value.startsWith('custom:')) {
        return { title: value.slice(7), isCustom: true, mealType, isTomorrow: true };
      }
      const recipe = recipes.find(r => r.id === value);
      if (recipe) {
        return { title: recipe.title, imageUrl: recipe.image_url || undefined, isCustom: false, mealType, recipeId: recipe.id, isTomorrow: true };
      }
    }
  }

  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useRecipes(undefined, isEnhanced);
  const { data: mealPlan, isLoading: mealPlanLoading, refetch: refetchMealPlan } = useMealPlan();
  const { checkedItems, selectedMealKeys, customItems, refreshFromStorage } = useGroceryState();
  const { isItemAtHome } = useSettings();
  const [recipeUrl, setRecipeUrl] = useState('');
  // Use Date.now() to randomize the initial seed on each app launch
  const [inspirationIndex, setInspirationIndex] = useState(() => Math.floor(Date.now() % 10000));

  const isLoading = recipesLoading || mealPlanLoading;

  const handleRefresh = () => {
    refetchRecipes();
    refetchMealPlan();
    refreshFromStorage();
  };

  // Generate grocery items count from selected meals (same logic as grocery screen)
  const groceryItemsCount = useMemo(() => {
    if (!mealPlan || selectedMealKeys.length === 0) {
      // Filter custom items: exclude checked items and items marked as "at home"
      // customItems in context is string[] (just names)
      return customItems.filter(name =>
        !checkedItems.has(name) && !isItemAtHome(name)
      ).length;
    }

    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const ingredientNames = new Set<string>();

    selectedMealKeys.forEach(key => {
      const recipeId = mealPlan.meals?.[key];
      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ingredient => {
        const name = ingredient.toLowerCase().trim()
          .replace(/\s*\(steg\s*\d+\)\s*$/i, '')
          .replace(/\s*\(step\s*\d+\)\s*$/i, '')
          .replace(/\s+till\s+\w+$/i, '');
        ingredientNames.add(name);
      });
    });

    // Add custom items
    customItems.forEach(name => ingredientNames.add(name));

    // Filter out items at home and checked items, return unchecked count
    let uncheckedCount = 0;
    ingredientNames.forEach(name => {
      if (!isItemAtHome(name) && !checkedItems.has(name)) {
        uncheckedCount++;
      }
    });

    return uncheckedCount;
  }, [mealPlan, selectedMealKeys, recipes, customItems, checkedItems, isItemAtHome]);

  // Filter inspiration recipes (exclude meal and grill categories - starters, desserts, drinks, sauces, pickles, breakfast)
  const inspirationRecipes = useMemo(() => {
    return recipes.filter(
      (recipe: Recipe) => recipe.meal_label && recipe.meal_label !== 'meal' && recipe.meal_label !== 'grill'
    );
  }, [recipes]);

  // Get current inspiration recipe
  const inspirationRecipe = useMemo(() => {
    if (inspirationRecipes.length === 0) return null;
    return inspirationRecipes[inspirationIndex % inspirationRecipes.length];
  }, [inspirationRecipes, inspirationIndex]);

  // Shuffle to get a new random inspiration
  const shuffleInspiration = useCallback(() => {
    if (inspirationRecipes.length <= 1) return;
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * inspirationRecipes.length);
    } while (newIndex === inspirationIndex && inspirationRecipes.length > 1);
    setInspirationIndex(newIndex);
  }, [inspirationRecipes.length, inspirationIndex]);

  // Count meals planned this week (max 21: 7 days x 3 meals)
  const plannedMealsCount = mealPlan?.meals ? Object.keys(mealPlan.meals).length : 0;
  const nextMeal = getNextMeal(mealPlan, recipes);

  const handleImportRecipe = () => {
    if (recipeUrl.trim()) {
      router.push({ pathname: '/add-recipe', params: { url: recipeUrl.trim() } });
      setRecipeUrl('');
    }
  };

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#4A3728" />
        }
      >
      {/* Hero image with gradient fade and welcome text overlay */}
      <View style={{ position: 'relative', marginBottom: 0 }}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80' }}
          style={{ width: '100%', height: 300 }}
          resizeMode="cover"
        />
        {/* Settings button */}
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => ({
            position: 'absolute',
            top: 50,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </Pressable>
        {/* Stronger gradient overlay fading to beige */}
        <LinearGradient
          colors={['rgba(232, 213, 196, 0)', 'rgba(232, 213, 196, 0.5)', '#E8D5C4']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
          }}
        />

        {/* Welcome text on image */}
        <View style={{ position: 'absolute', bottom: 36, left: 24, right: 24 }}>
          <Text style={{ fontSize: 34, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5, textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
            Hi there!
          </Text>
          <Text style={{ fontSize: 17, color: '#FFFFFF', lineHeight: 24, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
            Plan meals, save recipes, shop smarter.
          </Text>
        </View>
      </View>

      {/* Stats cards - 3 in a row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: -10 }}>
        {/* Recipe Library */}
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, ...shadows.md }}>
          <View style={{ backgroundColor: '#F3E8E0', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="book" size={20} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Saved</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', marginBottom: 12, letterSpacing: -0.5 }}>
            {recipes.length}
          </Text>
          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#E8D5C4' : '#F3E8E0',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Browse</Text>
          </Pressable>
        </View>

        {/* This Week */}
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, ...shadows.md }}>
          <View style={{ backgroundColor: '#E8F0E8', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="calendar" size={20} color="#2D5A3D" />
          </View>
          <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Planned</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#2D5A3D', marginBottom: 12, letterSpacing: -0.5 }}>
            {plannedMealsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/meal-plan')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#D4E4D4' : '#E8F0E8',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#2D5A3D', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Plan</Text>
          </Pressable>
        </View>

        {/* Shopping */}
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, ...shadows.md }}>
          <View style={{ backgroundColor: '#E5E7EB', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="cart" size={20} color="#374151" />
          </View>
          <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>To Buy</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#374151', marginBottom: 12, letterSpacing: -0.5 }}>
            {groceryItemsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/grocery')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#D1D5DB' : '#E5E7EB',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#374151', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>View List</Text>
          </Pressable>
        </View>
      </View>

      {/* Add a Recipe */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ backgroundColor: '#E8D5C4', borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add-circle" size={16} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Add a Recipe</Text>
        </View>

        {/* Import Recipe - single line */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          padding: 4,
          ...shadows.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: '#F3E8E0', borderRadius: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
            <Ionicons name="link" size={20} color="#4A3728" />
          </View>
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 15,
              color: '#4A3728',
            }}
            placeholder="Paste recipe URL to import..."
            placeholderTextColor="#9ca3af"
            value={recipeUrl}
            onChangeText={setRecipeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={handleImportRecipe}
            returnKeyType="go"
          />
          <Pressable
            onPress={handleImportRecipe}
            disabled={!recipeUrl.trim()}
            style={({ pressed }) => ({
              backgroundColor: recipeUrl.trim() ? (pressed ? '#3D2D1F' : '#4A3728') : '#E5E7EB',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              marginRight: 4,
            })}
          >
            <Text style={{ color: recipeUrl.trim() ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: '600' }}>Import</Text>
          </Pressable>
        </View>
      </View>

      {/* Next Up */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ backgroundColor: '#E8F0E8', borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="restaurant" size={16} color="#2D5A3D" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Next Up</Text>
        </View>

        {/* Next meal - clickable card */}
        <Pressable
          onPress={() => nextMeal?.recipeId ? router.push(`/recipe/${nextMeal.recipeId}`) : router.push('/meal-plan')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#F9F5F0' : colors.white,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            ...shadows.md,
            flexDirection: 'row',
            alignItems: 'center',
          })}
        >
          {nextMeal?.imageUrl ? (
            <Image
              source={{ uri: nextMeal.imageUrl }}
              style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              backgroundColor: '#E8F0E8',
              borderRadius: 12,
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Ionicons name="restaurant" size={24} color="#2D5A3D" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
              {nextMeal
                ? `${nextMeal.isTomorrow ? "Tomorrow's" : "Today's"} ${nextMeal.mealType.charAt(0).toUpperCase() + nextMeal.mealType.slice(1)}`
                : 'No meal planned'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: nextMeal ? '#4A3728' : '#9CA3AF' }} numberOfLines={1}>
              {nextMeal?.title || 'Plan your next meal'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Inspiration section */}
      {inspirationRecipes.length > 0 && inspirationRecipe && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#E5E7EB', borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb" size={16} color="#374151" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Inspiration</Text>
            </View>
            <Pressable
              onPress={shuffleInspiration}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? '#D1D5DB' : '#E5E7EB',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Ionicons name="shuffle" size={14} color="#374151" />
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13, marginLeft: 6 }}>Shuffle</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            style={({ pressed }) => ({
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
              ...shadows.md,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Image
              source={{ uri: inspirationRecipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' }}
              style={{ width: '100%', height: 160 }}
              resizeMode="cover"
            />
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#4A3728', letterSpacing: -0.2 }} numberOfLines={1}>
                {inspirationRecipe.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                {inspirationRecipe.meal_label && (
                  <View style={{ backgroundColor: '#F5E6D3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A3728' }}>
                      {inspirationRecipe.meal_label.charAt(0).toUpperCase() + inspirationRecipe.meal_label.slice(1)}
                    </Text>
                  </View>
                )}
                {inspirationRecipe.diet_label && (
                  <View style={{ backgroundColor: inspirationRecipe.diet_label === 'veggie' ? '#DCFCE7' : inspirationRecipe.diet_label === 'fish' ? '#DBEAFE' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: inspirationRecipe.diet_label === 'veggie' ? '#166534' : inspirationRecipe.diet_label === 'fish' ? '#1E40AF' : '#991B1B' }}>
                      {inspirationRecipe.diet_label.charAt(0).toUpperCase() + inspirationRecipe.diet_label.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}
