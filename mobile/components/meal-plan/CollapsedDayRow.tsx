import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  fontSize,
  fontWeight,
  iconSize,
  spacing,
  terminal,
  useTheme,
} from '@/lib/theme';
import { toBcp47 } from '@/lib/utils/dateFormatter';

// ── Box-drawing characters ──────────────────────────────────────────────
const B = {
  h: '\u2550', // ═
  labelL: '\u2561', // ╡
  labelR: '\u255E', // ╞
} as const;

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
  const { colors, fonts, borderRadius, shadows, crt } = useTheme();
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

  if (crt) {
    const charStyle = {
      color: colors.border,
      fontFamily: fonts.body,
      fontSize: fontSize.md,
      lineHeight: terminal.charHeight,
    };

    const labelStyle = {
      color: colors.primary,
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.base,
      letterSpacing: 1,
      paddingHorizontal: spacing.xs,
    };

    return (
      <Pressable
        onPress={onExpand}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: spacing.xs,
        }}
      >
        {/* ═══ leading line */}
        <View
          style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(200)}
          </Text>
        </View>

        {/* ╡ dag · datum ╞ */}
        <Text style={charStyle} selectable={false}>
          {B.labelL}
        </Text>
        <Text style={labelStyle} selectable={false}>
          {dayName} {'\u00B7'} {monthDay}
        </Text>
        <Text style={charStyle} selectable={false}>
          {B.labelR}
        </Text>

        {/* ═══ */}
        <View
          style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(200)}
          </Text>
        </View>

        {/* ╡ summary ╞ */}
        <Text style={charStyle} selectable={false}>
          {B.labelL}
        </Text>
        <Text style={labelStyle} selectable={false}>
          {summary}
        </Text>
        <Text style={charStyle} selectable={false}>
          {B.labelR}
        </Text>

        {/* ═══ middle line */}
        <View
          style={{
            width: spacing.sm,
            overflow: 'hidden',
            height: terminal.charHeight,
          }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(10)}
          </Text>
        </View>

        {/* ╡ ▼ ╞ */}
        <Text style={charStyle} selectable={false}>
          {B.labelL}
        </Text>
        <Text style={labelStyle} selectable={false}>
          {'\u25BC'}
        </Text>
        <Text style={charStyle} selectable={false}>
          {B.labelR}
        </Text>

        {/* ═══ trailing line */}
        <View
          style={{
            width: spacing.sm,
            overflow: 'hidden',
            height: terminal.charHeight,
          }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(10)}
          </Text>
        </View>
      </Pressable>
    );
  }

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
        <Text
          style={[
            styles.dayName,
            { color: colors.content.body, fontFamily: fonts.bodySemibold },
          ]}
        >
          {dayName}
        </Text>
        <Text
          style={[
            styles.monthDay,
            { color: colors.content.subtitle, fontFamily: fonts.body },
          ]}
        >
          {monthDay}
        </Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.summary,
            { color: colors.content.icon, fontFamily: fonts.body },
          ]}
        >
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
    marginVertical: spacing.xs,
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
