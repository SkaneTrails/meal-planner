/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Layout matches Streamlit app design.
 */

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
}

const DIET_LABELS: Record<DietLabel, string> = {
  veggie: 'Veggie',
  fish: 'Fish',
  meat: 'Meat',
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  meal: 'Meal',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400';

export function RecipeCard({ recipe, onPress, compact = false, cardSize }: RecipeCardProps) {
  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 16, marginBottom: 8 }}
      >
        <Image
          source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
          style={{ width: 48, height: 48, borderRadius: 16 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {recipe.diet_label && (
              <Text style={{ fontSize: 13, color: '#6b7280', marginRight: 8 }}>
                {DIET_LABELS[recipe.diet_label]}
              </Text>
            )}
            {totalTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>{totalTime}m</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </Pressable>
    );
  }

  // Grid card layout - square cards with image taking most of the space
  // Image height is ~75% of card, text takes ~25%
  const imageHeight = cardSize ? cardSize * 0.75 : 128;
  
  return (
    <Pressable
      onPress={onPress}
      style={{ 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        overflow: 'hidden', 
        width: cardSize,
        height: cardSize,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Image
        source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
        style={{ width: '100%', height: imageHeight }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#4A3728', lineHeight: 16 }} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Simple info row - diet label and time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
          {recipe.diet_label && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="leaf-outline" size={12} color="#4A3728" />
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 3 }}>
                {DIET_LABELS[recipe.diet_label]}
              </Text>
            </View>
          )}
          {totalTime && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 3 }}>{totalTime}m</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
