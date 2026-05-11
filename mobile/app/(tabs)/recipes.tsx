/**
 * Recipes screen - Recipe Library with search and filters.
 */

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  type TextInput,
  UIManager,
} from 'react-native';
import {
  BottomSheetModal,
  IconButton,
  ScreenHeader,
  ScreenLayout,
} from '@/components';
import { FeaturedCategoriesSection } from '@/components/recipes/FeaturedCategoriesSection';
import { ImportRecipeModal } from '@/components/recipes/ImportRecipeModal';
import { ManualRecipeModal } from '@/components/recipes/ManualRecipeModal';
import { MealTypePicker } from '@/components/recipes/MealTypePicker';
import { FilterChips, SearchBar } from '@/components/recipes/RecipeFilters';
import { RecipeGrid } from '@/components/recipes/RecipeGrid';
import { ThemeIcon } from '@/components/ThemeIcon';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useCurrentUser, useDebouncedValue, useRecipes } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { DietLabel, LibraryScope, MealLabel } from '@/lib/types';
import { type SortOption, sortRecipes } from '@/lib/utils/recipeSorter';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Module-level filter cache. Persists user-applied filters across screen
// blurs (e.g. tapping a recipe and coming back from the detail page).
// Cleared via the in-screen 'Rensa' action OR by
// `resetRecipeFilterCache` when the user navigates away from the
// recipes flow entirely (see root layout pathname watcher).
const defaultFilterState = {
  searchQuery: '',
  dietFilter: null as DietLabel | null,
  mealFilters: [] as MealLabel[],
  sortBy: 'newest' as SortOption,
  showFavoritesOnly: false,
  libraryScope: 'all' as LibraryScope,
};

const filterCache: typeof defaultFilterState = { ...defaultFilterState };

export const resetRecipeFilterCache = () => {
  Object.assign(filterCache, defaultFilterState, { mealFilters: [] });
};

