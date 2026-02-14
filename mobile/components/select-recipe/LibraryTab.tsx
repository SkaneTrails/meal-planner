import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { RecipeCard } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import { fontSize, spacing } from '@/lib/theme';

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
      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Ionicons name="search" size={18} color="rgba(93, 78, 64, 0.5)" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontSize: fontSize.lg,
              color: '#3D3D3D',
            }}
            placeholder={t('selectRecipe.searchPlaceholder')}
            placeholderTextColor="rgba(93, 78, 64, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color="rgba(93, 78, 64, 0.4)"
              />
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
            onPress={() => onRecipePress(item.id)}
          />
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
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
