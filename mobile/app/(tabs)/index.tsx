/**
 * Home screen - Luxurious dashboard with elegant typography and premium feel.
 * Inspired by high-end lifestyle apps with soft colors and refined interactions.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, borderRadius, colors, fontSize, letterSpacing, fontFamily } from '@/lib/theme';
import { useRecipes, useMealPlan, useEnhancedMode, useGroceryState } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { GradientBackground, HomeScreenSkeleton } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { Recipe, GroceryItem } from '@/lib/types';

// Local fallback image for inspiration section
const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');

// Blurhash placeholder for loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

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
  // Use Math.random() to randomize the initial seed on each app launch
  const [inspirationIndex, setInspirationIndex] = useState(() => Math.floor(Math.random() * 10000));

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

  // Show skeleton on initial load
  if (isLoading && recipes.length === 0) {
    return (
      <GradientBackground>
        <HomeScreenSkeleton />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
      {/* Elegant header with greeting */}
      <View style={{ paddingHorizontal: 20, paddingTop: 44, paddingBottom: 16 }}>
        <View>
          <Text style={{
            fontSize: fontSize['4xl'],
            fontFamily: fontFamily.display,
            color: colors.text.primary,
            letterSpacing: letterSpacing.tight,
            marginBottom: 4,
          }}>
            Good morning
          </Text>
          <Text style={{
            fontSize: fontSize.lg,
            fontFamily: fontFamily.body,
            color: colors.text.secondary,
            letterSpacing: letterSpacing.normal,
          }}>
            What shall we cook today?
          </Text>
        </View>
      </View>

      {/* Stats cards - glass effect 3-column layout */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
        {/* Recipe Library */}
        <Pressable
          onPress={() => router.push('/recipes')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            ...shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Ionicons name="book-outline" size={18} color="#8B7355" style={{ marginBottom: 8 }} />
          <Text style={{
            fontSize: fontSize['3xl'],
            fontFamily: fontFamily.bodySemibold,
            color: '#5D4E40',
            letterSpacing: letterSpacing.tight,
            marginBottom: 2,
          }}>
            {recipes.length}
          </Text>
          <Text style={{
            fontSize: fontSize.xs,
            color: '#8B7355',
            letterSpacing: letterSpacing.wide,
            textTransform: 'uppercase',
          }}>Recipes</Text>
        </Pressable>

        {/* Planned Meals */}
        <Pressable
          onPress={() => router.push('/meal-plan')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Ionicons name="calendar-outline" size={18} color="#8B7355" style={{ marginBottom: 8 }} />
          <Text style={{
            fontSize: fontSize['3xl'],
            fontFamily: fontFamily.bodySemibold,
            color: '#5D4E40',
            letterSpacing: letterSpacing.tight,
            marginBottom: 2,
          }}>
            {plannedMealsCount}
          </Text>
          <Text style={{
            fontSize: fontSize.xs,
            color: '#8B7355',
            letterSpacing: letterSpacing.wide,
            textTransform: 'uppercase',
          }}>Planned</Text>
        </Pressable>

        {/* Grocery List */}
        <Pressable
          onPress={() => router.push('/grocery')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Ionicons name="cart-outline" size={18} color="#8B7355" style={{ marginBottom: 8 }} />
          <Text style={{
            fontSize: fontSize['3xl'],
            fontFamily: fontFamily.bodySemibold,
            color: '#5D4E40',
            letterSpacing: letterSpacing.tight,
            marginBottom: 2,
          }}>
            {groceryItemsCount}
          </Text>
          <Text style={{
            fontSize: fontSize.xs,
            color: '#8B7355',
            letterSpacing: letterSpacing.wide,
            textTransform: 'uppercase',
          }}>To Buy</Text>
        </Pressable>
      </View>

      {/* Quick Add Recipe */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{
          fontSize: fontSize.xl,
          fontFamily: fontFamily.display,
          color: colors.white,
          marginBottom: 8,
          letterSpacing: letterSpacing.normal,
        }}>
          Add Recipe
        </Text>
        <View style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: 4,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="link-outline" size={18} color="#8B7355" style={{ marginLeft: 12 }} />
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: 10,
              paddingVertical: 10,
              fontSize: fontSize.md,
              color: '#5D4E40',
            }}
            placeholder="Paste recipe URL..."
            placeholderTextColor="#A89585"
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
              backgroundColor: recipeUrl.trim()
                ? (pressed ? colors.accentDark : colors.accent)
                : 'rgba(93, 78, 64, 0.15)',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginRight: 2,
            })}
          >
            <Text style={{
              color: recipeUrl.trim() ? colors.white : '#8B7355',
              fontSize: fontSize.sm,
              fontFamily: fontFamily.bodySemibold,
            }}>Import</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-recipe')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(139, 115, 85, 0.2)' : 'rgba(139, 115, 85, 0.1)',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              paddingHorizontal: 10,
              marginRight: 2,
            })}
          >
            <Ionicons name="create-outline" size={18} color="#5D4E40" />
          </Pressable>
        </View>
      </View>

      {/* Next Meal - elegant card */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{
          fontSize: fontSize.xl,
          fontFamily: fontFamily.display,
          color: colors.white,
          marginBottom: 8,
          letterSpacing: letterSpacing.normal,
        }}>
          Next Up
        </Text>

        <Pressable
          onPress={() => nextMeal?.recipeId ? router.push(`/recipe/${nextMeal.recipeId}`) : router.push('/meal-plan')}
          style={({ pressed }) => ({
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          {nextMeal?.imageUrl ? (
            <Image
              source={{ uri: nextMeal.imageUrl }}
              style={{ width: 48, height: 48, borderRadius: borderRadius.sm }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
          ) : (
            <Image
              source={HOMEPAGE_HERO}
              style={{ width: 48, height: 48, borderRadius: borderRadius.sm }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{
              fontSize: fontSize.xs,
              color: '#8B7355',
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}>
              {nextMeal
                ? `${nextMeal.isTomorrow ? "Tomorrow" : "Today"} · ${nextMeal.mealType.charAt(0).toUpperCase() + nextMeal.mealType.slice(1)}`
                : 'No meal planned'}
            </Text>
            <Text style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.bodySemibold,
              color: '#5D4E40',
            }} numberOfLines={1}>
              {nextMeal?.title || 'Plan your next meal'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8B7355" />
        </Pressable>
      </View>

      {/* Inspiration section - beautiful card */}
      {inspirationRecipes.length > 0 && inspirationRecipe ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{
              fontSize: fontSize.xl,
              fontFamily: fontFamily.display,
              color: colors.white,
              letterSpacing: letterSpacing.normal,
            }}>
              Inspiration
            </Text>
            <Pressable
              onPress={() => {
                hapticLight();
                shuffleInspiration();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: borderRadius.full,
              })}
            >
              <Ionicons name="shuffle" size={12} color="#8B7355" />
              <Text style={{
                color: '#5D4E40',
                fontFamily: fontFamily.bodyMedium,
                fontSize: fontSize.xs,
                marginLeft: 4,
              }}>Shuffle</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            style={({ pressed }) => ({
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <Image
              source={inspirationRecipe.image_url ? { uri: inspirationRecipe.image_url } : HOMEPAGE_HERO}
              style={{ width: '100%', height: 140 }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 80,
                justifyContent: 'flex-end',
                padding: 12,
              }}
            >
              <Text style={{
                fontSize: fontSize.xl,
                fontFamily: fontFamily.bodySemibold,
                color: colors.white,
                letterSpacing: letterSpacing.tight,
              }} numberOfLines={2}>
                {inspirationRecipe.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                {inspirationRecipe.meal_label && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: borderRadius.full,
                  }}>
                    <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium, color: colors.white }}>
                      {inspirationRecipe.meal_label.charAt(0).toUpperCase() + inspirationRecipe.meal_label.slice(1)}
                    </Text>
                  </View>
                )}
                {inspirationRecipe.diet_label && (
                  <View style={{
                    backgroundColor: inspirationRecipe.diet_label === 'veggie'
                      ? 'rgba(46, 125, 50, 0.8)'
                      : inspirationRecipe.diet_label === 'fish'
                        ? 'rgba(21, 101, 192, 0.8)'
                        : 'rgba(198, 40, 40, 0.8)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: borderRadius.full,
                  }}>
                    <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium, color: colors.white }}>
                      {inspirationRecipe.diet_label.charAt(0).toUpperCase() + inspirationRecipe.diet_label.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        /* Fallback: Get Started section with hero image when no recipes */
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{
            fontSize: fontSize['4xl'],
            fontFamily: fontFamily.display,
            color: colors.white,
            marginBottom: 8,
            letterSpacing: letterSpacing.tight,
          }}>
            Get Started
          </Text>

          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => ({
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <Image
              source={HOMEPAGE_HERO}
              style={{ width: '100%', height: 140 }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 80,
                justifyContent: 'flex-end',
                padding: 12,
              }}
            >
              <Text style={{
                fontSize: fontSize.xl,
                fontWeight: '600',
                color: colors.white,
                letterSpacing: letterSpacing.tight,
              }} numberOfLines={2}>
                Add your first recipe
              </Text>
              <Text style={{
                fontSize: fontSize.sm,
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: 4,
              }}>
                Paste a URL above to import
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      </ScrollView>
    </GradientBackground>
  );
}
