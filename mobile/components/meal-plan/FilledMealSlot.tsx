import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontFamily } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import { formatDateLocal } from '@/lib/utils/dateFormatter';
import { PLACEHOLDER_IMAGE } from './meal-plan-constants';
import type { MealType, Recipe } from '@/lib/types';

interface FilledMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  recipe?: Recipe;
  customText?: string;
  onRemove: (date: Date, mealType: MealType, title: string, label: string) => void;
  onMealPress: (date: Date, mealType: MealType, mode: 'library' | 'copy' | 'quick' | 'random') => void;
}

export const FilledMealSlot = ({
  date,
  mealType,
  label,
  recipe,
  customText,
  onRemove,
  onMealPress,
}: FilledMealSlotProps) => {
  const router = useRouter();
  const title = recipe?.title || customText || '';
  const imageUrl = recipe?.thumbnail_url || recipe?.image_url || PLACEHOLDER_IMAGE;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 14,
        padding: 14,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Pressable
        onPress={() => recipe ? router.push(`/recipe/${recipe.id}`) : onMealPress(date, mealType, 'library')}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontFamily: fontFamily.bodySemibold, color: '#2D2D2D' }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: fontFamily.body, color: 'rgba(93, 78, 64, 0.7)', marginTop: 2 }}>
            {label}
          </Text>
        </View>
      </Pressable>

      {customText && !recipe && (
        <AnimatedPressable
          onPress={() => {
            const dateStr = formatDateLocal(date);
            router.push({
              pathname: '/select-recipe',
              params: { date: dateStr, mealType, mode: 'quick', initialText: customText },
            });
          }}
          hoverScale={1.1}
          pressScale={0.9}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          <Ionicons name="create-outline" size={16} color="#5D4E40" />
        </AnimatedPressable>
      )}

      <AnimatedPressable
        onPress={() => onRemove(date, mealType, title, label)}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: 'rgba(93, 78, 64, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={18} color="#5D4E40" />
      </AnimatedPressable>
    </View>
  );
};
