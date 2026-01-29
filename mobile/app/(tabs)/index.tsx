/**
 * Home screen - Dashboard with stats and quick actions.
 * Food delivery app inspired design with gradient background.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useMealPlan, useGroceryList, useEnhancedMode } from '@/lib/hooks';
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

function getTodaysDinner(mealPlan: { meals?: Record<string, string> } | undefined, recipes: Recipe[]): { title: string; imageUrl?: string; isCustom: boolean } | null {
  if (!mealPlan?.meals) return null;
  const today = formatDateLocal(new Date());
  const dinnerKey = `${today}_dinner`;
  const dinnerValue = mealPlan.meals[dinnerKey];
  if (!dinnerValue) return null;
  if (dinnerValue.startsWith('custom:')) {
    return { title: dinnerValue.slice(7), isCustom: true };
  }
  const recipe = recipes.find(r => r.id === dinnerValue);
  if (recipe) {
    return { title: recipe.title, imageUrl: recipe.image_url || undefined, isCustom: false };
  }
  return null;
}

function getNextMeal(mealPlan: { meals?: Record<string, string> } | undefined, recipes: Recipe[]): { title: string; imageUrl?: string; isCustom: boolean; mealType: string; recipeId?: string } | null {
  if (!mealPlan?.meals) return null;
  const now = new Date();
  const today = formatDateLocal(now);
  const currentHour = now.getHours();
  
  // Determine which meal is "next"
  // Before 12: show lunch, after 12: show dinner
  const mealTypes = currentHour < 12 ? ['lunch', 'dinner'] : ['dinner'];
  
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
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useRecipes(undefined, isEnhanced);
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
        <View style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: 150,
          backgroundColor: 'transparent',
          backgroundImage: 'linear-gradient(to bottom, rgba(232, 213, 196, 0), rgba(232, 213, 196, 0.5), #E8D5C4)'
        }} />
        
        {/* Welcome text on image */}
        <View style={{ position: 'absolute', bottom: 36, left: 24, right: 24 }}>
          <Text style={{ fontSize: 34, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5, textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
            Hi there! 👋
          </Text>
          <Text style={{ fontSize: 17, color: '#FFFFFF', lineHeight: 24, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
            Plan meals, save recipes, shop smarter.
          </Text>
        </View>
      </View>

      {/* Stats cards - 3 in a row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: -10 }}>
        {/* Recipe Library */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
          <View style={{ backgroundColor: '#F3E8E0', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="book" size={20} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Saved</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#4A3728', marginBottom: 12, letterSpacing: -1 }}>
            {recipes.length}
          </Text>
          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#E8D5C4' : '#F3E8E0', 
              borderRadius: 12, 
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Browse</Text>
          </Pressable>
        </View>

        {/* This Week */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
          <View style={{ backgroundColor: '#E8F0E8', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="calendar" size={20} color="#2D5A3D" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Planned</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#2D5A3D', marginBottom: 12, letterSpacing: -1 }}>
            {plannedMealsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/meal-plan')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#D4E4D4' : '#E8F0E8', 
              borderRadius: 12, 
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#2D5A3D', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Plan</Text>
          </Pressable>
        </View>

        {/* Shopping */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
          <View style={{ backgroundColor: '#E8E8F0', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="cart" size={20} color="#3D3D5A" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>To Buy</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#3D3D5A', marginBottom: 12, letterSpacing: -1 }}>
            {groceryItemsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/grocery')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#D4D4E4' : '#E8E8F0', 
              borderRadius: 12, 
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#3D3D5A', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>View List</Text>
          </Pressable>
        </View>
      </View>

      {/* Add a Recipe */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ backgroundColor: '#E8D5C4', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add-circle" size={16} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Add a Recipe</Text>
        </View>

        {/* Import Recipe - single line */}
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: 4,
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.06, 
          shadowRadius: 8, 
          elevation: 2,
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
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ backgroundColor: '#E8F0E8', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="restaurant" size={16} color="#2D5A3D" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Next Up</Text>
        </View>

        {/* Next meal - clickable card */}
        <Pressable
          onPress={() => nextMeal?.recipeId ? router.push(`/recipe/${nextMeal.recipeId}`) : router.push('/meal-plan')}
          style={({ pressed }) => ({ 
            backgroundColor: pressed ? '#F9F5F0' : '#fff', 
            borderRadius: 16, 
            padding: 12,
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.06, 
            shadowRadius: 8, 
            elevation: 2,
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
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
              {nextMeal ? `Today's ${nextMeal.mealType.charAt(0).toUpperCase() + nextMeal.mealType.slice(1)}` : 'No meal planned'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: nextMeal ? '#4A3728' : '#9ca3af' }} numberOfLines={1}>
              {nextMeal?.title || 'Plan your next meal'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Inspiration section */}
      {inspirationRecipes.length > 0 && inspirationRecipe && (
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#DBEAFE', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb" size={16} color="#1E40AF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Inspiration</Text>
            </View>
            <Pressable
              onPress={shuffleInspiration}
              style={({ pressed }) => ({ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: pressed ? '#BFDBFE' : '#DBEAFE', 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Ionicons name="shuffle" size={14} color="#1E40AF" />
              <Text style={{ color: '#1E40AF', fontWeight: '600', fontSize: 13, marginLeft: 6 }}>Shuffle</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            style={({ pressed }) => ({ 
              backgroundColor: '#fff', 
              borderRadius: 22, 
              overflow: 'hidden', 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.12, 
              shadowRadius: 12, 
              elevation: 5,
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
