import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { IconCircle } from '@/components';
import { EmptyState } from '@/components/EmptyState';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import {
  accentUnderlineStyle,
  fontSize,
  fontWeight,
  iconContainer,
  layout,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { MealType } from '@/lib/types';

type State = ReturnType<typeof useSelectRecipeState>;

interface CopyMealTabProps {
  state: State;
}

export const CopyMealTab = ({ state }: CopyMealTabProps) => {
  const { colors, fonts, borderRadius, shadows, circleStyle } = useTheme();
  const {
    t,
    bcp47,
    setCopyWeekOffset,
    targetWeekDates,
    existingMeals,
    handleCopyMeal,
    formatMealDate,
    MEAL_TYPE_LABELS,
  } = state;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: layout.tabBar.contentBottomPadding,
      }}
    >
      {/* Header with sage accent */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <IconCircle
          size="lg"
          bg={colors.ai.light}
          style={{ marginBottom: spacing.sm }}
        >
          <Ionicons name="copy" size={24} color={colors.ai.primary} />
        </IconCircle>
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.text.inverse,
            textAlign: 'center',
            letterSpacing: letterSpacing.snug,
          }}
        >
          {t('selectRecipe.copy.title')}
        </Text>
        <View
          style={{
            ...accentUnderlineStyle,
            marginTop: spacing.sm,
          }}
        />
      </View>

      {/* Week selector */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => setCopyWeekOffset((prev) => prev - 1)}
          style={({ pressed }) => ({
            ...circleStyle(iconContainer.xs),
            backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text.inverse} />
        </Pressable>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.text.inverse,
              textAlign: 'center',
            }}
          >
            {targetWeekDates.mondayDate.toLocaleDateString(bcp47, {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {targetWeekDates.sundayDate.toLocaleDateString(bcp47, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Pressable
          onPress={() => setCopyWeekOffset((prev) => prev + 1)}
          style={({ pressed }) => ({
            ...circleStyle(iconContainer.xs),
            backgroundColor: pressed ? colors.glass.medium : colors.glass.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.inverse}
          />
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
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed
                ? colors.glass.medium
                : colors.glass.card,
              borderRadius: borderRadius.sm,
              padding: spacing.lg,
              marginBottom: spacing.sm,
              ...shadows.sm,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.inverse,
                }}
              >
                {meal.recipe?.title || meal.customText}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: colors.gray[600],
                  marginTop: spacing.xs,
                }}
              >
                {formatMealDate(meal.date)} ·{' '}
                {MEAL_TYPE_LABELS[meal.mealType as MealType] || meal.mealType}
              </Text>
            </View>
            <IconCircle size="md" bg={colors.glass.light}>
              <Ionicons
                name="copy-outline"
                size={18}
                color={colors.text.inverse}
              />
            </IconCircle>
          </Pressable>
        ))
      )}

      {/* Clear meal button */}
      <Pressable
        onPress={state.handleRemoveMeal}
        disabled={state.removeMeal.isPending}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.sm,
          backgroundColor: pressed
            ? colors.surface.active
            : colors.surface.hover,
          marginTop: spacing.lg,
        })}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={colors.content.tertiary}
        />
        <Text
          style={{
            marginLeft: spacing.sm,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            color: colors.content.tertiary,
          }}
        >
          {t('selectRecipe.clearMeal')}
        </Text>
      </Pressable>
    </ScrollView>
  );
};
