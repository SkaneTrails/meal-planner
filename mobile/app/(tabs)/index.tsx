/**
 * Home screen - Dashboard with stats and quick actions.
 * Food delivery app inspired design with gradient background.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useMealPlan, useGroceryList } from '@/lib/hooks';
import { GradientBackground } from '@/components';
import type { Recipe } from '@/lib/types';

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

function getTodaysDinner(mealPlan: { meals?: Record<string, string> } | undefined, recipes: { id: string; title: string }[]): string | null {
  if (!mealPlan?.meals) return null;
  const today = formatDateLocal(new Date());
  const dinnerKey = `${today}_dinner`;
  const dinnerValue = mealPlan.meals[dinnerKey];
  if (!dinnerValue) return null;
  if (dinnerValue.startsWith('custom:')) return dinnerValue.slice(7);
  const recipe = recipes.find(r => r.id === dinnerValue);
  return recipe?.title || null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useRecipes();
  const { data: mealPlan, isLoading: mealPlanLoading, refetch: refetchMealPlan } = useMealPlan();
  const [recipeUrl, setRecipeUrl] = useState('');
  const [inspirationIndex, setInspirationIndex] = useState(0);

  const { start, end } = useMemo(() => getWeekDates(), []);
  const { data: groceryList } = useGroceryList(undefined, { start_date: start, end_date: end });

  const isLoading = recipesLoading || mealPlanLoading;

  const handleRefresh = () => {
    refetchRecipes();
    refetchMealPlan();
  };

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
  const groceryItemsCount = groceryList?.items.length || 0;
  const todaysDinner = getTodaysDinner(mealPlan, recipes);

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
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 50 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#4A3728" />
        }
      >
      {/* Hero image */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80' }}
          style={{ width: '100%', height: 160, borderRadius: 20 }}
          resizeMode="cover"
        />
      </View>

      {/* Welcome header */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', marginBottom: 6 }}>
          Hi, User! 👋
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', lineHeight: 22 }}>
          Plan meals, save recipes, shop smarter.
        </Text>
      </View>

      {/* Stats cards - 3 in a row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
        {/* Recipe Library */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="book-outline" size={16} color="#4A3728" />
            <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>Recipe Library</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Saved</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', marginBottom: 12 }}>
            {recipes.length}
          </Text>
          <Pressable
            onPress={() => router.push('/recipes')}
            style={{ backgroundColor: '#E8D5C4', borderRadius: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Browse</Text>
          </Pressable>
        </View>

        {/* This Week */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="calendar-outline" size={16} color="#4A3728" />
            <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>This Week</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Planned</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', marginBottom: 12 }}>
            {plannedMealsCount}/21
          </Text>
          <Pressable
            onPress={() => router.push('/meal-plan')}
            style={{ backgroundColor: '#E8D5C4', borderRadius: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Plan</Text>
          </Pressable>
        </View>

        {/* Shopping */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="cart-outline" size={16} color="#4A3728" />
            <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>Shopping</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>To Buy</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#4A3728', marginBottom: 12 }}>
            {groceryItemsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/grocery')}
            style={{ backgroundColor: '#E8D5C4', borderRadius: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>View List</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="flash" size={18} color="#4A3728" />
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#4A3728', marginLeft: 6 }}>Quick Actions</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* Import Recipe from URL */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="link-outline" size={16} color="#4A3728" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginLeft: 6 }}>Import Recipe</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Paste a recipe URL</Text>
            <TextInput
              style={{ backgroundColor: '#F5E6D3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#4A3728', marginBottom: 10 }}
              placeholder="https://www.ica.se/recept/..."
              placeholderTextColor="#9ca3af"
              value={recipeUrl}
              onChangeText={setRecipeUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Pressable
              onPress={handleImportRecipe}
              style={{ backgroundColor: '#4A3728', borderRadius: 12, paddingVertical: 10 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Import</Text>
            </Pressable>
          </View>

          {/* What's for dinner */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="restaurant-outline" size={16} color="#4A3728" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginLeft: 6 }}>Tonight's Dinner</Text>
            </View>
            <View style={{ backgroundColor: '#F5E6D3', borderRadius: 12, padding: 14, marginBottom: 10, minHeight: 60, justifyContent: 'center' }}>
              <Text style={{ color: '#4A3728', fontSize: 15 }}>
                {todaysDinner || 'No dinner planned'}
              </Text>
            </View>
            {!todaysDinner && (
              <Pressable
                onPress={() => router.push('/meal-plan')}
                style={{ backgroundColor: '#E8D5C4', borderRadius: 12, paddingVertical: 10 }}
              >
                <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Plan Now</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Inspiration section */}
      {inspirationRecipes.length > 0 && inspirationRecipe && (
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bulb" size={18} color="#eab308" />
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#4A3728', marginLeft: 6 }}>Inspiration</Text>
            </View>
            <Pressable
              onPress={shuffleInspiration}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8D5C4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            >
              <Ionicons name="shuffle" size={16} color="#4A3728" />
              <Text style={{ color: '#4A3728', fontWeight: '600', fontSize: 13, marginLeft: 4 }}>Shuffle</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' }}
          >
            <Image
              source={{ uri: inspirationRecipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400' }}
              style={{ width: '100%', height: 140 }}
              resizeMode="cover"
            />
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4A3728' }} numberOfLines={1}>
                {inspirationRecipe.title}
              </Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {inspirationRecipe.meal_label ? inspirationRecipe.meal_label.charAt(0).toUpperCase() + inspirationRecipe.meal_label.slice(1) : ''}
                {inspirationRecipe.diet_label && ` • ${inspirationRecipe.diet_label.charAt(0).toUpperCase() + inspirationRecipe.diet_label.slice(1)}`}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <View style={{ height: 32 }} />
      </ScrollView>
    </GradientBackground>
  );
}
