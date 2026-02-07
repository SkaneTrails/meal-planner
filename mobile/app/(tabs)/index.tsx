/**
 * Home screen - Luxurious dashboard with elegant typography and premium feel.
 * Inspired by high-end lifestyle apps with soft colors and refined interactions.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, borderRadius, colors, fontSize, letterSpacing, fontFamily } from '@/lib/theme';
import { useRecipes, useMealPlan, useGroceryState } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { AnimatedPressable, GradientBackground, HomeScreenSkeleton } from '@/components';
import { hapticLight } from '@/lib/haptics';
import { useTranslation } from '@/lib/i18n';
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

// Get time-based greeting key
function getGreetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useRecipes();
  const { data: mealPlan, isLoading: mealPlanLoading, refetch: refetchMealPlan } = useMealPlan();
  const { checkedItems, selectedMealKeys, customItems, refreshFromStorage } = useGroceryState();
  const { isItemAtHome } = useSettings();
  const { t } = useTranslation();
  const [recipeUrl, setRecipeUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  // Use Math.random() to randomize the initial seed on each app launch
  const [inspirationIndex, setInspirationIndex] = useState(() => Math.floor(Math.random() * 10000));
  // Get time-based greeting (re-calculate on component mount)
  const greetingKey = useMemo(() => getGreetingKey(), []);

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
      {/* Elegant header with greeting and settings */}
      <View style={{ paddingHorizontal: 20, paddingTop: 44, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontFamily: fontFamily.display,
              color: colors.text.primary,
              letterSpacing: letterSpacing.tight,
              marginBottom: 4,
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {t(`home.${greetingKey}` as const)}
            </Text>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.body,
              color: colors.text.secondary,
              letterSpacing: letterSpacing.normal,
            }}>
              {t('home.subtitle')}
            </Text>
          </View>
          {/* Settings button */}
          <AnimatedPressable
            onPress={() => {
              hapticLight();
              router.push('/settings');
            }}
            hoverScale={1.08}
            pressScale={0.95}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.glass.card,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#5D4E40" />
          </AnimatedPressable>
        </View>
      </View>

      {/* Stats cards - glass effect 3-column layout */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
        {/* Recipe Library */}
        <AnimatedPressable
          onPress={() => router.push('/recipes')}
          hoverScale={1.03}
          pressScale={0.97}
          style={{
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            ...shadows.sm,
          }}
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
          }}>{t('home.stats.recipes')}</Text>
        </AnimatedPressable>

        {/* Planned Meals */}
        <AnimatedPressable
          onPress={() => router.push('/meal-plan')}
          hoverScale={1.03}
          pressScale={0.97}
          style={{
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            ...shadows.sm,
          }}
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
          }}>{t('home.stats.planned')}</Text>
        </AnimatedPressable>

        {/* Grocery List */}
        <AnimatedPressable
          onPress={() => router.push('/grocery')}
          hoverScale={1.03}
          pressScale={0.97}
          style={{
            flex: 1,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            ...shadows.sm,
          }}
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
          }}>{t('home.stats.toBuy')}</Text>
        </AnimatedPressable>
      </View>

      {/* Add Recipe - Single CTA Button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <AnimatedPressable
          onPress={() => {
            hapticLight();
            setShowAddModal(true);
          }}
          hoverScale={1.02}
          pressScale={0.97}
          style={{
            backgroundColor: '#7A6858',
            borderRadius: borderRadius.md,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.md,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={{
            color: colors.white,
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
          }}>{t('home.addRecipe.title')}</Text>
        </AnimatedPressable>
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
          {t('home.nextUp.title')}
        </Text>

        <AnimatedPressable
          onPress={() => nextMeal?.recipeId ? router.push(`/recipe/${nextMeal.recipeId}`) : router.push('/meal-plan')}
          hoverScale={1.01}
          pressScale={0.99}
          style={{
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {nextMeal?.imageUrl ? (
            <Image
              source={{ uri: nextMeal.imageUrl }}
              style={{ width: 64, height: 64, borderRadius: borderRadius.md }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
          ) : (
            <Image
              source={HOMEPAGE_HERO}
              style={{ width: 64, height: 64, borderRadius: borderRadius.md }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {nextMeal && !nextMeal.isTomorrow && (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E07B54', marginRight: 6 }} />
              )}
              <Text style={{
                fontSize: fontSize.xs,
                color: nextMeal && !nextMeal.isTomorrow ? '#5D4E40' : '#8B7355',
                fontFamily: nextMeal && !nextMeal.isTomorrow ? fontFamily.bodySemibold : fontFamily.body,
                textTransform: 'uppercase',
                letterSpacing: letterSpacing.wide,
              }}>
                {nextMeal
                  ? `${nextMeal.isTomorrow ? t('home.nextUp.tomorrow') : t('home.nextUp.today')} · ${t(`labels.mealTime.${nextMeal.mealType}` as any)}`
                  : t('home.nextUp.noMealPlanned')}
              </Text>
            </View>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodySemibold,
              color: '#5D4E40',
            }} numberOfLines={1}>
              {nextMeal?.title || t('home.nextUp.planYourNextMeal')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8B7355" />
        </AnimatedPressable>
      </View>

      {/* Inspiration section - beautiful card */}
      {inspirationRecipes.length > 0 && inspirationRecipe ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{
              fontSize: fontSize['2xl'],
              fontFamily: fontFamily.display,
              color: colors.white,
              letterSpacing: letterSpacing.normal,
            }}>
              {t('home.inspiration.title')}
            </Text>
            <AnimatedPressable
              onPress={() => {
                hapticLight();
                shuffleInspiration();
              }}
              hoverScale={1.05}
              pressScale={0.95}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: borderRadius.full,
              }}
            >
              <Ionicons name="shuffle" size={12} color="#8B7355" />
              <Text style={{
                color: '#5D4E40',
                fontFamily: fontFamily.bodyMedium,
                fontSize: fontSize.xs,
                marginLeft: 4,
              }}>{t('home.inspiration.shuffle')}</Text>
            </AnimatedPressable>
          </View>

          <AnimatedPressable
            onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            hoverScale={1.01}
            pressScale={0.99}
            style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
            }}
          >
            <Image
              source={inspirationRecipe.image_url ? { uri: inspirationRecipe.image_url } : HOMEPAGE_HERO}
              style={{ width: '100%', height: 160 }}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              transition={200}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
                justifyContent: 'flex-end',
                padding: 14,
              }}
            >
              <Text style={{
                fontSize: fontSize['2xl'],
                fontFamily: fontFamily.bodySemibold,
                color: colors.white,
                letterSpacing: letterSpacing.tight,
              }} numberOfLines={2}>
                {inspirationRecipe.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                {inspirationRecipe.meal_label && (
                  <View style={{
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.5)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: borderRadius.full,
                  }}>
                    <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium, color: 'rgba(255,255,255,0.9)' }}>
                      {t(`labels.meal.${inspirationRecipe.meal_label}` as any)}
                    </Text>
                  </View>
                )}
                {inspirationRecipe.diet_label && (
                  <View style={{
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: inspirationRecipe.diet_label === 'veggie'
                      ? 'rgba(76, 175, 80, 0.7)'
                      : inspirationRecipe.diet_label === 'fish'
                        ? 'rgba(66, 165, 245, 0.7)'
                        : 'rgba(229, 115, 115, 0.7)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: borderRadius.full,
                  }}>
                    <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium, color: 'rgba(255,255,255,0.9)' }}>
                      {t(`labels.diet.${inspirationRecipe.diet_label}` as any)}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </AnimatedPressable>
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
            {t('home.getStarted.title')}
          </Text>

          <AnimatedPressable
            onPress={() => router.push('/recipes')}
            hoverScale={1.01}
            pressScale={0.99}
            style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
            }}
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
                {t('home.getStarted.addFirstRecipe')}
              </Text>
              <Text style={{
                fontSize: fontSize.sm,
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: 4,
              }}>
                {t('home.getStarted.pasteUrl')}
              </Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      )}

      </ScrollView>

      {/* Add Recipe Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#F5EDE5',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#C4B5A6', borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#5D4E40', paddingHorizontal: 20, marginBottom: 16 }}>
              {t('home.addRecipe.title')}
            </Text>

            {/* Import from URL option */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
                    paddingVertical: 12,
                    fontSize: fontSize.md,
                    color: '#5D4E40',
                  }}
                  placeholder={t('home.addRecipe.placeholder')}
                  placeholderTextColor="#A89585"
                  value={recipeUrl}
                  onChangeText={setRecipeUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onSubmitEditing={() => {
                    if (recipeUrl.trim()) {
                      setShowAddModal(false);
                      handleImportRecipe();
                    }
                  }}
                  returnKeyType="go"
                />
                <Pressable
                  onPress={() => {
                    if (recipeUrl.trim()) {
                      setShowAddModal(false);
                      handleImportRecipe();
                    }
                  }}
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
                  }}>{t('home.addRecipe.importButton')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#D4C5B5' }} />
              <Text style={{ color: '#8B7355', fontSize: fontSize.sm, marginHorizontal: 12 }}>{t('common.or')}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#D4C5B5' }} />
            </View>

            {/* Manual entry option */}
            <Pressable
              onPress={() => {
                setShowAddModal(false);
                router.push({ pathname: '/add-recipe', params: { manual: 'true' } });
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
              })}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(139, 115, 85, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                <Ionicons name="create-outline" size={20} color="#5D4E40" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: '#5D4E40' }}>
                  {t('home.addRecipe.manualEntry')}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: 2 }}>
                  {t('home.addRecipe.manualEntryDesc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8B7355" />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </GradientBackground>
  );
}
