import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { RecipeCard } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import { fontSize, layout, spacing, useTheme } from '@/lib/theme';

type State = ReturnType<typeof useSelectRecipeState>;

interface LibraryTabProps {
  state: State;
}

export const LibraryTab = ({ state }: LibraryTabProps) => {
  const { colors, borderRadius, shadows } = useTheme();
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
            backgroundColor: colors.glass.bright,
            borderRadius: borderRadius['md-lg'],
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            ...shadows.sm,
          }}
        >
          <Ionicons name="search" size={18} color={colors.content.icon} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontSize: fontSize.lg,
              color: colors.content.heading,
            }}
            placeholder={t('selectRecipe.searchPlaceholder')}
            placeholderTextColor={colors.content.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.content.placeholder}
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
