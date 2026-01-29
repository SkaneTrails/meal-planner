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

      <View style={{ flex: 1, backgroundColor: '#F5E6D3' }}>
        {/* Search bar */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5E6D3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Ionicons name="search" size={20} color="#4A3728" />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#4A3728' }}
              placeholder="Search recipes..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#4A3728" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Custom text input */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
            Or enter custom text
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, backgroundColor: '#F5E6D3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#4A3728' }}
              placeholder="e.g., Leftovers, Eating out..."
              placeholderTextColor="#9ca3af"
              value={customText}
              onChangeText={setCustomText}
            />
            <Pressable
              onPress={handleSetCustomText}
              disabled={!customText.trim() || setMeal.isPending}
              style={{ marginLeft: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: customText.trim() ? '#4A3728' : '#9CA3AF' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add</Text>
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
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="book-outline" size="56" color="#4A3728" />
              <Text style={{ color: '#6b7280', fontSize: 17, marginTop: 16, textAlign: 'center' }}>
                {searchQuery ? 'No recipes match your search' : 'No recipes yet'}
              </Text>
              <Pressable
                onPress={() => {
                  router.back();
                  router.push('/add-recipe');
                }}
                style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4A3728', borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add a Recipe</Text>
              </Pressable>
            </View>
          }
        />

        {/* Remove meal button */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
          <Pressable
            onPress={handleRemoveMeal}
            disabled={removeMeal.isPending}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5E6D3' }}
          >
            <Ionicons name="trash-outline" size={18} color="#4A3728" />
            <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
              Clear This Meal
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
