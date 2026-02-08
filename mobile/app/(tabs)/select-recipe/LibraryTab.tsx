import React from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontSize } from '@/lib/theme';
import { RecipeCard } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import type { useSelectRecipeState } from './useSelectRecipeState';

type State = ReturnType<typeof useSelectRecipeState>;

interface LibraryTabProps {
  state: State;
}

export const LibraryTab = ({ state }: LibraryTabProps) => {
  const { t, searchQuery, setSearchQuery, filteredRecipes, handleSelectRecipe, router } = state;

  return (
    <>
      {/* Search bar */}
      <View style={{ backgroundColor: colors.glass.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass.light, borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <Ionicons name="search" size={20} color={colors.gray[500]} />
          <TextInput
            style={{ flex: 1, marginLeft: spacing.sm, fontSize: fontSize.lg, color: colors.text.inverse }}
            placeholder={t('selectRecipe.searchPlaceholder')}
            placeholderTextColor={colors.gray[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
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
            onPress={() => handleSelectRecipe(item.id)}
          />
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon={searchQuery ? "search" : "book-outline"}
            title={searchQuery ? t('selectRecipe.empty.noMatches') : t('selectRecipe.empty.noRecipes')}
            subtitle={searchQuery ? t('selectRecipe.empty.tryDifferent') : t('selectRecipe.empty.addRecipesFirst')}
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
