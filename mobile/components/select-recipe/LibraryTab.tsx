import { FlatList } from 'react-native';
import { RecipeCard } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/recipes/RecipeFilters';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import { layout } from '@/lib/theme';

type State = ReturnType<typeof useSelectRecipeState>;

interface LibraryTabProps {
  state: State;
}

export const LibraryTab = ({ state }: LibraryTabProps) => {
  const {
    t,
    mode,
    searchQuery,
    setSearchQuery,
    filteredRecipes,
    handleSelectRecipe,
    handleAddToExtras,
    router,
  } = state;

  const onRecipePress = (recipeId: string) => {
    if (mode === 'extras') {
      handleAddToExtras(recipeId);
    } else {
      handleSelectRecipe(recipeId);
    }
  };

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={t('selectRecipe.searchPlaceholder')}
        t={t}
      />

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            compact
            onPress={() => onRecipePress(item.id)}
          />
        )}
        contentContainerStyle={{
          padding: layout.screenPaddingHorizontal,
          paddingBottom: layout.tabBar.contentBottomPadding,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={searchQuery ? 'search' : 'book-outline'}
            title={
              searchQuery
                ? t('selectRecipe.empty.noMatches')
                : t('selectRecipe.empty.noRecipes')
            }
            subtitle={
              searchQuery
                ? t('selectRecipe.empty.tryDifferent')
                : t('selectRecipe.empty.addRecipesFirst')
            }
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
  );
};
