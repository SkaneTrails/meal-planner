/**
 * Select Recipe modal - Choose a recipe for a meal slot.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useSetMeal, useRemoveMeal } from '@/lib/hooks';
import { RecipeCard } from '@/components';
import type { MealType } from '@/lib/types';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function SelectRecipeScreen() {
  const { date, mealType } = useLocalSearchParams<{
    date: string;
    mealType: MealType;
  }>();
  const router = useRouter();

  const { data: recipes = [] } = useRecipes();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();

  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');

  const filteredRecipes = useMemo(() => {
    if (searchQuery === '') return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await setMeal.mutateAsync({
        date,
        mealType,
        recipeId,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to set meal');
    }
  };

  const handleSetCustomText = async () => {
    if (!customText.trim()) return;

    try {
      await setMeal.mutateAsync({
        date,
        mealType,
        customText: customText.trim(),
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to set meal');
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove meal');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${MEAL_TYPE_LABELS[mealType]} - ${formattedDate}`,
        }}
      />

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
        </View>

        {/* Custom text input */}
        <View className="px-4 py-3 bg-peach-50 border-b border-sage-200">
          <Text className="text-sm font-medium text-sage-600 mb-2">
            Or enter custom text
          </Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-white rounded-xl px-4 py-3 text-base text-gray-900 border border-sage-100"
              placeholder="e.g., Leftovers, Eating out..."
              placeholderTextColor="#9ca3af"
              value={customText}
              onChangeText={setCustomText}
            />
            <Pressable
              onPress={handleSetCustomText}
              disabled={!customText.trim() || setMeal.isPending}
              className={`ml-2 px-4 py-3 rounded-xl ${
                customText.trim() ? 'bg-sage-400' : 'bg-sage-200'
              }`}
            >
              <Text className="text-white font-medium">Add</Text>
            </Pressable>
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
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="book-outline" size={64} color="#ADB380" />
              <Text className="text-gray-500 text-lg mt-4 text-center">
                {searchQuery ? 'No recipes match your search' : 'No recipes yet'}
              </Text>
              <Pressable
                onPress={() => {
                  router.back();
                  router.push('/add-recipe');
                }}
                className="mt-4 px-6 py-3 bg-sage-400 rounded-full"
              >
                <Text className="text-white font-semibold">Add a Recipe</Text>
              </Pressable>
            </View>
          }
        />

        {/* Remove meal button */}
        <View className="p-4 bg-peach-50 border-t border-sage-200">
          <Pressable
            onPress={handleRemoveMeal}
            disabled={removeMeal.isPending}
            className="flex-row items-center justify-center py-3 rounded-xl border border-peach-500 bg-peach-100"
          >
            <Ionicons name="trash-outline" size={20} color="#a87a3a" />
            <Text className="ml-2 font-medium text-peach-700">
              Clear This Meal
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
