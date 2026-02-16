/**
 * Recipes screen - Recipe Library with search and filters.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  type TextInput,
  UIManager,
  View,
} from 'react-native';
import { BottomSheetModal, GradientBackground } from '@/components';
import { FilterChips, SearchBar } from '@/components/recipes/RecipeFilters';
import { RecipeGrid } from '@/components/recipes/RecipeGrid';
import { ScreenTitle } from '@/components/ScreenTitle';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useCurrentUser, useRecipes } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { borderRadius, colors } from '@/lib/theme';
import type { DietLabel, LibraryScope, MealLabel } from '@/lib/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
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
  const [libraryScope, setLibraryScope] = useState<LibraryScope>('all');
  const { isFavorite } = useSettings();
  const { data: currentUser } = useCurrentUser();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setDietFilter(null);
        setMealFilters([]);
        setSortBy('newest');
        setShowFavoritesOnly(false);
        setLibraryScope('all');
      };
    }, []),
  );

  const SORT_OPTIONS = [
    { value: 'newest', label: t('labels.sort.newest') },
    { value: 'oldest', label: t('labels.sort.oldest') },
    { value: 'name', label: t('labels.sort.name') },
  ];

  const [showSortPicker, setShowSortPicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecipes();

  const recipes = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const totalCount = data?.pages[0]?.total_count ?? 0;

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(query),
        );
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal =
        mealFilters.length === 0 ||
        (recipe.meal_label && mealFilters.includes(recipe.meal_label));
      const matchesFavorites = !showFavoritesOnly || isFavorite(recipe.id);
      const matchesScope =
        libraryScope === 'all' ||
        recipe.household_id === currentUser?.household_id;
      return (
        matchesSearch &&
        matchesDiet &&
        matchesMeal &&
        matchesFavorites &&
        matchesScope
      );
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      result = [...result].reverse();
    }

    return result;
  }, [
    recipes,
    searchQuery,
    dietFilter,
    mealFilters,
    sortBy,
    showFavoritesOnly,
    isFavorite,
    libraryScope,
    currentUser?.household_id,
  ]);

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
    <GradientBackground structured>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}
        >
          <ScreenTitle
            title={t('recipes.title')}
            subtitle={t('recipes.collectionCount', { count: totalCount })}
            style={{ marginBottom: 8 }}
          />
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
          libraryScope={libraryScope}
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onDietChange={handleDietChange}
          onFavoritesToggle={handleFavoritesToggle}
          onLibraryScopeChange={setLibraryScope}
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
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          isFetchingNextPage={isFetchingNextPage}
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
          backgroundColor={colors.surface.modal}
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
                backgroundColor:
                  sortBy === option.value
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'transparent',
                borderRadius: borderRadius.sm,
                marginHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: colors.content.body,
                  fontWeight: sortBy === option.value ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.button.primary}
                />
              )}
            </Pressable>
          ))}
        </BottomSheetModal>
      </View>
    </GradientBackground>
  );
}
