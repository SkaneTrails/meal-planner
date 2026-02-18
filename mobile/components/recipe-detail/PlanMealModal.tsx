import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { MealType } from '@/lib/types';
import { isPastDate, toBcp47 } from '@/lib/utils/dateFormatter';
import { DEFAULT_MEAL_TYPES } from './recipe-detail-constants';

interface PlanMealModalProps {
  visible: boolean;
  recipeTitle: string;
  weekDates: Date[];
  weekOffset: number;
  language: string;
  t: TFunction;
  mealTypes?: { type: MealType; labelKey: string }[];
  onClose: () => void;
  onSetWeekOffset: (offset: number) => void;
  onPlanMeal: (date: Date, mealType: MealType) => void;
  onClearMeal: (date: Date, mealType: MealType) => void;
  getMealForSlot: (date: Date, mealType: MealType) => string | null;
}

export const PlanMealModal = ({
  visible,
  recipeTitle,
  weekDates,
  weekOffset,
  language,
  t,
  mealTypes: mealTypesProp,
  onClose,
  onSetWeekOffset,
  onPlanMeal,
  onClearMeal,
  getMealForSlot,
}: PlanMealModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const resolvedMealTypes = mealTypesProp ?? DEFAULT_MEAL_TYPES;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('recipe.addToMealPlan')}
    >
      {/* Week navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          gap: spacing.xl,
        }}
      >
        <Button
          variant="icon"
          onPress={() => onSetWeekOffset(0)}
          disabled={weekOffset === 0}
          icon="chevron-back"
          iconSize={24}
          textColor={colors.text.inverse}
          style={{ padding: spacing.sm, opacity: weekOffset === 0 ? 0.3 : 1 }}
        />
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fonts.bodySemibold,
            color: colors.text.inverse,
          }}
        >
          {weekOffset === 0 ? t('recipe.thisWeek') : t('recipe.nextWeek')}
        </Text>
        <Button
          variant="icon"
          onPress={() => onSetWeekOffset(1)}
          disabled={weekOffset === 1}
          icon="chevron-forward"
          iconSize={24}
          textColor={colors.text.inverse}
          style={{ padding: spacing.sm, opacity: weekOffset === 1 ? 0.3 : 1 }}
        />
      </View>

      <Text
        style={{
          fontSize: fontSize.xl,
          fontFamily: fonts.body,
          color: colors.gray[500],
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.lg,
        }}
      >
        {t('recipe.selectDayPrompt', { title: recipeTitle })}
      </Text>

      <ScrollView style={{ paddingHorizontal: spacing.xl }}>
        {weekDates.map((date) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = isPastDate(date);
          const dayName = date.toLocaleDateString(toBcp47(language), {
            weekday: 'short',
          });
          const monthDay = date.toLocaleDateString(toBcp47(language), {
            month: 'short',
            day: 'numeric',
          });

          return (
            <View
              key={date.toISOString()}
              style={{ marginBottom: spacing.lg, opacity: isPast ? 0.4 : 1 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                {isToday && (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 3,
                      borderRadius: borderRadius.sm,
                      marginRight: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        fontFamily: fonts.bodyBold,
                        color: colors.white,
                      }}
                    >
                      {t('recipe.today')}
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontFamily: fonts.bodySemibold,
                    color: isToday ? colors.text.inverse : colors.gray[500],
                  }}
                >
                  {dayName} · {monthDay}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {resolvedMealTypes.map(({ type, labelKey }) => {
                  const existingMeal = getMealForSlot(date, type);
                  const isTaken = !!existingMeal;
                  const translatedLabel = t(labelKey);

                  return (
                    <View
                      key={type}
                      style={{ flex: 1, flexDirection: 'row', gap: spacing.xs }}
                    >
                      <Pressable
                        onPress={() => onPlanMeal(date, type)}
                        disabled={isPast}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor: isTaken
                            ? colors.bgDark
                            : pressed
                              ? colors.bgDark
                              : colors.bgMid,
                          paddingVertical: spacing.md,
                          borderRadius: isTaken
                            ? borderRadius.sm
                            : borderRadius.md,
                          borderTopRightRadius: isTaken ? 0 : borderRadius.md,
                          borderBottomRightRadius: isTaken
                            ? 0
                            : borderRadius.md,
                          alignItems: 'center',
                          borderWidth: isTaken ? 2 : 0,
                          borderRightWidth: isTaken ? 0 : 0,
                          borderColor: colors.primary,
                        })}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.xs,
                          }}
                        >
                          {isTaken && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color={colors.text.inverse}
                            />
                          )}
                          <Text
                            style={{
                              fontSize: fontSize.lg,
                              fontFamily: fonts.bodySemibold,
                              color: colors.text.inverse,
                            }}
                          >
                            {translatedLabel}
                          </Text>
                        </View>
                      </Pressable>
                      {isTaken && !isPast && (
                        <Pressable
                          onPress={() => onClearMeal(date, type)}
                          style={({ pressed }) => ({
                            backgroundColor: pressed
                              ? colors.error
                              : colors.errorBg,
                            paddingHorizontal: spacing.sm,
                            borderRadius: borderRadius.sm,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderLeftWidth: 0,
                            borderColor: colors.primary,
                          })}
                        >
                          {({ pressed }) => (
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={pressed ? colors.white : colors.error}
                            />
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </BottomSheetModal>
  );
};
