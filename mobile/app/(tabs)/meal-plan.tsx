/**
 * Meal Plan screen - Weekly calendar view.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import { useMealPlan, useRecipes, useClearMealPlan } from '@/lib/hooks';
import { DayColumn } from '@/components';
import type { MealType, Recipe } from '@/lib/types';

function getWeekDates(weekOffset: number = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  // Calculate days since Saturday (Sat=0 in our week, so Sat->0, Sun->1, Mon->2, etc.)
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[6];
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${first.toLocaleDateString('en-US', options)} - ${last.toLocaleDateString('en-US', options)}`;
}

export default function MealPlanScreen() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useMealPlan();
  const { data: recipes = [] } = useRecipes();
  const clearMealPlan = useClearMealPlan();

  // Create a map of recipe IDs to recipes
  const recipeMap = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const recipe of recipes) {
      map[recipe.id] = recipe;
    }
    return map;
  }, [recipes]);

  // Build meal data for each day
  const getMealsForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const meals: Record<MealType, { recipe?: Recipe; customText?: string }> = {
      breakfast: {},
      lunch: {},
      dinner: {},
      snack: {},
    };

    if (!mealPlan || !mealPlan.meals) return meals;

    for (const [key, value] of Object.entries(mealPlan.meals)) {
      const [entryDate, entryMealType] = key.split('_');
      if (entryDate !== dateStr) continue;
      if (
        entryMealType !== 'breakfast' &&
        entryMealType !== 'lunch' &&
        entryMealType !== 'dinner' &&
        entryMealType !== 'snack'
      ) {
        continue;
      }

      const mealType = entryMealType as MealType;
      const isCustom = value.startsWith('custom:');
      const recipe = !isCustom ? recipeMap[value] : undefined;

      meals[mealType] = recipe
        ? { recipe }
        : { customText: isCustom ? value.slice(7) : value };
    }

    return meals;
  };

  const handleClearPlan = () => {
    Alert.alert(
      'Clear Meal Plan',
      'Are you sure you want to clear all meals for this week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearMealPlan.mutate(),
        },
      ]
    );
  };

  const handleMealPress = (date: Date, mealType: MealType) => {
    const dateStr = formatDateLocal(date);
    router.push({
      pathname: '/select-recipe',
      params: { date: dateStr, mealType },
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Week navigation */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <Pressable
          onPress={() => setWeekOffset((prev) => prev - 1)}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>

        <Pressable
          onPress={() => setWeekOffset(0)}
          className="items-center"
        >
          <Text className="text-lg font-semibold text-gray-900">
            {formatWeekRange(weekDates)}
          </Text>
          {weekOffset !== 0 && (
            <Text className="text-xs text-primary-500">Tap to return to this week</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setWeekOffset((prev) => prev + 1)}
          className="p-2"
        >
          <Ionicons name="chevron-forward" size={24} color="#374151" />
        </Pressable>
      </View>

      {/* Meal grid */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={mealPlanLoading}
            onRefresh={() => refetchMealPlan()}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 8 }}
        >
          {weekDates.map((date) => (
            <View key={date.toISOString()} style={{ width: 140 }}>
              <DayColumn
                date={date}
                meals={getMealsForDate(date)}
                onMealPress={(mealType) => handleMealPress(date, mealType)}
              />
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Action buttons */}
      <View className="flex-row p-4 bg-white border-t border-gray-200 gap-3">
        <Pressable
          onPress={handleClearPlan}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-gray-300"
        >
          <Ionicons name="trash-outline" size={20} color="#6b7280" />
          <Text className="ml-2 font-medium text-gray-600">Clear Week</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/grocery')}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-primary-500"
        >
          <Ionicons name="cart" size={20} color="white" />
          <Text className="ml-2 font-medium text-white">Grocery List</Text>
        </Pressable>
      </View>
    </View>
  );
}
