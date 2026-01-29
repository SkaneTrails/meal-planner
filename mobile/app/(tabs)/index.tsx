/**
 * Home screen - Dashboard with stats and quick actions.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useMealPlan } from '@/lib/hooks';
import { RecipeCard } from '@/components';

export default function HomeScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useRecipes();
  const { data: mealPlan, isLoading: mealPlanLoading, refetch: refetchMealPlan } = useMealPlan();

  const isLoading = recipesLoading || mealPlanLoading;

  const handleRefresh = () => {
    refetchRecipes();
    refetchMealPlan();
  };

  // Count meals planned this week
  const plannedMealsCount =
    mealPlan && mealPlan.meals ? Object.keys(mealPlan.meals).length : 0;

  // Get recent recipes (last 3)
  const recentRecipes = recipes.slice(0, 3);

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#7A8A5D" />
      }
    >
      {/* Welcome header */}
      <View className="bg-sage-400 px-6 py-8 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">
          Welcome to Meal Planner
        </Text>
        <Text className="text-sage-100 mt-2">
          Plan your meals, save time & money
        </Text>
      </View>

      {/* Stats cards */}
      <View className="flex-row px-4 -mt-6">
        <View className="flex-1 bg-peach-50 rounded-xl p-4 mr-2 shadow-sm border border-peach-200">
          <View className="flex-row items-center">
            <View className="bg-sage-200 p-2 rounded-full">
              <Ionicons name="book" size={20} color="#7A8A5D" />
            </View>
            <View className="ml-3">
              <Text className="text-2xl font-bold text-gray-900">
                {recipes.length}
              </Text>
              <Text className="text-sm text-gray-500">Recipes</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 bg-peach-50 rounded-xl p-4 ml-2 shadow-sm border border-peach-200">
          <View className="flex-row items-center">
            <View className="bg-peach-300 p-2 rounded-full">
              <Ionicons name="calendar" size={20} color="#a87a3a" />
            </View>
            <View className="ml-3">
              <Text className="text-2xl font-bold text-gray-900">
                {plannedMealsCount}
              </Text>
              <Text className="text-sm text-gray-500">Meals Planned</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push('/add-recipe')}
            className="flex-1 bg-peach-50 rounded-xl p-4 border border-sage-200 items-center"
          >
            <View className="bg-sage-200 p-3 rounded-full mb-2">
              <Ionicons name="add" size={24} color="#7A8A5D" />
            </View>
            <Text className="text-sm font-medium text-gray-900">Add Recipe</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/meal-plan')}
            className="flex-1 bg-peach-50 rounded-xl p-4 border border-sage-200 items-center"
          >
            <View className="bg-peach-300 p-3 rounded-full mb-2">
              <Ionicons name="calendar-outline" size={24} color="#a87a3a" />
            </View>
            <Text className="text-sm font-medium text-gray-900">Plan Meals</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/grocery')}
            className="flex-1 bg-peach-50 rounded-xl p-4 border border-sage-200 items-center"
          >
            <View className="bg-sage-400 p-3 rounded-full mb-2">
              <Ionicons name="cart-outline" size={24} color="#ffffff" />
            </View>
            <Text className="text-sm font-medium text-gray-900">Grocery List</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent recipes */}
      <View className="px-4 mt-6 mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">
            Recent Recipes
          </Text>
          <Pressable onPress={() => router.push('/recipes')}>
            <Text className="text-sage-600 font-medium">See all</Text>
          </Pressable>
        </View>

        {recentRecipes.length === 0 ? (
          <View className="bg-peach-50 rounded-xl p-8 border border-sage-200 items-center">
            <Ionicons name="book-outline" size={48} color="#ADB380" />
            <Text className="text-gray-500 mt-4 text-center">
              No recipes yet. Import your first recipe to get started!
            </Text>
            <Pressable
              onPress={() => router.push('/add-recipe')}
              className="bg-sage-400 px-6 py-3 rounded-full mt-4"
            >
              <Text className="text-white font-semibold">Add Recipe</Text>
            </Pressable>
          </View>
        ) : (
          recentRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              compact
              onPress={() => router.push(`/recipe/${recipe.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
