/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Luxurious card design with refined shadows and smooth animations.
 * Uses expo-image for progressive loading and caching.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  letterSpacing,
} from '@/lib/theme';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

// Blurhash placeholder for loading state (soft cream color)
const PLACEHOLDER_BLURHASH = 'L5PZfS~q.8-;_3t7xuIU00og?bD%';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
}

const DIET_LABELS: Record<
  DietLabel,
  { label: string; color: string; bgColor: string }
> = {
  veggie: {
    label: 'Veggie',
    color: colors.diet.veggie.text,
    bgColor: colors.diet.veggie.bg,
  },
  fish: {
    label: 'Fish',
    color: colors.diet.fish.text,
    bgColor: colors.diet.fish.bg,
  },
  meat: {
    label: 'Meat',
    color: colors.diet.meat.text,
    bgColor: colors.diet.meat.bg,
  },
};

const _MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  salad: 'Salad',
  meal: 'Meal',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400';

export function RecipeCard({
  recipe,
  onPress,
  compact = false,
  cardSize,
}: RecipeCardProps) {
  const totalTime =
    recipe.total_time ||
    (recipe.prep_time && recipe.cook_time
      ? recipe.prep_time + recipe.cook_time
      : null) ||
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
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.lg,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: 56, height: 56, borderRadius: borderRadius.sm }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={200}
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
                letterSpacing: letterSpacing.normal,
              }}
              numberOfLines={1}
            >
              {recipe.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                gap: 8,
              }}
            >
              {recipe.diet_label && (
                <View
                  style={{
                    backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.medium,
                      color: DIET_LABELS[recipe.diet_label].color,
                    }}
                  >
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
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={colors.text.muted}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}
                  >
                    {totalTime}m
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: borderRadius.sm,
              padding: 10,
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.inverse}
            />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Grid card layout - streaming app style with large image and text below
  // Image takes most of the card with generous rounded corners
  const imageHeight = cardSize ? cardSize * 0.75 : 140;
  const cardHeight = cardSize ? cardSize * 1.15 : 200;

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
        <View
          style={{
            backgroundColor: colors.glass.card,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: imageHeight, borderRadius: 20 }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={300}
          />

          {/* Rating badge - top left like in reference */}
          {recipe.rating && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name="star-outline"
                size={12}
                color={colors.text.inverse}
              />
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.inverse,
                  marginLeft: 4,
                }}
              >
                {recipe.rating}.0
              </Text>
            </View>
          )}

          {/* Favorite/heart icon - top right */}
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: 6,
              borderRadius: 14,
            }}
          >
            <Ionicons name="heart-outline" size={14} color={colors.white} />
          </View>
        </View>

        {/* Text below card - streaming app style */}
        <View style={{ paddingTop: 10, paddingHorizontal: 4 }}>
          {/* Category/diet label */}
          {recipe.diet_label && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: fontWeight.medium,
                color: colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 2,
              }}
            >
              {DIET_LABELS[recipe.diet_label].label}
            </Text>
          )}

          {/* Title */}
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: colors.text.inverse,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
