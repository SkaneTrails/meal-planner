import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import { fontSize, fontWeight, iconSize, spacing, useTheme } from '@/lib/theme';
import { toBcp47 } from '@/lib/utils/dateFormatter';

interface CollapsedDayRowProps {
  date: Date;
  mealCount: number;
  language: string;
  t: TFunction;
  onExpand: () => void;
}

export const CollapsedDayRow = ({
  date,
  mealCount,
  language,
  t,
  onExpand,
}: CollapsedDayRowProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const bcp47 = toBcp47(language);
  const dayName = date.toLocaleDateString(bcp47, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(bcp47, {
    month: 'short',
    day: 'numeric',
  });
  const summary =
    mealCount > 0
      ? t('mealPlan.mealsPlanned', { count: mealCount })
      : t('mealPlan.noMeals');

  return (
    <Pressable
      onPress={onExpand}
      style={[
        styles.container,
        {
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.sm,
          ...shadows.xs,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.dayName, { color: colors.content.body }]}>
          {dayName}
        </Text>
        <Text style={[styles.monthDay, { color: colors.content.subtitle }]}>
          {monthDay}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.summary, { color: colors.content.icon }]}>
          {summary}
        </Text>
        <Ionicons
          name="chevron-down"
          size={iconSize.sm}
          color={colors.content.subtitle}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
  monthDay: {
    fontSize: fontSize.md,
  },
  summary: {
    fontSize: fontSize.sm,
  },
});
