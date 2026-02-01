/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Modern card design with smooth press animations.
 */

import React from 'react';
import { View, Text, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
}

const DIET_LABELS: Record<DietLabel, { label: string; color: string; bgColor: string }> = {
  veggie: { label: 'Veggie', color: '#166534', bgColor: '#DCFCE7' },  // pastel green
  fish: { label: 'Fish', color: '#1E40AF', bgColor: '#DBEAFE' },      // pastel blue
  meat: { label: 'Meat', color: '#991B1B', bgColor: '#FEE2E2' },      // pastel red/pink
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',  salad: 'Salad',  meal: 'Meal',
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

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ marginBottom: 10 }}
      >
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          backgroundColor: '#fff',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
          transform: [{ scale: scaleAnim }],
        }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: 52, height: 52, borderRadius: 14 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', letterSpacing: -0.2 }} numberOfLines={1}>
              {recipe.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 }}>
              {recipe.diet_label && (
                <View style={{
                  backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: DIET_LABELS[recipe.diet_label].color }}>
                    {DIET_LABELS[recipe.diet_label].label}
                  </Text>
                </View>
              )}
              {recipe.rating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                    size={13}
                    color={recipe.rating >= 3 ? '#16A34A' : '#DC2626'}
                  />
                </View>
              )}
              {totalTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>{totalTime}m</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ backgroundColor: '#F5E6D3', borderRadius: 10, padding: 8 }}>
            <Ionicons name="chevron-forward" size={18} color="#4A3728" />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Grid card layout - square cards with image taking most of the space
  const imageHeight = cardSize ? cardSize * 0.72 : 128;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          width: cardSize,
          height: cardSize,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: imageHeight }}
            resizeMode="cover"
          />
          {/* Diet badge overlay */}
          {recipe.diet_label && (
            <View style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: DIET_LABELS[recipe.diet_label].color }}>
                {DIET_LABELS[recipe.diet_label].label}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' }}>
          {/* Title row with time aligned right */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#4A3728', lineHeight: 17, letterSpacing: -0.3 }} numberOfLines={2}>
              {recipe.title}
            </Text>
            {totalTime && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F5E6D3',
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
                marginTop: 1,
              }}>
                <Ionicons name="time-outline" size={11} color="#4A3728" />
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#4A3728', marginLeft: 3 }}>{totalTime}m</Text>
              </View>
            )}
          </View>

          {/* Rating badge */}
          {recipe.rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: recipe.rating >= 3 ? '#DCFCE7' : '#FEE2E2',
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
              }}>
                <Ionicons
                  name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                  size={11}
                  color={recipe.rating >= 3 ? '#16A34A' : '#DC2626'}
                />
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
