/**
 * Recipes screen - Recipe Library with search and filters.
 * Layout matches Streamlit app design.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  GradientBackground,
  RecipeCard,
  RecipeListSkeleton,
} from '@/components';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useEnhancedMode, useRecipes } from '@/lib/hooks';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DIET_OPTIONS: { value: DietLabel | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'veggie', label: 'Veggie' },
  { value: 'fish', label: 'Fish' },
  { value: 'meat', label: 'Meat' },
];

const MEAL_OPTIONS: { value: MealLabel | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'starter', label: 'Starter' },
  { value: 'salad', label: 'Salad' },
  { value: 'meal', label: 'Meal' },
  { value: 'dessert', label: 'Dessert' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
];

// Responsive Recipe Grid component
interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  onRefresh: () => void;
  onRecipePress: (id: string) => void;
  onAddRecipe: () => void;
  searchQuery: string;
  dietFilter: DietLabel | null;
  mealFilter: MealLabel | null;
}

function RecipeGrid({
  recipes,
  isLoading,
  onRefresh,
  onRecipePress,
  onAddRecipe,
  searchQuery,
  dietFilter,
  mealFilter,
}: RecipeGridProps) {
  const { width } = useWindowDimensions();

  // Calculate number of columns based on screen width
  // Card width for readable titles with time info
  const minCardWidth = 185;
  const padding = 16;
  const availableWidth = width - padding;
  const numColumns = Math.max(2, Math.floor(availableWidth / minCardWidth));
  const cardWidth = (availableWidth - (numColumns - 1) * 8) / numColumns;

  // Show skeleton when loading and no recipes yet
  if (isLoading && recipes.length === 0) {
    return (
      <View style={{ padding: 8 }}>
        <RecipeListSkeleton count={numColumns * 3} cardSize={cardWidth - 8} />
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
        <View style={{ width: cardWidth, padding: 4 }}>
          <RecipeCard
            recipe={item}
            onPress={() => onRecipePress(item.id)}
            cardSize={cardWidth - 8}
          />
        </View>
      )}
      contentContainerStyle={{ padding: 8 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor="#4A3728"
        />
      }
      ListEmptyComponent={
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 80,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: '#E8D5C4',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons
              name={
                searchQuery || dietFilter || mealFilter
                  ? 'search'
                  : 'book-outline'
              }
              size={36}
              color="#4A3728"
            />
          </View>
          <Text
            style={{
              color: '#4A3728',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {searchQuery || dietFilter || mealFilter
              ? 'No matches found'
              : 'Your recipe book is empty'}
          </Text>
          <Text
            style={{
              color: '#6B7280',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {searchQuery || dietFilter || mealFilter
              ? 'Try adjusting your search or filters'
              : 'Start building your collection by adding your favorite recipes'}
          </Text>
          {!searchQuery && !dietFilter && !mealFilter && (
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
              <Text
                style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}
              >
                Add Your First Recipe
              </Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);
  const [mealFilter, setMealFilter] = useState<MealLabel | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showAllRecipes, setShowAllRecipes] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Modal states for filter pickers
  const [showDietPicker, setShowDietPicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Toggle filters with animation
  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  // Check if any filters are active
  const hasActiveFilters =
    dietFilter !== null || mealFilter !== null || searchQuery !== '';

  // Use global enhanced mode context
  const { isEnhanced, setIsEnhanced } = useEnhancedMode();

  // Fetch recipes - pass enhanced flag to use correct database
  const {
    data: recipes = [],
    isLoading,
    refetch,
  } = useRecipes(undefined, isEnhanced);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) => {
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal = !mealFilter || recipe.meal_label === mealFilter;
      return matchesSearch && matchesDiet && matchesMeal;
    });

    // Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      result = [...result].reverse();
    }

    return result;
  }, [recipes, searchQuery, dietFilter, mealFilter, sortBy]);

  return (
    <GradientBackground variant="soft">
      <View style={{ flex: 1, paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: fontSize['4xl'],
                fontFamily: fontFamily.display,
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: letterSpacing.tight,
              }}
            >
              Recipe Library
            </Text>
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {recipes.length} recipes in your collection
            </Text>
          </View>

          {/* AI Enhanced toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isEnhanced ? colors.primary : colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: 18,
              paddingVertical: 14,
              marginBottom: 16,
              ...(isEnhanced ? shadows.glow : shadows.md),
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: isEnhanced
                    ? 'rgba(232, 168, 124, 0.3)'
                    : colors.bgWarm,
                  borderRadius: borderRadius.sm,
                  padding: 8,
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={isEnhanced ? colors.accent : colors.text.primary}
                />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.semibold,
                    color: isEnhanced ? colors.white : colors.text.primary,
                  }}
                >
                  AI Enhanced
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: isEnhanced
                      ? colors.gray[300]
                      : colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {isEnhanced
                    ? 'Showing improved recipes'
                    : 'Try AI-improved instructions'}
                </Text>
              </View>
            </View>
            <Switch
              value={isEnhanced}
              onValueChange={setIsEnhanced}
              trackColor={{ false: colors.gray[200], true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>

          {/* All Recipes / Add Recipe toggle buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Pressable
              onPress={() => setShowAllRecipes(true)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                borderRadius: borderRadius.lg,
                backgroundColor: showAllRecipes ? colors.primary : colors.white,
                ...shadows.md,
              }}
            >
              <Ionicons
                name={showAllRecipes ? 'book' : 'book-outline'}
                size={18}
                color={showAllRecipes ? colors.white : colors.text.primary}
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: showAllRecipes ? colors.white : colors.text.primary,
                }}
              >
                All Recipes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/add-recipe');
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.white,
                ...shadows.md,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.accent}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                Add Recipe
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search and filters */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          {/* Search bar with filter toggle and cancel button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: 14,
                paddingVertical: 12,
                ...shadows.sm,
              }}
            >
              <Ionicons name="search" size={18} color={colors.text.muted} />
              <TextInput
                ref={searchInputRef}
                style={{
                  flex: 1,
                  fontSize: fontSize.lg,
                  color: colors.text.primary,
                  marginLeft: 10,
                }}
                placeholder="Search recipes..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery !== '' && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.text.muted}
                  />
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
                  marginLeft: 8,
                  padding: 6,
                  backgroundColor: hasActiveFilters ? '#E8F5E8' : '#F3F4F6',
                  borderRadius: 8,
                  opacity: isSearchFocused ? 0.4 : 1,
                }}
              >
                <Ionicons
                  name={filtersExpanded ? 'options' : 'options-outline'}
                  size={18}
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
                <Text
                  style={{ fontSize: 15, color: '#4A3728', fontWeight: '500' }}
                >
                  Cancel
                </Text>
              </Pressable>
            )}
          </View>

          {/* Collapsible filter dropdowns row */}
          {filtersExpanded && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Diet filter */}
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => setShowDietPicker(true)}
                  style={{
                    backgroundColor: dietFilter ? '#E8F5E8' : colors.white,
                    borderRadius: borderRadius.sm,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...shadows.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: dietFilter ? '#2D5A3D' : colors.primary,
                    }}
                  >
                    {DIET_OPTIONS.find((o) => o.value === dietFilter)?.label ||
                      'Diet'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.text.muted}
                  />
                </Pressable>
              </View>

              {/* Meal type filter */}
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => setShowMealPicker(true)}
                  style={{
                    backgroundColor: mealFilter ? '#E8F5E8' : colors.white,
                    borderRadius: borderRadius.sm,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...shadows.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: mealFilter ? '#2D5A3D' : colors.primary,
                    }}
                  >
                    {MEAL_OPTIONS.find((o) => o.value === mealFilter)?.label ||
                      'Meal'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.text.muted}
                  />
                </Pressable>
              </View>

              {/* Sort */}
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => setShowSortPicker(true)}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.sm,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...shadows.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: colors.primary,
                    }}
                  >
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ||
                      'Sort'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.text.muted}
                  />
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
          mealFilter={mealFilter}
        />

        {/* Diet Filter Picker Modal */}
        <Modal
          visible={showDietPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDietPicker(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowDietPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
            >
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.primary,
                  paddingHorizontal: 20,
                  marginBottom: 12,
                }}
              >
                Filter by Diet
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
                    backgroundColor:
                      dietFilter === option.value ? '#F3E8E0' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.primary,
                      fontWeight: dietFilter === option.value ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                  {dietFilter === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Meal Type Filter Picker Modal */}
        <Modal
          visible={showMealPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMealPicker(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowMealPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
            >
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.primary,
                  paddingHorizontal: 20,
                  marginBottom: 12,
                }}
              >
                Filter by Meal Type
              </Text>
              {MEAL_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    hapticSelection();
                    setMealFilter(option.value);
                    setShowMealPicker(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor:
                      mealFilter === option.value ? '#F3E8E0' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.primary,
                      fontWeight: mealFilter === option.value ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                  {mealFilter === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
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
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowSortPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
            >
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.primary,
                  paddingHorizontal: 20,
                  marginBottom: 12,
                }}
              >
                Sort by
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
                    backgroundColor:
                      sortBy === option.value ? '#F3E8E0' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.primary,
                      fontWeight: sortBy === option.value ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
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
