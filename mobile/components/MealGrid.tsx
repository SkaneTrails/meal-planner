/**
 * Meal grid cell for displaying a single meal slot.
 * Layout matches Streamlit app design.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';
import { formatDateLocal } from '@/lib/utils/dateFormatter';

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

const MEAL_TYPE_LABEL_KEYS: Record<MealType, string> = {
  breakfast: 'labels.mealTime.breakfast',
  lunch: 'labels.mealTime.lunch',
  dinner: 'labels.mealTime.dinner',
  snack: 'labels.mealTime.snack',
};

export const MealCell = ({
  date,
  mealType,
  recipe,
  customText,
  onPress,
  onLongPress,
}: MealCellProps) => {
  const { t } = useTranslation();
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
          color={hasContent ? colors.white : colors.glass.faint}
        />
        <Text
          style={{
            fontSize: 12,
            marginLeft: 4,
            color: hasContent ? colors.white : colors.glass.faint,
          }}
        >
          {t(MEAL_TYPE_LABEL_KEYS[mealType])}
        </Text>
      </View>

      {displayText ? (
        <Text
          style={{ fontSize: 14, color: colors.white, fontWeight: '500' }}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add" size={20} color={colors.glass.faint} />
        </View>
      )}
    </Pressable>
  );
};

interface DayColumnProps {
  date: Date;
  meals: Record<MealType, { recipe?: Recipe; customText?: string }>;
  note?: string;
  onMealPress?: (mealType: MealType) => void;
  onMealLongPress?: (mealType: MealType) => void;
}

export const DayColumn = ({
  date,
  meals,
  note,
  onMealPress,
  onMealLongPress,
}: DayColumnProps) => {
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
          backgroundColor: isToday
            ? colors.content.headingWarm
            : colors.gray[100],
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: isToday ? colors.white : colors.content.secondary,
          }}
        >
          {dayName}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: isToday ? colors.white : colors.content.headingWarm,
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
            backgroundColor: colors.bgMid,
            borderRadius: 16,
          }}
        >
          <Text
            style={{ fontSize: 12, color: colors.content.headingWarm }}
            numberOfLines={2}
          >
            {note}
          </Text>
        </View>
      )}
    </View>
  );
};
