/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Premium card design with white background, tall images, and smooth animations.
 * Uses expo-image for progressive loading and caching.
 */

import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, letterSpacing, shadows } from '@/lib/theme';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import { hapticLight } from '@/lib/haptics';
import type { Recipe, DietLabel } from '@/lib/types';

// Blurhash placeholder for loading state (soft cream color)
const PLACEHOLDER_BLURHASH = 'L5PZfS~q.8-;_3t7xuIU00og?bD%';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
  showFavorite?: boolean; // Whether to show favorite heart icon
}

const DIET_COLORS: Record<DietLabel, { text: string; bg: string }> = {
  veggie: { text: colors.diet.veggie.text, bg: colors.diet.veggie.bg },
  fish: { text: colors.diet.fish.text, bg: colors.diet.fish.bg },
  meat: { text: colors.diet.meat.text, bg: colors.diet.meat.bg },
};

const DIET_LABEL_KEYS: Record<DietLabel, string> = {
  veggie: 'labels.diet.veggie',
  fish: 'labels.diet.fish',
  meat: 'labels.diet.meat',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400';

export function RecipeCard({ recipe, onPress, compact = false, cardSize, showFavorite = true }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useSettings();
  const { t } = useTranslation();
  const isRecipeFavorite = isFavorite(recipe.id);

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

  const handleToggleFavorite = (e: any) => {
    e.stopPropagation();
    hapticLight();
    toggleFavorite(recipe.id);
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
                  backgroundColor: DIET_COLORS[recipe.diet_label].bg,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: borderRadius.full,
                }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: DIET_COLORS[recipe.diet_label].text }}>
                    {t(DIET_LABEL_KEYS[recipe.diet_label])}
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

  // Grid card layout - premium white card with tall image and content below
  // 4:5 aspect ratio image with gradient overlay
  const imageHeight = cardSize ? cardSize * 1.1 : 180; // Taller 4:5ish ratio
  const cardHeight = cardSize ? cardSize * 1.5 : 260;

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
          backgroundColor: colors.white,
          borderRadius: 22,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }],
          ...shadows.md,
        }}
      >
        {/* Image with gradient overlay */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: imageHeight }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={300}
          />

          {/* Subtle bottom gradient for depth */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
            }}
          />

          {/* Favorite heart icon - top right, subtle */}
          {showFavorite && (
            <Pressable
              onPress={handleToggleFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: isRecipeFavorite ? 'rgba(220, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.sm,
              }}
            >
              <Ionicons
                name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isRecipeFavorite ? colors.white : '#8B7355'}
              />
            </Pressable>
          )}
        </View>

        {/* Content below image */}
        <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
          {/* Title - 2 lines max */}
          <Text style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
            color: '#3D3228',
            lineHeight: 20,
          }} numberOfLines={2}>
            {recipe.title}
          </Text>

          {/* Time info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {totalTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={14} color="#8B7355" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginLeft: 4 }}>{totalTime} min</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people-outline" size={14} color="#8B7355" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginLeft: 4 }}>{recipe.servings}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
