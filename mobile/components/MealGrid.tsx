/**
 * Meal grid cell for displaying a single meal slot.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MealType, Recipe } from '@/lib/types';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface MealCellProps {
  date: string;
  mealType: MealType;
  recipe?: Recipe | null;
  customText?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
}

const MEAL_TYPE_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function MealCell({
  date,
  mealType,
  recipe,
  customText,
  onPress,
  onLongPress,
}: MealCellProps) {
  const hasContent = recipe || customText;
  const displayText = recipe?.title || customText;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`
        p-3 rounded-lg border min-h-[80px]
        ${hasContent
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200 border-dashed'
        }
      `}
    >
      <View className="flex-row items-center mb-1">
        <Ionicons
          name={MEAL_TYPE_ICONS[mealType]}
          size={14}
          color={hasContent ? '#15803d' : '#9ca3af'}
        />
        <Text
          className={`text-xs ml-1 ${
            hasContent ? 'text-primary-700' : 'text-gray-400'
          }`}
        >
          {MEAL_TYPE_LABELS[mealType]}
        </Text>
      </View>

      {displayText ? (
        <Text
          className="text-sm text-gray-900 font-medium"
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="add" size={20} color="#9ca3af" />
        </View>
      )}
    </Pressable>
  );
}

interface DayColumnProps {
  date: Date;
  meals: Record<MealType, { recipe?: Recipe; customText?: string }>;
  note?: string;
  onMealPress?: (mealType: MealType) => void;
  onMealLongPress?: (mealType: MealType) => void;
}

export function DayColumn({
  date,
  meals,
  note,
  onMealPress,
  onMealLongPress,
}: DayColumnProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const isToday = new Date().toDateString() === date.toDateString();

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <View className="flex-1 mx-1">
      {/* Day header */}
      <View
        className={`items-center py-2 mb-2 rounded-lg ${
          isToday ? 'bg-primary-500' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-xs ${isToday ? 'text-white' : 'text-gray-500'}`}
        >
          {dayName}
        </Text>
        <Text
          className={`text-lg font-bold ${
            isToday ? 'text-white' : 'text-gray-900'
          }`}
        >
          {dayNumber}
        </Text>
      </View>

      {/* Meal cells */}
      <View className="gap-2">
        {mealTypes.map((mealType) => {
          const mealData = meals[mealType] || {};
          return (
            <MealCell
              key={`${formatDateLocal(date)}-${mealType}`}
              date={formatDateLocal(date)}
              mealType={mealType}
              recipe={mealData.recipe}
              customText={mealData.customText}
              onPress={() => onMealPress?.(mealType)}
              onLongPress={() => onMealLongPress?.(mealType)}
            />
          );
        })}
      </View>

      {/* Note indicator */}
      {note && (
        <View className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <Text className="text-xs text-yellow-800" numberOfLines={2}>
            {note}
          </Text>
        </View>
      )}
    </View>
  );
}
