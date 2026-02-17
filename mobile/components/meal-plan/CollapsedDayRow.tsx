import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  iconSize,
  shadows,
  spacing,
} from '@/lib/theme';
import { formatDayHeader, toBcp47 } from '@/lib/utils/dateFormatter';

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
    <Pressable onPress={onExpand} style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.monthDay}>{monthDay}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.summary}>{summary}</Text>
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
    backgroundColor: colors.glass.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.xs,
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
    color: colors.content.body,
    textTransform: 'capitalize',
  },
  monthDay: {
    fontSize: fontSize.md,
    color: colors.content.subtitle,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.content.tertiary,
  },
});
