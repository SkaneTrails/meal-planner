import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import { formatWeekRange } from '@/lib/utils/dateFormatter';

interface WeekSelectorProps {
  weekDates: Date[];
  weekOffset: number;
  language: string;
  t: TFunction;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onJumpToToday: () => void;
}

export const WeekSelector = ({
  weekDates,
  weekOffset,
  language,
  t,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
}: WeekSelectorProps) => {
  const { colors, fonts, borderRadius, crt } = useTheme();
  return (
    <View
      style={{ paddingHorizontal: spacing['2xl'], marginBottom: spacing.lg }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing['sm-md'],
        }}
      >
        <AnimatedPressable
          onPress={() => {
            hapticLight();
            onPreviousWeek();
          }}
          hoverScale={1.1}
          pressScale={0.9}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: colors.glass.subtle,
          }}
        >
          {crt ? (
            <Text
              style={{
                color: colors.primary,
                fontFamily: fonts.body,
                fontSize: 18,
              }}
              selectable={false}
            >
              {'\u25C4'}
            </Text>
          ) : (
            <Ionicons
              name="chevron-back"
              size={18}
              color={colors.content.tertiary}
            />
          )}
        </AnimatedPressable>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              fontWeight: fontWeight.semibold,
              color: colors.content.strong,
            }}
          >
            {formatWeekRange(weekDates, language)}
          </Text>
          {weekOffset !== 0 && (
            <Pressable
              onPress={() => {
                hapticLight();
                onJumpToToday();
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontFamily: fonts.body,
                  color: colors.accent,
                  marginTop: 2,
                  fontWeight: fontWeight.medium,
                }}
              >
                {t('mealPlan.jumpToToday')}
              </Text>
            </Pressable>
          )}
        </View>

        <AnimatedPressable
          onPress={() => {
            hapticLight();
            onNextWeek();
          }}
          hoverScale={1.1}
          pressScale={0.9}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: colors.glass.subtle,
          }}
        >
          {crt ? (
            <Text
              style={{
                color: colors.primary,
                fontFamily: fonts.body,
                fontSize: 18,
              }}
              selectable={false}
            >
              {'\u25BA'}
            </Text>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.content.tertiary}
            />
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};
