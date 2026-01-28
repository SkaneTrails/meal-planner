/**
 * Recipe card component for displaying a recipe in a list.
 */

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
}

const DIET_ICONS: Record<DietLabel, string> = {
  veggie: '🥬',
  fish: '🐟',
  meat: '🥩',
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  meal: 'Main',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400';

export function RecipeCard({ recipe, onPress, compact = false }: RecipeCardProps) {
  const totalTime = recipe.total_time || 
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time || 
    recipe.cook_time;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center p-3 bg-white rounded-lg border border-gray-200 mb-2"
      >
        <Image
          source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
          className="w-12 h-12 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {recipe.title}
          </Text>
          <View className="flex-row items-center mt-1">
            {recipe.diet_label && (
              <Text className="mr-2">{DIET_ICONS[recipe.diet_label]}</Text>
            )}
            {totalTime && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text className="text-sm text-gray-500 ml-1">{totalTime} min</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4"
    >
      <Image
        source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-lg font-semibold text-gray-900" numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.diet_label && (
            <Text className="text-xl ml-2">{DIET_ICONS[recipe.diet_label]}</Text>
          )}
        </View>

        <View className="flex-row flex-wrap mt-2 gap-2">
          {recipe.meal_label && (
            <View className="bg-primary-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-primary-700">
                {MEAL_LABELS[recipe.meal_label]}
              </Text>
            </View>
          )}
          {totalTime && (
            <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
              <Ionicons name="time-outline" size={12} color="#4b5563" />
              <Text className="text-xs text-gray-600 ml-1">{totalTime} min</Text>
            </View>
          )}
          {recipe.servings && (
            <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
              <Ionicons name="people-outline" size={12} color="#4b5563" />
              <Text className="text-xs text-gray-600 ml-1">{recipe.servings}</Text>
            </View>
          )}
        </View>

        {recipe.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2 gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Text key={tag} className="text-xs text-gray-500">
                #{tag}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
