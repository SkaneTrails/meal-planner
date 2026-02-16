/**
 * Recipe card component for displaying a recipe in a grid or list.
 * Premium card design with white background, tall images, and smooth animations.
 * Uses expo-image for progressive loading and caching.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { hapticLight } from '@/lib/haptics';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import {
  borderRadius,
  circleStyle,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  iconContainer,
  shadows,
} from '@/lib/theme';
import type { DietLabel, Recipe } from '@/lib/types';

const PLACEHOLDER_BLURHASH = 'L5PZfS~q.8-;_3t7xuIU00og?bD%';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  compact?: boolean;
  cardSize?: number;
  showFavorite?: boolean; // Whether to show favorite heart icon
}

const DIET_LABEL_KEYS: Record<DietLabel, string> = {
  veggie: 'labels.diet.veggie',
  fish: 'labels.diet.fish',
  meat: 'labels.diet.meat',
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400';

export const RecipeCard = ({
  recipe,
  onPress,
  compact = false,
  cardSize,
  showFavorite = true,
}: RecipeCardProps) => {
  const { isFavorite, toggleFavorite } = useSettings();
  const { t } = useTranslation();
  const isRecipeFavorite = isFavorite(recipe.id);

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

  const handleToggleFavorite = (e: GestureResponderEvent) => {
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
        style={{ marginBottom: 14 }}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            backgroundColor: colors.glass.heavy,
            borderRadius: borderRadius.lg,
            transform: [{ scale: scaleAnim }],
            boxShadow: '2px 6px 16px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Image
            source={{
              uri:
                recipe.thumbnail_url || recipe.image_url || PLACEHOLDER_IMAGE,
            }}
            style={{ width: 60, height: 60, borderRadius: 14 }}
            contentFit="cover"
            placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
            transition={200}
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: fontFamily.bodyMedium,
                color: colors.content.heading,
                letterSpacing: -0.2,
                lineHeight: 22,
              }}
              numberOfLines={1}
            >
              {recipe.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                gap: 10,
              }}
            >
              {recipe.diet_label && (
                <View
                  style={{
                    backgroundColor:
                      recipe.diet_label === 'veggie'
                        ? colors.diet.veggie.cardBg
                        : recipe.diet_label === 'fish'
                          ? colors.diet.fish.cardBg
                          : colors.diet.meat.cardBg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: fontFamily.bodyMedium,
                      color:
                        recipe.diet_label === 'veggie'
                          ? colors.diet.veggie.text
                          : recipe.diet_label === 'fish'
                            ? colors.diet.fish.text
                            : colors.diet.meat.text,
                    }}
                  >
                    {t(DIET_LABEL_KEYS[recipe.diet_label])}
                  </Text>
                </View>
              )}
              {recipe.enhanced && (
                <View
                  style={{
                    backgroundColor: colors.ai.light,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={colors.ai.primary}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: fontWeight.semibold,
                      color: colors.ai.primary,
                      marginLeft: 3,
                    }}
                  >
                    AI
                  </Text>
                </View>
              )}
              {recipe.rating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={recipe.rating >= 3 ? 'thumbs-up' : 'thumbs-down'}
                    size={13}
                    color={
                      recipe.rating >= 3
                        ? colors.rating.positive
                        : colors.rating.negative
                    }
                  />
                </View>
              )}
              {totalTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={colors.content.icon}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.content.subtitle,
                      marginLeft: 4,
                    }}
                  >
                    {totalTime}m
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.surface.border}
          />
        </Animated.View>
      </Pressable>
    );
  }

  // Content area below image: title (20px + 4px margin) + meal badge row (20px) + padding (6+8+6)
  const CARD_CONTENT_HEIGHT = 64;
  const imageHeight = cardSize ? cardSize * 0.65 : 120;
  const cardHeight = imageHeight + CARD_CONTENT_HEIGHT;

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
          boxShadow: '2px 6px 16px 0px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Image with gradient overlay */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{
              uri:
                recipe.thumbnail_url || recipe.image_url || PLACEHOLDER_IMAGE,
            }}
            style={{ width: '100%', height: imageHeight }}
            contentFit="cover"
            placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
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

          {/* AI Enhanced badge - top left */}
          {recipe.enhanced && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: colors.ai.badge,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                ...shadows.sm,
              }}
            >
              <Ionicons name="sparkles" size={12} color={colors.white} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                  marginLeft: 3,
                }}
              >
                AI
              </Text>
            </View>
          )}

          {/* Favorite heart icon - top right, subtle */}
          {showFavorite && (
            <Pressable
              onPress={handleToggleFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: isRecipeFavorite
                  ? 'rgba(220, 38, 38, 0.9)'
                  : colors.glass.bright,
                ...circleStyle(iconContainer.sm),
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.sm,
              }}
            >
              <Ionicons
                name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={
                  isRecipeFavorite ? colors.white : colors.content.secondary
                }
              />
            </Pressable>
          )}
        </View>

        {/* Content below image */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            paddingBottom: 8,
            gap: 4,
          }}
        >
          {/* Title - 2 lines max */}
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.bodySemibold,
              fontWeight: fontWeight.semibold,
              color: colors.content.heading,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          {/* Time info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {totalTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.content.secondary}
                />
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.content.secondary,
                    marginLeft: 3,
                  }}
                >
                  {totalTime} min
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="people-outline"
                  size={13}
                  color={colors.content.secondary}
                />
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.content.secondary,
                    marginLeft: 3,
                  }}
                >
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};
