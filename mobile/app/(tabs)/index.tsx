/**
 * Home screen - Luxurious dashboard with elegant typography and premium feel.
 * Inspired by high-end lifestyle apps with soft colors and refined interactions.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GradientBackground, HomeScreenSkeleton } from '@/components';
import { hapticLight } from '@/lib/haptics';
import {
  useEnhancedMode,
  useGroceryState,
  useMealPlan,
  useRecipes,
} from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';
import type { GroceryItem, Recipe } from '@/lib/types';

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

function getNextMeal(
  mealPlan: { meals?: Record<string, string> } | undefined,
  recipes: Recipe[],
): {
  title: string;
  imageUrl?: string;
  isCustom: boolean;
  mealType: string;
  recipeId?: string;
  isTomorrow?: boolean;
} | null {
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
      const recipe = recipes.find((r) => r.id === value);
      if (recipe) {
        return {
          title: recipe.title,
          imageUrl: recipe.image_url || undefined,
          isCustom: false,
          mealType,
          recipeId: recipe.id,
        };
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
        return {
          title: value.slice(7),
          isCustom: true,
          mealType,
          isTomorrow: true,
        };
      }
      const recipe = recipes.find((r) => r.id === value);
      if (recipe) {
        return {
          title: recipe.title,
          imageUrl: recipe.image_url || undefined,
          isCustom: false,
          mealType,
          recipeId: recipe.id,
          isTomorrow: true,
        };
      }
    }
  }

  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();
  const {
    data: recipes = [],
    isLoading: recipesLoading,
    refetch: refetchRecipes,
  } = useRecipes(undefined, isEnhanced);
  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useMealPlan();
  const { checkedItems, selectedMealKeys, customItems, refreshFromStorage } =
    useGroceryState();
  const { isItemAtHome } = useSettings();
  const [recipeUrl, setRecipeUrl] = useState('');
  // Use Math.random() to randomize the initial seed on each app launch
  const [inspirationIndex, setInspirationIndex] = useState(() =>
    Math.floor(Math.random() * 10000),
  );

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
      return customItems.filter(
        (name) => !checkedItems.has(name) && !isItemAtHome(name),
      ).length;
    }

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const ingredientNames = new Set<string>();

    selectedMealKeys.forEach((key) => {
      const recipeId = mealPlan.meals?.[key];
      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach((ingredient) => {
        const name = ingredient
          .toLowerCase()
          .trim()
          .replace(/\s*\(steg\s*\d+\)\s*$/i, '')
          .replace(/\s*\(step\s*\d+\)\s*$/i, '')
          .replace(/\s+till\s+\w+$/i, '');
        ingredientNames.add(name);
      });
    });

    // Add custom items
    customItems.forEach((name) => ingredientNames.add(name));

    // Filter out items at home and checked items, return unchecked count
    let uncheckedCount = 0;
    ingredientNames.forEach((name) => {
      if (!isItemAtHome(name) && !checkedItems.has(name)) {
        uncheckedCount++;
      }
    });

    return uncheckedCount;
  }, [
    mealPlan,
    selectedMealKeys,
    recipes,
    customItems,
    checkedItems,
    isItemAtHome,
  ]);

  // Filter inspiration recipes (exclude meal and grill categories - starters, desserts, drinks, sauces, pickles, breakfast)
  const inspirationRecipes = useMemo(() => {
    return recipes.filter(
      (recipe: Recipe) =>
        recipe.meal_label &&
        recipe.meal_label !== 'meal' &&
        recipe.meal_label !== 'grill',
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
  const plannedMealsCount = mealPlan?.meals
    ? Object.keys(mealPlan.meals).length
    : 0;
  const nextMeal = getNextMeal(mealPlan, recipes);

  const handleImportRecipe = () => {
    if (recipeUrl.trim()) {
      router.push({
        pathname: '/add-recipe',
        params: { url: recipeUrl.trim() },
      });
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
    <GradientBackground variant="soft">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Elegant header with greeting */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize['6xl'],
                  fontFamily: fontFamily.display,
                  fontWeight: '300',
                  color: colors.text.primary,
                  letterSpacing: letterSpacing.tighter,
                  marginBottom: 4,
                }}
              >
                Good morning
              </Text>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  color: colors.text.secondary,
                  letterSpacing: letterSpacing.normal,
                }}
              >
                What shall we cook today?
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.sm,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.text.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* Stats cards - elegant 3-column layout */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Recipe Library */}
          <Pressable
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: 16,
              ...shadows.md,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              style={{
                backgroundColor: colors.category.recipes.bg,
                borderRadius: borderRadius.sm,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={colors.category.recipes.text}
              />
            </View>
            <Text
              style={{
                fontSize: fontSize['5xl'],
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
                marginBottom: 2,
              }}
            >
              {recipes.length}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.text.secondary,
                letterSpacing: letterSpacing.wide,
                textTransform: 'uppercase',
              }}
            >
              Recipes
            </Text>
          </Pressable>

          {/* Planned Meals */}
          <Pressable
            onPress={() => router.push('/meal-plan')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: 16,
              ...shadows.md,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              style={{
                backgroundColor: colors.category.planned.bg,
                borderRadius: borderRadius.sm,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.category.planned.text}
              />
            </View>
            <Text
              style={{
                fontSize: fontSize['5xl'],
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
                marginBottom: 2,
              }}
            >
              {plannedMealsCount}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.text.secondary,
                letterSpacing: letterSpacing.wide,
                textTransform: 'uppercase',
              }}
            >
              Planned
            </Text>
          </Pressable>

          {/* Grocery List */}
          <Pressable
            onPress={() => router.push('/grocery')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: 16,
              ...shadows.md,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              style={{
                backgroundColor: colors.category.grocery.bg,
                borderRadius: borderRadius.sm,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="cart-outline"
                size={18}
                color={colors.category.grocery.text}
              />
            </View>
            <Text
              style={{
                fontSize: fontSize['5xl'],
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
                marginBottom: 2,
              }}
            >
              {groceryItemsCount}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.text.secondary,
                letterSpacing: letterSpacing.wide,
                textTransform: 'uppercase',
              }}
            >
              To Buy
            </Text>
          </Pressable>
        </View>

        {/* Quick Add Recipe */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontFamily: fontFamily.display,
              fontWeight: '600',
              color: colors.text.primary,
              marginBottom: 12,
              letterSpacing: letterSpacing.normal,
            }}
          >
            Add Recipe
          </Text>
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: 6,
              ...shadows.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: colors.bgWarm,
                borderRadius: borderRadius.sm,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Ionicons name="link-outline" size={20} color={colors.accent} />
            </View>
            <TextInput
              style={{
                flex: 1,
                paddingHorizontal: 8,
                paddingVertical: 12,
                fontSize: fontSize.lg,
                color: colors.text.primary,
              }}
              placeholder="Paste recipe URL..."
              placeholderTextColor={colors.text.muted}
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
                  ? pressed
                    ? colors.accentDark
                    : colors.accent
                  : colors.gray[200],
                borderRadius: borderRadius.sm,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginRight: 2,
              })}
            >
              <Text
                style={{
                  color: recipeUrl.trim() ? colors.white : colors.text.muted,
                  fontSize: fontSize.md,
                  fontWeight: '600',
                }}
              >
                Import
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Next Meal - elegant card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontFamily: fontFamily.display,
              fontWeight: '600',
              color: colors.text.primary,
              marginBottom: 12,
              letterSpacing: letterSpacing.normal,
            }}
          >
            Next Up
          </Text>

          <Pressable
            onPress={() =>
              nextMeal?.recipeId
                ? router.push(`/recipe/${nextMeal.recipeId}`)
                : router.push('/meal-plan')
            }
            style={({ pressed }) => ({
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: 16,
              ...shadows.md,
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            {nextMeal?.imageUrl ? (
              <Image
                source={{ uri: nextMeal.imageUrl }}
                style={{ width: 56, height: 56, borderRadius: borderRadius.sm }}
                contentFit="cover"
                placeholder={PLACEHOLDER_BLURHASH}
                transition={200}
              />
            ) : (
              <View
                style={{
                  backgroundColor: colors.category.planned.bg,
                  borderRadius: borderRadius.sm,
                  width: 56,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.category.planned.text}
                />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: letterSpacing.wide,
                }}
              >
                {nextMeal
                  ? `${nextMeal.isTomorrow ? 'Tomorrow' : 'Today'} · ${nextMeal.mealType.charAt(0).toUpperCase() + nextMeal.mealType.slice(1)}`
                  : 'No meal planned'}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: '600',
                  color: nextMeal ? colors.text.primary : colors.text.muted,
                }}
                numberOfLines={1}
              >
                {nextMeal?.title || 'Plan your next meal'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.light}
            />
          </Pressable>
        </View>

        {/* Inspiration section - beautiful card */}
        {inspirationRecipes.length > 0 && inspirationRecipe && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize['2xl'],
                  fontFamily: fontFamily.display,
                  fontWeight: '600',
                  color: colors.text.primary,
                  letterSpacing: letterSpacing.normal,
                }}
              >
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
                  backgroundColor: pressed
                    ? colors.gray[200]
                    : colors.gray[100],
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: borderRadius.full,
                })}
              >
                <Ionicons
                  name="shuffle"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontWeight: '500',
                    fontSize: fontSize.sm,
                    marginLeft: 6,
                  }}
                >
                  Shuffle
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
              style={({ pressed }) => ({
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                ...shadows.lg,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Image
                source={{
                  uri:
                    inspirationRecipe.image_url ||
                    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400',
                }}
                style={{ width: '100%', height: 180 }}
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
                  height: 100,
                  justifyContent: 'flex-end',
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize['3xl'],
                    fontWeight: '600',
                    color: colors.white,
                    letterSpacing: letterSpacing.tight,
                  }}
                  numberOfLines={2}
                >
                  {inspirationRecipe.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  {inspirationRecipe.meal_label && (
                    <View
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: borderRadius.full,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          fontWeight: '500',
                          color: colors.white,
                        }}
                      >
                        {inspirationRecipe.meal_label.charAt(0).toUpperCase() +
                          inspirationRecipe.meal_label.slice(1)}
                      </Text>
                    </View>
                  )}
                  {inspirationRecipe.diet_label && (
                    <View
                      style={{
                        backgroundColor:
                          inspirationRecipe.diet_label === 'veggie'
                            ? 'rgba(46, 125, 50, 0.8)'
                            : inspirationRecipe.diet_label === 'fish'
                              ? 'rgba(21, 101, 192, 0.8)'
                              : 'rgba(198, 40, 40, 0.8)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: borderRadius.full,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          fontWeight: '500',
                          color: colors.white,
                        }}
                      >
                        {inspirationRecipe.diet_label.charAt(0).toUpperCase() +
                          inspirationRecipe.diet_label.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
