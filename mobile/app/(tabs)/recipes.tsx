/**
 * Recipes screen - Recipe Library with search and filters.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  type TextInput,
  UIManager,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  Button,
  ScreenHeaderBar,
  ScreenLayout,
} from '@/components';
import { ImportRecipeModal } from '@/components/recipes/ImportRecipeModal';
import { ManualRecipeModal } from '@/components/recipes/ManualRecipeModal';
import { FilterChips, SearchBar } from '@/components/recipes/RecipeFilters';
import { RecipeGrid } from '@/components/recipes/RecipeGrid';
import { ScreenTitle } from '@/components/ScreenTitle';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useCurrentUser, useRecipes } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { DietLabel, LibraryScope, MealLabel } from '@/lib/types';
import { type SortOption, sortRecipes } from '@/lib/utils/recipeSorter';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RecipesScreen() {
  const { colors, borderRadius } = useTheme();
  const router = useRouter();
  const { addRecipe } = useLocalSearchParams<{ addRecipe?: string }>();
  const { t } = useTranslation();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);
  const [mealFilters, setMealFilters] = useState<MealLabel[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [libraryScope, setLibraryScope] = useState<LibraryScope>('all');
  const { isFavorite } = useSettings();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (addRecipe === 'true') {
      setShowImportModal(true);
      router.setParams({ addRecipe: undefined });
    }
  }, [addRecipe, router]);

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
    { value: 'quickest', label: t('labels.sort.quickest') },
    { value: 'longest', label: t('labels.sort.longest') },
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

  const hasActiveFilters =
    searchQuery !== '' ||
    dietFilter !== null ||
    mealFilters.length > 0 ||
    showFavoritesOnly ||
    libraryScope !== 'all';

  const filteredRecipes = useMemo(() => {
    const result = recipes.filter((recipe) => {
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

    return sortRecipes(result, sortBy);
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
    <ScreenLayout>
      <ScreenHeaderBar>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xs,
          }}
        >
          <ScreenTitle
            title={t('recipes.title')}
            subtitle={
              hasActiveFilters
                ? t('recipes.filteredCount', {
                    count: filteredRecipes.length,
                  })
                : t('recipes.collectionCount', { count: totalCount })
            }
            style={{ marginBottom: spacing.sm }}
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

        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}
        >
          <Button
            variant="primary"
            onPress={() => setShowImportModal(true)}
            icon="add-circle-outline"
            label={t('home.addRecipe.title')}
          />
        </View>

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
      </ScreenHeaderBar>

      <RecipeGrid
        recipes={filteredRecipes}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onRecipePress={(id) => router.push(`/recipe/${id}`)}
        onAddRecipe={() => setShowImportModal(true)}
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

      <ImportRecipeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onManualMode={() => setShowManualModal(true)}
      />

      <ManualRecipeModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
      />
      <BottomSheetModal
        visible={showSortPicker}
        onClose={() => setShowSortPicker(false)}
        title={t('recipes.sortBy')}
      >
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              hapticSelection();
              setSortBy(option.value as SortOption);
              setShowSortPicker(false);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.sm,
              backgroundColor:
                sortBy === option.value ? colors.glass.subtle : 'transparent',
              borderRadius: borderRadius.sm,
            }}
          >
            <Text
              style={{
                fontSize: fontSize['lg-xl'],
                color: colors.content.body,
                fontWeight:
                  sortBy === option.value
                    ? fontWeight.semibold
                    : fontWeight.normal,
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
    </ScreenLayout>
  );
}