export default function RecipesScreen() {
  const { colors, borderRadius, fonts } = useTheme();
  const router = useRouter();
  const { addRecipe } = useLocalSearchParams<{ addRecipe?: string }>();
  const { t } = useTranslation();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  // Filters are seeded from a module-level cache so they survive when the
  // Recipes screen is unmounted (e.g. tabs reset on navigate-back from a
  // recipe detail). Each setter also writes back to the cache.
  const [searchQuery, setSearchQueryState] = useState(filterCache.searchQuery);
  const [dietFilter, setDietFilterState] = useState<DietLabel | null>(
    filterCache.dietFilter,
  );
  const [mealFilters, setMealFiltersState] = useState<MealLabel[]>(
    filterCache.mealFilters,
  );
  const [sortBy, setSortByState] = useState<SortOption>(filterCache.sortBy);
  const [showFavoritesOnly, setShowFavoritesOnlyState] = useState(
    filterCache.showFavoritesOnly,
  );
  const [libraryScope, setLibraryScopeState] = useState<LibraryScope>(
    filterCache.libraryScope,
  );

  const setSearchQuery = useCallback((v: string) => {
    filterCache.searchQuery = v;
    setSearchQueryState(v);
  }, []);
  const setDietFilter = useCallback((v: DietLabel | null) => {
    filterCache.dietFilter = v;
    setDietFilterState(v);
  }, []);
  const setMealFilters = useCallback(
    (v: MealLabel[] | ((prev: MealLabel[]) => MealLabel[])) => {
      setMealFiltersState((prev) => {
        const next = typeof v === 'function' ? v(prev) : v;
        filterCache.mealFilters = next;
        return next;
      });
    },
    [],
  );
  const setSortBy = useCallback((v: SortOption) => {
    filterCache.sortBy = v;
    setSortByState(v);
  }, []);
  const setShowFavoritesOnly = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      setShowFavoritesOnlyState((prev) => {
        const next = typeof v === 'function' ? v(prev) : v;
        filterCache.showFavoritesOnly = next;
        return next;
      });
    },
    [],
  );
  const setLibraryScope = useCallback((v: LibraryScope) => {
    filterCache.libraryScope = v;
    setLibraryScopeState(v);
  }, []);
  const { isFavorite } = useSettings();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (addRecipe === 'true') {
      setShowImportModal(true);
      router.setParams({ addRecipe: undefined });
    }
  }, [addRecipe, router]);

  // Filters persist between the recipes list and recipe detail pages,
  // but reset when the user navigates elsewhere (root layout clears
  // `filterCache` on pathname change). When the screen refocuses we
  // hydrate state from the cache so a cleared cache resets the UI.
  useFocusEffect(
    useCallback(() => {
      setSearchQueryState(filterCache.searchQuery);
      setDietFilterState(filterCache.dietFilter);
      setMealFiltersState(filterCache.mealFilters);
      setSortByState(filterCache.sortBy);
      setShowFavoritesOnlyState(filterCache.showFavoritesOnly);
      setLibraryScopeState(filterCache.libraryScope);
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
  const [showMealTypePicker, setShowMealTypePicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebouncedValue(searchQuery);
  const apiSearch =
    searchQuery.trim() === '' ? undefined : debouncedSearch.trim() || undefined;

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecipes(apiSearch);

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
    // Search is handled server-side via apiSearch — only apply local filters here
    const result = recipes.filter((recipe) => {
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal =
        mealFilters.length === 0 ||
        (recipe.meal_label && mealFilters.includes(recipe.meal_label));
      const matchesFavorites = !showFavoritesOnly || isFavorite(recipe.id);
      const matchesScope =
        libraryScope === 'all' ||
        recipe.household_id === currentUser?.household_id;
      return matchesDiet && matchesMeal && matchesFavorites && matchesScope;
    });

    return sortRecipes(result, sortBy);
  }, [
    recipes,
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

  const handleMealTypeToggle = useCallback((meal: MealLabel) => {
    setMealFilters((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal],
    );
  }, []);

  const handleMealTypeClear = useCallback(() => {
    setMealFilters([]);
  }, []);

  const handleSearchClear = useCallback(() => {
    hapticLight();
    searchInputRef.current?.blur();
    setSearchQuery('');
  }, []);

  return (
    <ScreenLayout>
      <ScreenHeader
        title={t('recipes.title')}
        variant="large"
        subtitle={
          hasActiveFilters
            ? t('recipes.filteredCount', {
                count: filteredRecipes.length,
              })
            : t('recipes.collectionCount', { count: totalCount })
        }
        rightAction={
          <IconButton
            icon="add"
            onPress={() => setShowImportModal(true)}
            label={t('recipes.addRecipe')}
            tone="default"
            size="md"
          />
        }
      >
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
          mealFilters={mealFilters}
          showFavoritesOnly={showFavoritesOnly}
          libraryScope={libraryScope}
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onDietChange={handleDietChange}
          onMealTypePress={() => setShowMealTypePicker(true)}
          onFavoritesToggle={handleFavoritesToggle}
          onLibraryScopeChange={setLibraryScope}
          onSortPress={() => setShowSortPicker(true)}
          t={t}
        />
      </ScreenHeader>

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
        listHeader={
          !hasActiveFilters ? (
            <FeaturedCategoriesSection
              onRecipePress={(id) => router.push(`/recipe/${id}`)}
              t={t}
            />
          ) : null
        }
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
        visible={showMealTypePicker}
        onClose={() => setShowMealTypePicker(false)}
        title={t('recipes.filterByMealType')}
      >
        <MealTypePicker
          selected={mealFilters}
          onToggle={handleMealTypeToggle}
          onClear={handleMealTypeClear}
          t={t}
        />
      </BottomSheetModal>
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
            accessibilityRole="radio"
            accessibilityState={{ selected: sortBy === option.value }}
            accessibilityLabel={option.label}
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
                fontFamily:
                  sortBy === option.value ? fonts.bodySemibold : fonts.body,
                fontSize: fontSize['lg-xl'],
                color: colors.content.body,
              }}
            >
              {option.label}
            </Text>
            {sortBy === option.value && (
              <ThemeIcon
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
