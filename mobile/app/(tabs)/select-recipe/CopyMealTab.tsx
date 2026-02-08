import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, fontFamily, iconContainer } from '@/lib/theme';
import { EmptyState } from '@/components/EmptyState';
import type { MealType } from '@/lib/types';
import type { useSelectRecipeState } from './useSelectRecipeState';

type State = ReturnType<typeof useSelectRecipeState>;

interface CopyMealTabProps {
  state: State;
}

export const CopyMealTab = ({ state }: CopyMealTabProps) => {
  const {
    t, bcp47, copyWeekOffset, setCopyWeekOffset, targetWeekDates,
    existingMeals, handleCopyMeal, formatMealDate, MEAL_TYPE_LABELS,
  } = state;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
      <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginBottom: spacing.md }}>
        {t('selectRecipe.copy.title')}
      </Text>

      {/* Week selector */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.lg, gap: spacing.sm,
      }}>
        <Pressable
          onPress={() => setCopyWeekOffset(prev => prev - 1)}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text.inverse} />
        </Pressable>
        <View style={{
          paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
          backgroundColor: colors.glass.card, borderRadius: borderRadius.sm,
        }}>
          <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse, textAlign: 'center' }}>
            {targetWeekDates.mondayDate.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' })} - {targetWeekDates.sundayDate.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <Pressable
          onPress={() => setCopyWeekOffset(prev => prev + 1)}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
        </Pressable>
      </View>

      {existingMeals.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('selectRecipe.copy.noMeals')}
          subtitle={t('selectRecipe.copy.planFirst')}
          style={{ paddingVertical: spacing['4xl'] }}
        />
      ) : (
        existingMeals.map((meal) => (
          <Pressable
            key={meal.key}
            onPress={() => handleCopyMeal(meal.recipe?.id, meal.customText)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
              borderRadius: borderRadius.sm, padding: spacing.lg,
              marginBottom: spacing.sm, ...shadows.sm,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
                {meal.recipe?.title || meal.customText}
              </Text>
              <Text style={{ fontSize: fontSize.md, color: colors.gray[600], marginTop: spacing.xs }}>
                {formatMealDate(meal.date)} · {MEAL_TYPE_LABELS[meal.mealType as MealType] || meal.mealType}
              </Text>
            </View>
            <View style={{
              width: iconContainer.md, height: iconContainer.md,
              borderRadius: iconContainer.md / 2,
              backgroundColor: colors.glass.light,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="copy-outline" size={18} color={colors.text.inverse} />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
};
