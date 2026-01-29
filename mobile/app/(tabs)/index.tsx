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
          <View style={{ backgroundColor: '#F5E6D3', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="book" size={20} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Saved</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#4A3728', marginBottom: 12, letterSpacing: -1 }}>
            {recipes.length}
          </Text>
          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#D4C4B0' : '#E8D5C4', 
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
          <View style={{ backgroundColor: '#F5E6D3', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="calendar" size={20} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Planned</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#4A3728', marginBottom: 12, letterSpacing: -1 }}>
            {plannedMealsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/meal-plan')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#D4C4B0' : '#E8D5C4', 
              borderRadius: 12, 
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Plan</Text>
          </Pressable>
        </View>

        {/* Shopping */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
          <View style={{ backgroundColor: '#F5E6D3', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="cart" size={20} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>To Buy</Text>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#4A3728', marginBottom: 12, letterSpacing: -1 }}>
            {groceryItemsCount}
          </Text>
          <Pressable
            onPress={() => router.push('/grocery')}
            style={({ pressed }) => ({ 
              backgroundColor: pressed ? '#D4C4B0' : '#E8D5C4', 
              borderRadius: 12, 
              paddingVertical: 10,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>View List</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ backgroundColor: '#E8D5C4', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flash" size={16} color="#4A3728" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Quick Actions</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {/* Import Recipe from URL */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: '#F5E6D3', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="link" size={16} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginLeft: 10 }}>Import Recipe</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Paste a recipe URL</Text>
            <TextInput
              style={{ backgroundColor: '#F9F5F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#4A3728', marginBottom: 12, borderWidth: 1, borderColor: '#E8D5C4' }}
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
              style={({ pressed }) => ({ 
                backgroundColor: pressed ? '#3D2D1F' : '#4A3728', 
                borderRadius: 12, 
                paddingVertical: 12,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: '#4A3728',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              })}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Import</Text>
            </Pressable>
          </View>

          {/* What's for dinner */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: '#F5E6D3', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="restaurant" size={16} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginLeft: 10 }}>Tonight's Dinner</Text>
            </View>
            <View style={{ backgroundColor: '#F9F5F0', borderRadius: 14, padding: 16, marginBottom: 12, minHeight: 64, justifyContent: 'center', borderWidth: 1, borderColor: '#E8D5C4' }}>
              <Text style={{ color: todaysDinner ? '#4A3728' : '#9ca3af', fontSize: 15, fontWeight: todaysDinner ? '500' : '400' }}>
                {todaysDinner || 'No dinner planned yet'}
              </Text>
            </View>
            {!todaysDinner && (
              <Pressable
                onPress={() => router.push('/meal-plan')}
                style={({ pressed }) => ({ 
                  backgroundColor: pressed ? '#D4C4B0' : '#E8D5C4', 
                  borderRadius: 12, 
                  paddingVertical: 12,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ color: '#4A3728', textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Plan Now</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Inspiration section */}
      {inspirationRecipes.length > 0 && inspirationRecipe && (
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#E8D5C4', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb" size={16} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728', marginLeft: 10, letterSpacing: -0.3 }}>Inspiration</Text>
            </View>
            <Pressable
              onPress={shuffleInspiration}
              style={({ pressed }) => ({ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: pressed ? '#D4C4B0' : '#E8D5C4', 
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 20,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Ionicons name="shuffle" size={14} color="#4A3728" />
              <Text style={{ color: '#4A3728', fontWeight: '600', fontSize: 13, marginLeft: 6 }}>Shuffle</Text>
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
