/**
 * Recipe detail screen.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useDeleteRecipe } from '@/lib/hooks';
import type { DietLabel, MealLabel } from '@/lib/types';

const DIET_LABELS: Record<DietLabel, { emoji: string; label: string }> = {
  veggie: { emoji: '🥬', label: 'Vegetarian' },
  fish: { emoji: '🐟', label: 'Seafood' },
  meat: { emoji: '🥩', label: 'Meat' },
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  meal: 'Main Course',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      await Share.share({
        title: recipe.title,
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.url || ''}`,
        url: recipe.url,
      });
    } catch (err) {
      // User cancelled
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="hourglass-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-500 mt-4">Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">Recipe not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-primary-500 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View className="flex-row gap-2">
              <Pressable onPress={handleShare} className="p-2">
                <Ionicons name="share-outline" size={24} color="white" />
              </Pressable>
              <Pressable onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={24} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-gray-50">
        {/* Hero image */}
        <Image
          source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
          className="w-full h-64"
          resizeMode="cover"
        />

        {/* Content */}
        <View className="p-4 -mt-6 bg-white rounded-t-3xl">
          {/* Title and labels */}
          <Text className="text-2xl font-bold text-gray-900">
            {recipe.title}
          </Text>

          {/* Meta info */}
          <View className="flex-row flex-wrap mt-3 gap-3">
            {recipe.diet_label && (
              <View className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full">
                <Text className="mr-1">{DIET_LABELS[recipe.diet_label].emoji}</Text>
                <Text className="text-sm text-primary-700">
                  {DIET_LABELS[recipe.diet_label].label}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                <Text className="text-sm text-gray-700">
                  {MEAL_LABELS[recipe.meal_label]}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings */}
          <View className="flex-row mt-4 bg-gray-50 rounded-xl p-4">
            {recipe.prep_time && (
              <View className="flex-1 items-center">
                <Ionicons name="timer-outline" size={24} color="#6b7280" />
                <Text className="text-sm text-gray-500 mt-1">Prep</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {recipe.prep_time} min
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View className="flex-1 items-center border-l border-gray-200">
                <Ionicons name="flame-outline" size={24} color="#6b7280" />
                <Text className="text-sm text-gray-500 mt-1">Cook</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {recipe.cook_time} min
                </Text>
              </View>
            )}
            {totalTime && (
              <View className="flex-1 items-center border-l border-gray-200">
                <Ionicons name="time-outline" size={24} color="#6b7280" />
                <Text className="text-sm text-gray-500 mt-1">Total</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {totalTime} min
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View className="flex-1 items-center border-l border-gray-200">
                <Ionicons name="people-outline" size={24} color="#6b7280" />
                <Text className="text-sm text-gray-500 mt-1">Servings</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-4 gap-2">
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  className="bg-gray-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-sm text-gray-600">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View className="mt-6">
            <Text className="text-xl font-semibold text-gray-900 mb-3">
              Ingredients
            </Text>
            {recipe.ingredients.length === 0 ? (
              <Text className="text-gray-500 italic">No ingredients listed</Text>
            ) : (
              recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  className="flex-row items-start py-2 border-b border-gray-100"
                >
                  <View className="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3" />
                  <Text className="flex-1 text-base text-gray-700">
                    {ingredient}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Instructions */}
          <View className="mt-6 mb-8">
            <Text className="text-xl font-semibold text-gray-900 mb-3">
              Instructions
            </Text>
            {recipe.instructions.length === 0 ? (
              <Text className="text-gray-500 italic">No instructions listed</Text>
            ) : (
              recipe.instructions.map((instruction, index) => (
                <View key={index} className="flex-row items-start py-3">
                  <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mr-3">
                    <Text className="text-white font-bold">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-base text-gray-700">
                    {instruction}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Source link */}
          {recipe.url && (
            <Pressable
              onPress={handleShare}
              className="flex-row items-center justify-center py-3 border-t border-gray-200"
            >
              <Ionicons name="link-outline" size={20} color="#6b7280" />
              <Text className="text-gray-500 ml-2 text-sm" numberOfLines={1}>
                View original recipe
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}
