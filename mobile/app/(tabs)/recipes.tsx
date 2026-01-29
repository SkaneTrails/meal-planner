/**
 * Recipes screen - List all recipes with search.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '@/lib/hooks';
import { RecipeCard } from '@/components';
import type { DietLabel, MealLabel } from '@/lib/types';

const DIET_FILTERS: { value: DietLabel | null; label: string; emoji: string }[] = [
  { value: null, label: 'All', emoji: '🍽️' },
  { value: 'veggie', label: 'Veggie', emoji: '🥬' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
  { value: 'meat', label: 'Meat', emoji: '🥩' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading, refetch } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Diet filter
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;

      return matchesSearch && matchesDiet;
    });
  }, [recipes, searchQuery, dietFilter]);

  return (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="bg-peach-50 px-4 py-3 border-b border-sage-200">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-sage-100">
          <Ionicons name="search" size={20} color="#ADB380" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search recipes..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#ADB380" />
            </Pressable>
          )}
        </View>

        {/* Diet filter pills */}
        <View className="flex-row mt-3 gap-2">
          {DIET_FILTERS.map((filter) => (
            <Pressable
              key={filter.label}
              onPress={() => setDietFilter(filter.value)}
              className={`flex-row items-center px-3 py-1.5 rounded-full ${
                dietFilter === filter.value
                  ? 'bg-sage-400'
                  : 'bg-white border border-sage-200'
              }`}
            >
              <Text className="mr-1">{filter.emoji}</Text>
              <Text
                className={`text-sm font-medium ${
                  dietFilter === filter.value ? 'text-white' : 'text-gray-700'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor="#7A8A5D" />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="search" size={64} color="#ADB380" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              {searchQuery || dietFilter
                ? 'No recipes match your filters'
                : 'No recipes yet'}
            </Text>
            {!searchQuery && !dietFilter && (
              <Pressable
                onPress={() => router.push('/add-recipe')}
                className="bg-sage-400 px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-white font-semibold">Add Your First Recipe</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* FAB to add recipe */}
      <Pressable
        onPress={() => router.push('/add-recipe')}
        className="absolute bottom-6 right-6 bg-sage-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
