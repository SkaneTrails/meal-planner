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
  Button,
  ContentCard,
  ScreenHeader,
  ScreenLayout,
} from '@/components';
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

export default function RecipesScreen() {
  const { colors, borderRadius, fonts } = useTheme();
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
        subtitle={
          hasActiveFilters
            ? t('recipes.filteredCount', {
                count: filteredRecipes.length,
              })
            : t('recipes.collectionCount', { count: totalCount })
        }
      >
        <ContentCard
          highlighted
          padding={spacing.md}
          cardStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: spacing.xl,
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: fontSize.xl,
              color: colors.content.subtitle,
              flex: 1,
            }}
          >
            {t('recipes.callToAction')}
          </Text>
          <Button
            variant="primary"
            size="sm"
            onPress={() => setShowImportModal(true)}
            icon="add"
            label={t('recipes.addRecipe')}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            }}
          />
        </ContentCard>

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
