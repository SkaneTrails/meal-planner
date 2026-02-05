/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Luxurious card design with refined shadows and smooth animations.
 * Uses expo-image for progressive loading and caching.
 */

import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, letterSpacing } from '@/lib/theme';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

// Blurhash placeholder for loading state (soft cream color)
const PLACEHOLDER_BLURHASH = 'L5PZfS~q.8-;_3t7xuIU00og?bD%';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
}

const DIET_LABELS: Record<DietLabel, { label: string; color: string; bgColor: string }> = {
  veggie: { label: 'Veggie', color: colors.diet.veggie.text, bgColor: colors.diet.veggie.bg },
  fish: { label: 'Fish', color: colors.diet.fish.text, bgColor: colors.diet.fish.bg },
  meat: { label: 'Meat', color: colors.diet.meat.text, bgColor: colors.diet.meat.bg },
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
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ marginBottom: 12 }}
      >
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.lg,
          transform: [{ scale: scaleAnim }],
        }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: 56, height: 56, borderRadius: borderRadius.sm }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={200}
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.text.inverse,
              letterSpacing: letterSpacing.normal,
            }} numberOfLines={1}>
              {recipe.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
              {recipe.diet_label && (
                <View style={{
                  backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: borderRadius.full,
                }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: DIET_LABELS[recipe.diet_label].color }}>
                    {DIET_LABELS[recipe.diet_label].label}
                  </Text>
                </View>
              )}
              {recipe.rating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                    size={13}
                    color={recipe.rating >= 3 ? colors.success : colors.error}
                  />
                </View>
              )}
              {totalTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={13} color={colors.text.muted} />
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary, marginLeft: 4 }}>{totalTime}m</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: borderRadius.sm, padding: 10 }}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.inverse} />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Grid card layout - streaming app style with large image and text below
  // Image takes most of the card with generous rounded corners
  const imageHeight = cardSize ? cardSize * 0.72 : 140;
  const cardHeight = cardSize ? cardSize * 1.0 : 180;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          width: cardSize,
          height: cardHeight,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Image card with glass effect */}
        <View style={{
          backgroundColor: colors.glass.card,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: imageHeight, borderRadius: 20 }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={300}
          />
          
          {/* Diet label badge - bottom left overlaid on image */}
          {recipe.diet_label && (
            <View style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              backgroundColor: recipe.diet_label === 'veggie'
                ? 'rgba(46, 125, 50, 0.85)'
                : recipe.diet_label === 'fish'
                  ? 'rgba(21, 101, 192, 0.85)'
                  : 'rgba(198, 40, 40, 0.85)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
            }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.white }}>
                {DIET_LABELS[recipe.diet_label].label}
              </Text>
            </View>
          )}

          {/* Rating badge - top right */}
          {recipe.rating && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Ionicons
                name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                size={12}
                color={recipe.rating >= 3 ? colors.success : colors.error}
              />
            </View>
          )}
        </View>

        {/* Title below card */}
        <View style={{ paddingTop: 6, paddingHorizontal: 2 }}>
          <Text style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            color: colors.white,
            lineHeight: 20,
          }} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
