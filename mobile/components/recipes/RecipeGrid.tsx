/**
 * Responsive recipe grid with loading skeletons and empty state.
 */

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  View,
} from 'react-native';
import { RecipeCard, RecipeListSkeleton } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import type { TFunction } from '@/lib/i18n';
import { colors, layout } from '@/lib/theme';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  onRefresh: () => void;
  onRecipePress: (id: string) => void;
  onAddRecipe: () => void;
  searchQuery: string;
  dietFilter: DietLabel | null;
  mealFilters: MealLabel[];
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  t: TFunction;
}

export const RecipeGrid = ({
  recipes,
  isLoading,
  onRefresh,
  onRecipePress,
  onAddRecipe,
  searchQuery,
  dietFilter,
  mealFilters,
  onEndReached,
  isFetchingNextPage,
  t,
}: RecipeGridProps) => {
  const { width } = useWindowDimensions();

  const minCardWidth = 180;
  const horizontalPadding = layout.screenPaddingHorizontal;
  const cardGap = 10;
  const availableWidth = width - horizontalPadding * 2;
  const numColumns = Math.max(2, Math.floor(availableWidth / minCardWidth));
  const cardWidth = (availableWidth - (numColumns - 1) * cardGap) / numColumns;

  if (isLoading && recipes.length === 0) {
    return (
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <RecipeListSkeleton count={numColumns * 3} cardSize={cardWidth - 6} />
      </View>
    );
  }

  const hasFilters = !!(searchQuery || dietFilter || mealFilters.length > 0);

  return (
    <FlatList
      key={numColumns}
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
      contentContainerStyle={{
        paddingHorizontal: horizontalPadding,
        paddingBottom: layout.tabBar.contentBottomPadding,
        alignItems: 'center',
      }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.white}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon={hasFilters ? 'search' : 'book-outline'}
          title={
            hasFilters ? t('recipes.noMatchesFound') : t('recipes.emptyLibrary')
          }
          subtitle={
            hasFilters ? t('recipes.tryAdjusting') : t('recipes.startBuilding')
          }
          action={
            !hasFilters
              ? { label: t('recipes.addFirstRecipe'), onPress: onAddRecipe }
              : undefined
          }
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.text.secondary} />
          </View>
        ) : null
      }
    />
  );
};
