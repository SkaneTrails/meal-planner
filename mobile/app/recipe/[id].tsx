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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useDeleteRecipe, useEnhancedMode } from '@/lib/hooks';
import { BouncingLoader } from '@/components';
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
  const { isEnhanced } = useEnhancedMode();
  const { data: recipe, isLoading, error } = useRecipe(id, isEnhanced);
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3' }}>
        <BouncingLoader size={14} />
        <Text style={{ color: '#4A3728', fontSize: 15, marginTop: 16 }}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={56} color="#a87a3a" />
        <Text style={{ color: '#4A3728', fontSize: 17, fontWeight: '600', marginTop: 16 }}>Recipe not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4A3728', borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Go Back</Text>
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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleShare} style={{ padding: 8 }}>
                <Ionicons name="share-outline" size={24} color="white" />
              </Pressable>
              <Pressable onPress={handleDelete} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: '#F5E6D3' }}>
        {/* Hero image */}
        <Image
          source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
          style={{ width: '100%', height: 256 }}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={{ padding: 16, marginTop: -24, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          {/* Title and labels */}
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#4A3728' }}>
            {recipe.title}
          </Text>

          {/* Meta info */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 }}>
            {recipe.diet_label && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A3728', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ marginRight: 4 }}>{DIET_LABELS[recipe.diet_label].emoji}</Text>
                <Text style={{ fontSize: 13, color: '#fff' }}>
                  {DIET_LABELS[recipe.diet_label].label}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View style={{ backgroundColor: '#E8D5C4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ fontSize: 13, color: '#4A3728' }}>
                  {MEAL_LABELS[recipe.meal_label]}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings */}
          <View style={{ flexDirection: 'row', marginTop: 16, backgroundColor: '#F5E6D3', borderRadius: 16, padding: 16 }}>
            {recipe.prep_time && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Ionicons name="timer-outline" size={22} color="#4A3728" />
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Prep</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                  {recipe.prep_time} min
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
                <Ionicons name="flame-outline" size={22} color="#4A3728" />
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Cook</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                  {recipe.cook_time} min
                </Text>
              </View>
            )}
            {totalTime && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
                <Ionicons name="time-outline" size={22} color="#4A3728" />
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Total</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                  {totalTime} min
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
                <Ionicons name="people-outline" size={22} color="#4A3728" />
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Servings</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 8 }}>
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: '#4A3728', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}
                >
                  <Text style={{ fontSize: 13, color: '#fff' }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#4A3728', marginBottom: 12 }}>
              Ingredients
            </Text>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No ingredients listed</Text>
            ) : (
              recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A3728', marginTop: 8, marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 }}>
                    {ingredient}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Instructions */}
          <View style={{ marginTop: 24, marginBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#4A3728', marginBottom: 12 }}>
              Instructions
            </Text>
            {recipe.instructions.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No instructions listed</Text>
            ) : (
              recipe.instructions.map((instruction, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#4A3728', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 }}>
                    {instruction}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Source link */}
          {recipe.url && (
            <Pressable
              onPress={() => Linking.openURL(recipe.url).catch(() => {
                Alert.alert('Error', 'Could not open the recipe URL');
              })}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}
            >
              <Ionicons name="link-outline" size={18} color="#4A3728" />
              <Text style={{ color: '#4A3728', marginLeft: 8, fontSize: 15 }} numberOfLines={1}>
                View original recipe
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}
