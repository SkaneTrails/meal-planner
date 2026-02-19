import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, IconCircle } from '@/components';
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
  const { colors, fonts, borderRadius, shadows, circleStyle, crt } = useTheme();
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
      {/* Header */}
      {crt ? (
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontFamily: fonts.bodySemibold,
              color: colors.primary,
              textAlign: 'center',
            }}
          >
            {t('selectRecipe.copy.title')}
          </Text>
        </View>
      ) : (
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
      )}

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
        <Button
          variant="icon"
          onPress={() => setCopyWeekOffset((prev) => prev - 1)}
          icon="chevron-back"
          iconSize={20}
          textColor={colors.card.textPrimary}
          color={colors.card.bg}
          style={{
            ...circleStyle(iconContainer.xs),
          }}
        />
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            backgroundColor: colors.card.bg,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.card.textPrimary,
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
        <Button
          variant="icon"
          onPress={() => setCopyWeekOffset((prev) => prev + 1)}
          icon="chevron-forward"
          iconSize={20}
          textColor={colors.card.textPrimary}
          color={colors.card.bg}
          style={{
            ...circleStyle(iconContainer.xs),
          }}
        />
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
              backgroundColor: pressed ? colors.card.bgPressed : colors.card.bg,
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
                  fontFamily: fonts.bodySemibold,
                  color: colors.card.textPrimary,
                }}
              >
                {meal.recipe?.title || meal.customText}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fonts.body,
                  color: colors.card.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {formatMealDate(meal.date)} \u00B7{' '}
                {MEAL_TYPE_LABELS[meal.mealType as MealType] || meal.mealType}
              </Text>
            </View>
            {crt ? (
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSize.md,
                  color: colors.border,
                }}
              >
                {'\u25B6'}
              </Text>
            ) : (
              <IconCircle size="md" bg={colors.glass.light}>
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={colors.text.inverse}
                />
              </IconCircle>
            )}
          </Pressable>
        ))
      )}

      {/* Clear meal button */}
      <Button
        variant="text"
        tone="destructive"
        onPress={state.handleRemoveMeal}
        disabled={state.removeMeal.isPending}
        icon="trash-outline"
        iconSize={18}
        label={t('selectRecipe.clearMeal')}
        textColor={colors.content.tertiary}
        color={colors.surface.hover}
        style={{
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.sm,
          marginTop: spacing.lg,
        }}
      />
    </ScrollView>
  );
};
