/**
 * Meal grid cell for displaying a single meal slot.
 * Layout matches Streamlit app design.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
      style={{
        padding: 12,
        borderRadius: 16,
        minHeight: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
      >
        <Ionicons
          name={MEAL_TYPE_ICONS[mealType]}
          size={14}
          color={hasContent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Text
          style={{
            fontSize: 12,
            marginLeft: 4,
            color: hasContent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {MEAL_TYPE_LABELS[mealType]}
        </Text>
      </View>

      {displayText ? (
        <Text
          style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add" size={20} color="rgba(255, 255, 255, 0.5)" />
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
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      {/* Day header */}
      <View
        style={{
          alignItems: 'center',
          paddingVertical: 8,
          marginBottom: 8,
          borderRadius: 16,
          backgroundColor: isToday ? '#4A3728' : '#f3f4f6',
        }}
      >
        <Text style={{ fontSize: 12, color: isToday ? '#fff' : '#4b5563' }}>
          {dayName}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: isToday ? '#fff' : '#4A3728',
          }}
        >
          {dayNumber}
        </Text>
      </View>

      {/* Meal cells */}
      <View style={{ gap: 8 }}>
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
        <View
          style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: '#E8D5C4',
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: '#4A3728' }} numberOfLines={2}>
            {note}
          </Text>
        </View>
      )}
    </View>
  );
}
