/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Modern card design with smooth press animations.
 * Uses expo-image for progressive loading and caching.
 */

import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, fontSize, fontWeight } from '@/lib/theme';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

// Blurhash placeholder for loading state (warm beige color)
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

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
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          ...shadows.md,
          transform: [{ scale: scaleAnim }],
        }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: 52, height: 52, borderRadius: 14 }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={200}
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.primary, letterSpacing: -0.2 }} numberOfLines={1}>
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
                  <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: DIET_LABELS[recipe.diet_label].color }}>
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
                  <Text style={{ fontSize: fontSize.base, color: colors.text.secondary, marginLeft: 4 }}>{totalTime}m</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ backgroundColor: colors.bgMid, borderRadius: 10, padding: 8 }}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
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
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          width: cardSize,
          height: cardSize,
          ...shadows.md,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: imageHeight }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={300}
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
              <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: DIET_LABELS[recipe.diet_label].color }}>
                {DIET_LABELS[recipe.diet_label].label}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' }}>
          {/* Title row with time aligned right */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Text style={{ flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primary, lineHeight: 17, letterSpacing: -0.3 }} numberOfLines={2}>
              {recipe.title}
            </Text>
            {totalTime && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.bgMid,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
                marginTop: 1,
              }}>
                <Ionicons name="time-outline" size={11} color={colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.primary, marginLeft: 3 }}>{totalTime}m</Text>
              </View>
            )}
          </View>

          {/* Rating badge */}
          {recipe.rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: recipe.rating >= 3 ? colors.successBg : colors.errorBg,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
              }}>
                <Ionicons
                  name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                  size={11}
                  color={recipe.rating >= 3 ? colors.success : colors.error}
                />
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
