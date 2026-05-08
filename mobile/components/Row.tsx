/**
 * Row — universal list-item primitive.
 *
 * Phase 4 of the design refresh. Replaces the hand-rolled
 * `flexDirection: 'row' + padding + bg + leading icon` patterns scattered
 * across grocery rows, recipe compact cards, settings rows, and household
 * member lists.
 *
 * Default look is **flat with a hairline bottom divider** — modern editorial
 * lists instead of stacked card-per-row. Themes plug in by reading
 * `colors.surface.divider` and the active typography tokens.
 *
 * Variants:
 *   - `divider` (default) — hairline bottom border, no background.
 *   - `bare`             — no border, no background.
 *   - `card`             — subtle surface bg + radius (use sparingly).
 */

import type { ReactNode } from 'react';
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { ThemeIcon } from './ThemeIcon';

export interface RowProps {
  /** Primary text (single line by default). */
  title: string;
  /** Optional secondary line below the title. */
  subtitle?: string;
  /** Slot rendered to the left of title (icon, avatar, image). */
  leading?: ReactNode;
  /** Slot rendered at the trailing edge (chevron, switch, badge). */
  trailing?: ReactNode;
  /** Press handler. When set, a chevron is shown automatically unless `trailing` is provided. */
  onPress?: () => void;
  /** Visual style. Default `'divider'`. */
  variant?: 'divider' | 'bare' | 'card';
  /** Hide the bottom hairline (e.g. for the last item in a section). */
  isLast?: boolean;
  /** Override min row height. Default 56 — tap-target friendly. */
  minHeight?: number;
  /** Additional style applied to the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Disabled state — dims content and disables press. */
  disabled?: boolean;
  /** A11y label override (defaults to `title`). */
  accessibilityLabel?: string;
}

export const Row = ({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  variant = 'divider',
  isLast = false,
  minHeight = 56,
  style,
  disabled = false,
  accessibilityLabel,
}: RowProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight,
    paddingVertical: spacing.sm,
    paddingHorizontal: variant === 'card' ? spacing.md : 0,
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'card' && {
      backgroundColor: colors.surface.subtle,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
    }),
    ...(variant === 'divider' &&
      !isLast && {
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.divider,
      }),
  };

  const showAutoChevron = !!onPress && !trailing;

  const content = (
    <>
      {leading && <View style={{ marginRight: spacing.md }}>{leading}</View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: fontSize.lg,
            color: colors.content.heading,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.body,
              fontSize: fontSize.sm,
              color: colors.content.subtitle,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && <View style={{ marginLeft: spacing.md }}>{trailing}</View>}
      {showAutoChevron && (
        <ThemeIcon
          name="chevron-forward"
          size={18}
          color={colors.content.icon}
          style={{ marginLeft: spacing.sm }}
        />
      )}
    </>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={({ pressed }) => [
          containerStyle,
          pressed && { backgroundColor: colors.surface.pressed },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
};
