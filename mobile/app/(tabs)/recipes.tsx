/**
 * Recipes screen - Recipe Library with search and filters.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Platform, UIManager } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontFamily, letterSpacing } from '@/lib/theme';
import { useRecipes } from '@/lib/hooks';
import { BottomSheetModal, GradientBackground } from '@/components';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import type { DietLabel, MealLabel } from '@/lib/types';
import { RecipeGrid } from './recipes/RecipeGrid';
import { SearchBar, FilterChips } from './recipes/RecipeFilters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RecipesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);
  const [mealFilters, setMealFilters] = useState<MealLabel[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite } = useSettings();

  const SORT_OPTIONS = [
    { value: 'newest', label: t('labels.sort.newest') },
    { value: 'oldest', label: t('labels.sort.oldest') },
    { value: 'name', label: t('labels.sort.name') },
  ];

  const [showSortPicker, setShowSortPicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setDietFilter(null);
        setMealFilters([]);
        setShowFavoritesOnly(false);
      };
    }, []),
  );

  const { data: recipes = [], isLoading, refetch } = useRecipes();

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) => {
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal = mealFilters.length === 0 || (recipe.meal_label && mealFilters.includes(recipe.meal_label));
      const matchesFavorites = !showFavoritesOnly || isFavorite(recipe.id);
      return matchesSearch && matchesDiet && matchesMeal && matchesFavorites;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      result = [...result].reverse();
    }

    return result;
  }, [recipes, searchQuery, dietFilter, mealFilters, sortBy, showFavoritesOnly, isFavorite]);

  const handleDietChange = useCallback((diet: DietLabel | null) => {
    setDietFilter(diet);
    setShowFavoritesOnly(false);
  }, []);

  const handleFavoritesToggle = useCallback(() => {
    setShowFavoritesOnly((prev) => {
      if (!prev) setDietFilter(null);
      return !prev;
    });
  }, []);

  const handleSearchClear = useCallback(() => {
    hapticLight();
    searchInputRef.current?.blur();
    setSearchQuery('');
  }, []);

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 }}>
          <View style={{ marginBottom: 8 }}>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontFamily: fontFamily.display,
              color: colors.text.primary,
              letterSpacing: letterSpacing.tight,
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {t('recipes.title')}
            </Text>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.body,
              color: colors.text.secondary,
              marginTop: 4,
            }}>
              {t('recipes.collectionCount', { count: recipes.length })}
            </Text>
          </View>
        </View>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSearchFocused={isSearchFocused}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onClear={handleSearchClear}
          searchInputRef={searchInputRef}
          t={t}
        />

        <FilterChips
          dietFilter={dietFilter}
          showFavoritesOnly={showFavoritesOnly}
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onDietChange={handleDietChange}
          onFavoritesToggle={handleFavoritesToggle}
          onSortPress={() => setShowSortPicker(true)}
          t={t}
        />

        <RecipeGrid
          recipes={filteredRecipes}
          isLoading={isLoading}
          onRefresh={() => refetch()}
          onRecipePress={(id) => router.push(`/recipe/${id}`)}
          onAddRecipe={() => router.push('/add-recipe')}
          searchQuery={searchQuery}
          dietFilter={dietFilter}
          mealFilters={mealFilters}
          t={t}
        />

        {/* Sort Picker Modal */}
        <BottomSheetModal
          visible={showSortPicker}
          onClose={() => setShowSortPicker(false)}
          title={t('recipes.sortBy')}
          animationType="fade"
          dismissOnBackdropPress
          showDragHandle
          showCloseButton={false}
          backgroundColor="#F5EDE5"
          scrollable={false}
        >
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                hapticSelection();
                setSortBy(option.value);
                setShowSortPicker(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: sortBy === option.value ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                borderRadius: 12,
                marginHorizontal: 8,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: '#5D4E40',
                fontWeight: sortBy === option.value ? '600' : '400',
              }}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={20} color="#7A6858" />
              )}
            </Pressable>
          ))}
        </BottomSheetModal>
      </View>
    </GradientBackground>
  );
}
