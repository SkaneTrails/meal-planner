/**
 * Recipes screen - Recipe Library with search and filters.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
  useWindowDimensions,
  Modal,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing, fontWeight, fontFamily } from '@/lib/theme';
import { useRecipes } from '@/lib/hooks';
import { RecipeCard, GradientBackground, RecipeListSkeleton } from '@/components';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import type { TFunction } from '@/lib/i18n';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Responsive Recipe Grid component
interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  onRefresh: () => void;
  onRecipePress: (id: string) => void;
  onAddRecipe: () => void;
  searchQuery: string;
  dietFilter: DietLabel | null;
  mealFilters: MealLabel[];
  t: TFunction;
}

function RecipeGrid({ recipes, isLoading, onRefresh, onRecipePress, onAddRecipe, searchQuery, dietFilter, mealFilters, t }: RecipeGridProps) {
  const { width } = useWindowDimensions();

  // Calculate number of columns based on screen width
  // Card width for readable titles with time info
  const minCardWidth = 180;
  const horizontalPadding = 12; // Symmetric padding on both sides
  const cardGap = 10; // Gap between cards
  const availableWidth = width - (horizontalPadding * 2);
  const numColumns = Math.max(2, Math.floor(availableWidth / minCardWidth));
  const cardWidth = (availableWidth - (numColumns - 1) * cardGap) / numColumns;

  // Show skeleton when loading and no recipes yet
  if (isLoading && recipes.length === 0) {
    return (
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <RecipeListSkeleton count={numColumns * 3} cardSize={cardWidth - 6} />
      </View>
    );
  }

  return (
    <FlatList
      key={numColumns} // Force re-render when columns change
      data={recipes}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={{ width: cardWidth, padding: cardGap / 2 }}>
          <RecipeCard
            recipe={item}
            onPress={() => onRecipePress(item.id)}
            cardSize={cardWidth - cardGap}
          />
        </View>
      )}
      contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.white} />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name={searchQuery || dietFilter || mealFilters.length > 0 ? "search" : "book-outline"} size={36} color={colors.white} />
          </View>
          <Text style={{ color: colors.text.inverse, fontSize: 18, fontFamily: fontFamily.bodySemibold, textAlign: 'center' }}>
            {searchQuery || dietFilter || mealFilters.length > 0
              ? t('recipes.noMatchesFound')
              : t('recipes.emptyLibrary')}
          </Text>
          <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            {searchQuery || dietFilter || mealFilters.length > 0
              ? t('recipes.tryAdjusting')
              : t('recipes.startBuilding')}
          </Text>
          {!searchQuery && !dietFilter && mealFilters.length === 0 && (
            <Pressable
              onPress={onAddRecipe}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: borderRadius.sm,
                marginTop: spacing['2xl'],
                ...shadows.lg,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 15, fontFamily: fontFamily.bodySemibold }}>{t('recipes.addFirstRecipe')}</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);
  const [mealFilters, setMealFilters] = useState<MealLabel[]>([]); // Multi-select meal types
  const [sortBy, setSortBy] = useState('newest');
  const [showAllRecipes, setShowAllRecipes] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);  // Collapsed by default
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get favorites from settings
  const { isFavorite, settings } = useSettings();

  const DIET_OPTIONS: { value: DietLabel | null; label: string }[] = [
    { value: null, label: t('labels.diet.all') },  // When selected shows 'All', but dropdown button shows 'Diet' when null
    { value: 'veggie', label: t('labels.diet.veggie') },
    { value: 'fish', label: t('labels.diet.fish') },
    { value: 'meat', label: t('labels.diet.meat') },
  ];

  const MEAL_OPTIONS: { value: MealLabel; label: string }[] = [
    { value: 'breakfast', label: t('labels.meal.breakfast') },
    { value: 'starter', label: t('labels.meal.starter') },
    { value: 'salad', label: t('labels.meal.salad') },
    { value: 'meal', label: t('labels.meal.meal') },
    { value: 'dessert', label: t('labels.meal.dessert') },
  ];

  const SORT_OPTIONS = [
    { value: 'newest', label: t('labels.sort.newest') },
    { value: 'oldest', label: t('labels.sort.oldest') },
    { value: 'name', label: t('labels.sort.name') },
  ];

  // Modal states for filter pickers
  const [showDietPicker, setShowDietPicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Clear filters and search when leaving the screen
  useFocusEffect(
    useCallback(() => {
      // Called when screen gains focus - nothing to do
      return () => {
        // Called when screen loses focus - reset filters and search
        setSearchQuery('');
        setDietFilter(null);
        setMealFilters([]);
        setShowFavoritesOnly(false);
      };
    }, [])
  );

  // Toggle filters with animation
  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  // Check if any filters are active
  const hasActiveFilters = dietFilter !== null || mealFilters.length > 0 || searchQuery !== '' || showFavoritesOnly;

  // Fetch recipes
  const { data: recipes = [], isLoading, refetch } = useRecipes();

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) => {
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal = mealFilters.length === 0 || (recipe.meal_label && mealFilters.includes(recipe.meal_label));
      const matchesFavorites = !showFavoritesOnly || isFavorite(recipe.id);
      return matchesSearch && matchesDiet && matchesMeal && matchesFavorites;
    });

    // Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      result = [...result].reverse();
    }

    return result;
  }, [recipes, searchQuery, dietFilter, mealFilters, sortBy, showFavoritesOnly, isFavorite]);

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
          }}>{t('recipes.title')}</Text>
          <Text style={{
            fontSize: fontSize.lg,
            fontFamily: fontFamily.body,
            color: colors.text.secondary,
            marginTop: 4,
          }}>{t('recipes.collectionCount', { count: recipes.length })}</Text>
        </View>
      </View>

      {/* Search and filters */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        {/* Search bar with filter toggle and cancel button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
            <Ionicons name="search" size={16} color="#8B7355" />
            <TextInput
              ref={searchInputRef}
              style={{
                flex: 1,
                fontSize: fontSize.md,
                color: '#5D4E40',
                marginLeft: 8,
              }}
              placeholder={t('recipes.searchPlaceholder')}
              placeholderTextColor="#8B7355"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 2 }}>
                <Ionicons name="close-circle" size={16} color={colors.text.muted} />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (!isSearchFocused) {
                  hapticLight();
                  toggleFilters();
                }
              }}
              disabled={isSearchFocused}
              style={{
                marginLeft: 6,
                padding: 4,
                backgroundColor: hasActiveFilters ? '#E8F5E8' : '#F3F4F6',
                borderRadius: 6,
                opacity: isSearchFocused ? 0.4 : 1,
              }}
            >
              <Ionicons
                name={filtersExpanded ? "options" : "options-outline"}
                size={16}
                color={hasActiveFilters ? '#2D5A3D' : '#6B7280'}
              />
            </Pressable>
          </View>
          {isSearchFocused && (
            <Pressable
              onPress={() => {
                hapticLight();
                searchInputRef.current?.blur();
                setSearchQuery('');
              }}
              style={{ marginLeft: 12 }}
            >
              <Text style={{ fontSize: 15, color: colors.text.inverse, fontFamily: fontFamily.bodyMedium }}>{t('common.cancel')}</Text>
            </Pressable>
          )}
        </View>

        {/* Collapsible filter dropdowns row */}
        {filtersExpanded && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Favorites filter */}
            <Pressable
              onPress={() => {
                hapticLight();
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              style={{
                backgroundColor: showFavoritesOnly ? 'rgba(220, 38, 38, 0.85)' : colors.glass.card,
                borderRadius: borderRadius.sm,
                paddingHorizontal: 10,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons
                name={showFavoritesOnly ? 'heart' : 'heart-outline'}
                size={14}
                color={showFavoritesOnly ? colors.white : '#5D4E40'}
              />
              {showFavoritesOnly && (
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.white }}>
                  {settings.favoriteRecipes.length}
                </Text>
              )}
            </Pressable>

            {/* Diet filter */}
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => setShowDietPicker(true)}
                style={{
                  backgroundColor: dietFilter ? 'rgba(200, 230, 200, 0.8)' : colors.glass.card,
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: dietFilter ? '#2D5A3D' : '#5D4E40' }}>
                  {dietFilter ? DIET_OPTIONS.find(o => o.value === dietFilter)?.label : t('recipes.diet')}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#8B7355" />
              </Pressable>
            </View>

            {/* Meal type filter - multi-select */}
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => setShowMealPicker(true)}
                style={{
                  backgroundColor: mealFilters.length > 0 ? 'rgba(200, 230, 200, 0.8)' : colors.glass.card,
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: mealFilters.length > 0 ? '#2D5A3D' : '#5D4E40' }}>
                  {mealFilters.length === 0 
                    ? t('recipes.mealType') 
                    : mealFilters.length === 1 
                      ? MEAL_OPTIONS.find(o => o.value === mealFilters[0])?.label 
                      : t('recipes.mealTypeCount', { count: mealFilters.length })}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#8B7355" />
              </Pressable>
            </View>

            {/* Sort */}
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => setShowSortPicker(true)}
                style={{
                  backgroundColor: colors.glass.card,
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#5D4E40' }}>
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label || t('recipes.sort')}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#8B7355" />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Recipe Grid */}
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

      {/* Diet Filter Picker Modal */}
      <Modal
        visible={showDietPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDietPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowDietPicker(false)}
        >
          <View style={{
            backgroundColor: '#F5EDE5',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#C4B5A6', borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#5D4E40', paddingHorizontal: 20, marginBottom: 12 }}>
              {t('recipes.filterByDiet')}
            </Text>
            {DIET_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  hapticSelection();
                  setDietFilter(option.value);
                  setShowDietPicker(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  backgroundColor: dietFilter === option.value ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                  borderRadius: 12,
                  marginHorizontal: 8,
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: '#5D4E40',
                  fontWeight: dietFilter === option.value ? '600' : '400',
                }}>
                  {option.label}
                </Text>
                {dietFilter === option.value && (
                  <Ionicons name="checkmark" size={20} color="#7A6858" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Meal Type Filter Picker Modal - Multi-select */}
      <Modal
        visible={showMealPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMealPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowMealPicker(false)}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#5D4E40' }}>
                {t('recipes.filterByMealType')}
              </Text>
              {mealFilters.length > 0 && (
                <Pressable onPress={() => { hapticSelection(); setMealFilters([]); }}>
                  <Text style={{ fontSize: 14, color: '#7A6858', fontWeight: '600' }}>{t('common.clear')}</Text>
                </Pressable>
              )}
            </View>
            {MEAL_OPTIONS.map((option) => {
              const isSelected = mealFilters.includes(option.value);
              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    hapticSelection();
                    setMealFilters(prev => 
                      isSelected 
                        ? prev.filter(v => v !== option.value) 
                        : [...prev, option.value]
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                    borderRadius: 12,
                    marginHorizontal: 8,
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: '#5D4E40',
                    fontWeight: isSelected ? '600' : '400',
                  }}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#7A6858" />
                  )}
                </Pressable>
              );
            })}
            {/* Done button */}
            <Pressable
              onPress={() => setShowMealPicker(false)}
              style={{
                backgroundColor: '#7A6858',
                marginHorizontal: 20,
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>{t('common.done')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort Picker Modal */}
      <Modal
        visible={showSortPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowSortPicker(false)}
        >
          <View style={{
            backgroundColor: '#F5EDE5',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#C4B5A6', borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#5D4E40', paddingHorizontal: 20, marginBottom: 12 }}>
              {t('recipes.sortBy')}
            </Text>
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
          </View>
        </Pressable>
      </Modal>
      </View>
    </GradientBackground>
  );
}
