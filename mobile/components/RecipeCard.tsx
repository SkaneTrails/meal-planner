/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Luxurious card design with refined shadows and smooth animations.
 * Uses expo-image for progressive loading and caching.
 */

import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, fontSize, fontWeight, letterSpacing } from '@/lib/theme';
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
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          ...shadows.md,
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
              color: colors.text.primary,
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
          <View style={{ backgroundColor: colors.gray[100], borderRadius: borderRadius.sm, padding: 10 }}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Grid card layout - elegant cards with generous image space
  const imageHeight = cardSize ? cardSize * 0.7 : 128;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
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
          {/* Diet badge overlay - refined pill style */}
          {recipe.diet_label && (
            <View style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: borderRadius.full,
            }}>
              <Text style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
                color: DIET_LABELS[recipe.diet_label].color,
              }}>
                {DIET_LABELS[recipe.diet_label].label}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' }}>
          {/* Title row with time aligned right */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Text style={{
              flex: 1,
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: colors.text.primary,
              lineHeight: 18,
              letterSpacing: letterSpacing.normal,
            }} numberOfLines={2}>
              {recipe.title}
            </Text>
            {totalTime && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.gray[100],
                paddingHorizontal: 6,
                paddingVertical: 4,
                borderRadius: borderRadius.full,
                marginTop: 1,
              }}>
                <Ionicons name="time-outline" size={11} color={colors.text.secondary} />
                <Text style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium,
                  color: colors.text.secondary,
                  marginLeft: 3,
                }}>{totalTime}m</Text>
              </View>
            )}
          </View>

          {/* Rating badge */}
          {recipe.rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: recipe.rating >= 3 ? colors.successBg : colors.errorBg,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: borderRadius.full,
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
