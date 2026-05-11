/**
 * WeekStrip — at-a-glance 7-day overview for the home screen.
 *
 * Renders M T W T F S S as small day chips with a dot indicator under
 * days that have planned meals. Today is emphasised. Tapping the strip
 * (or any day) navigates to the meal-plan tab.
 *
 * Replaces the old stats-tile dashboard ("Recipes / Planned 0% / To Buy")
 * with something actually actionable: "what does my week look like?"
 */

import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';
import { formatDateLocal, getWeekDatesArray } from '@/lib/utils/dateFormatter';

type Data = ReturnType<typeof useHomeScreenData>;

interface WeekStripProps {
  mealPlan: Data['mealPlan'];
  weekStart: Data['weekStart'];
  t: Data['t'];
}

export const WeekStrip = ({ mealPlan, weekStart, t }: WeekStripProps) => {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const weekDates = getWeekDatesArray(0, weekStart);
  const todayStr = formatDateLocal(new Date());
  const meals = mealPlan?.meals ?? {};

  const dayHasMeal = (date: Date): boolean => {
    const dateStr = formatDateLocal(date);
    return Boolean(meals[`${dateStr}_lunch`] || meals[`${dateStr}_dinner`]);
  };

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        marginBottom: spacing['2xl'],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodySemibold,
            fontSize: fontSize.xs,
            color: colors.content.subtitle,
            letterSpacing: letterSpacing.wider,
            textTransform: 'uppercase',
          }}
        >
          {t('home.thisWeek')}
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/meal-plan')}
        >
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: fontSize.sm,
              color: colors.accent,
            }}
          >
            {t('home.openPlanner')}
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {weekDates.map((date) => {
          const isToday = formatDateLocal(date) === todayStr;
          const hasMeal = dayHasMeal(date);
          const dayLabel = date
            .toLocaleDateString(undefined, { weekday: 'narrow' })
            .toUpperCase();

          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={date.toDateString()}
              onPress={() => router.push('/meal-plan')}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.xs,
                marginHorizontal: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bodySemibold,
                  fontSize: fontSize.xs,
                  color: isToday ? colors.accent : colors.content.subtitle,
                  marginBottom: spacing.xs,
                  letterSpacing: letterSpacing.wide,
                }}
              >
                {dayLabel}
              </Text>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? colors.accent : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: isToday ? fonts.bodyBold : fonts.bodyMedium,
                    fontSize: fontSize.md,
                    color: isToday ? colors.white : colors.content.body,
                  }}
                >
                  {date.getDate()}
                </Text>
              </View>
              <View
                style={{
                  marginTop: 6,
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: hasMeal
                    ? isToday
                      ? colors.accent
                      : colors.content.subtitle
                    : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
