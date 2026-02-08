/**
 * Select Recipe modal - Choose a recipe for a meal slot.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing, iconContainer, fontFamily } from '@/lib/theme';
import { GradientBackground, RecipeCard } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import { useRecipes, useSetMeal, useRemoveMeal, useMealPlan } from '@/lib/hooks';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { formatDateLocal, toBcp47 } from '@/lib/utils/dateFormatter';
import type { MealType, Recipe } from '@/lib/types';

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
  const { date, mealType, mode, initialText } = useLocalSearchParams<{
    date: string;
    mealType: MealType;
    mode?: 'library' | 'copy' | 'quick' | 'random';
    initialText?: string;
  }>();
  const router = useRouter();

  const { data: recipes = [] } = useRecipes();
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();
  const { t, language } = useTranslation();

  // Moved inside component so labels use translated strings
  const MEAL_TYPE_LABELS: Record<MealType, string> = useMemo(() => ({
    breakfast: t('selectRecipe.mealTypeLabels.breakfast'),
    lunch: t('selectRecipe.mealTypeLabels.lunch'),
    dinner: t('selectRecipe.mealTypeLabels.dinner'),
    snack: t('selectRecipe.mealTypeLabels.snack'),
  }), [t]);

  // Initialize tab based on mode param, default to library
  const [activeTab, setActiveTab] = useState<TabType>(
    mode === 'copy' ? 'copy' : mode === 'random' ? 'random' : mode === 'quick' ? 'quick' : 'library'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState(initialText || '');
  const [randomSeed, setRandomSeed] = useState(0); // Used to trigger new random selection
  const [copyWeekOffset, setCopyWeekOffset] = useState(0); // Week offset for copy tab

  // Update activeTab when mode param changes (e.g., navigating from different buttons)
  useEffect(() => {
    if (mode) {
      setActiveTab(mode);
    }
    // Reset custom text when mode changes (except if initialText is provided)
    if (mode !== 'quick' || !initialText) {
      setCustomText('');
    }
  }, [mode, initialText]);

  // Pre-fill custom text when initialText is provided (editing existing custom meal)
  useEffect(() => {
    if (initialText) {
      setCustomText(initialText);
    }
  }, [initialText]);

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

  // Get target week date range based on the date being modified (not current week)
  const targetWeekDates = useMemo(() => {
    const targetDate = new Date(date + 'T00:00:00');
    const targetDay = targetDate.getDay();
    const daysSinceMonday = (targetDay + 6) % 7;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysSinceMonday + copyWeekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { start: formatDateLocal(monday), end: formatDateLocal(sunday), mondayDate: monday, sundayDate: sunday };
  }, [date, copyWeekOffset]);

  // Get existing meals from meal plan that can be copied (from the week being modified)
  const existingMeals = useMemo(() => {
    if (!mealPlan?.meals) return [];

    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const meals: { key: string; date: string; mealType: string; recipe?: Recipe; customText?: string }[] = [];

    Object.entries(mealPlan.meals).forEach(([key, value]) => {
      const [dateStr, type] = key.split('_');
      // Don't show the current slot we're trying to fill
      if (key === `${date}_${mealType}`) return;

      // Only show meals from the week being modified
      if (dateStr < targetWeekDates.start || dateStr > targetWeekDates.end) return;

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
  }, [mealPlan, recipes, date, mealType, targetWeekDates]);

  const bcp47 = toBcp47(language);
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(bcp47, {
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
      // Navigate back to meal plan after selecting a recipe
      router.replace('/(tabs)/meal-plan');
    } catch (err) {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
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
      // Clear the text and navigate back to meal plan
      setCustomText('');
      router.replace('/(tabs)/meal-plan');
    } catch (err) {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
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
      // Navigate back to meal plan after copying
      router.replace('/(tabs)/meal-plan');
    } catch (err) {
      showNotification(t('common.error'), t('selectRecipe.failedToCopyMeal'));
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      router.back();
    } catch (err) {
      showNotification(t('common.error'), t('selectRecipe.failedToRemoveMeal'));
    }
  };

  const formatMealDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(bcp47, { weekday: 'short', month: 'short', day: 'numeric' });
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
                  fontFamily: fontFamily.bodySemibold,
                  color: activeTab === 'library' ? colors.white : colors.text.inverse
                }}>
                  {t('selectRecipe.tabs.library')}
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
                  fontFamily: fontFamily.bodySemibold,
                  color: activeTab === 'random' ? colors.white : colors.text.inverse
                }}>
                  {t('selectRecipe.tabs.random')}
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
                  fontFamily: fontFamily.bodySemibold,
                  color: activeTab === 'quick' ? colors.white : colors.text.inverse
                }}>
                  {t('selectRecipe.tabs.quick')}
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
                  fontFamily: fontFamily.bodySemibold,
                  color: activeTab === 'copy' ? colors.white : colors.text.inverse
                }}>
                  {t('selectRecipe.tabs.copy')}
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
                  {t('selectRecipe.quick.title')}
                </Text>
                <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }}>
                  {t('selectRecipe.quick.placeholder')}
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
                placeholder={t('selectRecipe.quickPlaceholder')}
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
                  {t('selectRecipe.quick.addButton')}
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
                  placeholder={t('selectRecipe.searchPlaceholder')}
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
                <EmptyState
                  icon={searchQuery ? "search" : "book-outline"}
                  title={searchQuery ? t('selectRecipe.empty.noMatches') : t('selectRecipe.empty.noRecipes')}
                  subtitle={searchQuery ? t('selectRecipe.empty.tryDifferent') : t('selectRecipe.empty.addRecipesFirst')}
                  action={{
                    label: t('selectRecipe.empty.addRecipeButton'),
                    onPress: () => {
                      router.back();
                      router.push('/add-recipe');
                    },
                  }}
                />
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
                    {t('selectRecipe.random.howAbout')}
                  </Text>
                  <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }}>
                    {t('selectRecipe.random.matchCount', { count: mealTypeRecipes.length })} {MEAL_TYPE_LABELS[mealType].toLowerCase()}
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
                              {t('selectRecipe.random.time', { count: randomRecipe.total_time })}
                            </Text>
                          </View>
                        )}
                        {randomRecipe.servings && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="people-outline" size={16} color={colors.gray[500]} />
                            <Text style={{ fontSize: fontSize.md, color: colors.gray[600] }}>
                              {t('selectRecipe.random.servings', { count: randomRecipe.servings })}
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
                              {randomRecipe.diet_label === 'veggie' ? `🥬 ${t('labels.diet.veggie')}` :
                               randomRecipe.diet_label === 'fish' ? `🐟 ${t('labels.diet.fish')}` : `🥩 ${t('labels.diet.meat')}`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Ingredients preview */}
                      {randomRecipe.ingredients && randomRecipe.ingredients.length > 0 && (
                        <View>
                          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.gray[600], marginBottom: spacing.xs }}>
                            {t('selectRecipe.random.ingredientsCount', { count: randomRecipe.ingredients.length })}
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
                      {t('selectRecipe.random.shuffle')}
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
                      {t('selectRecipe.random.addToPlan')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* No recipes for this meal type */
              <EmptyState
                icon="dice-outline"
                title={t('selectRecipe.random.noRecipes', { mealType: MEAL_TYPE_LABELS[mealType].toLowerCase() })}
                subtitle={t('selectRecipe.random.addRecipesHint', { mealType: MEAL_TYPE_LABELS[mealType].toLowerCase() })}
                style={{ paddingVertical: spacing['4xl'] }}
              />
            )}
          </ScrollView>
        ) : (
          /* Copy from existing meals */
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
            <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginBottom: spacing.md }}>
              {t('selectRecipe.copy.title')}
            </Text>

            {/* Week selector */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
              gap: spacing.sm,
            }}>
              <Pressable
                onPress={() => setCopyWeekOffset(prev => prev - 1)}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text.inverse} />
              </Pressable>
              <View style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.sm,
              }}>
                <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse, textAlign: 'center' }}>
                  {targetWeekDates.mondayDate.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' })} - {targetWeekDates.sundayDate.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Pressable
                onPress={() => setCopyWeekOffset(prev => prev + 1)}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
              </Pressable>
            </View>

            {existingMeals.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title={t('selectRecipe.copy.noMeals')}
                subtitle={t('selectRecipe.copy.planFirst')}
                style={{ paddingVertical: spacing['4xl'] }}
              />
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
                      {formatMealDate(meal.date)} · {MEAL_TYPE_LABELS[meal.mealType as MealType] || meal.mealType}
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

        {/* Remove meal button - only show for Quick and Copy tabs */}
        {(activeTab === 'quick' || activeTab === 'copy') && (
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
                {t('selectRecipe.clearMeal')}
              </Text>
            </Pressable>
          </View>
        )}
      </GradientBackground>
    </>
  );
}
