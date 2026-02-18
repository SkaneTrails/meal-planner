/**
 * PrimaryButton - Full-width CTA button with icon, label, and loading state.
 *
 * Wraps AnimatedPressable for consistent scale animation across all
 * primary action buttons (add recipe, create list, import, save, etc.).
 */

import type { Ionicons as IoniconsType } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { fontSize, spacing, useTheme } from '@/lib/theme';

type IconName = ComponentProps<typeof IoniconsType>['name'];

interface PrimaryButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Ionicons icon name (rendered left of label) */
  icon?: IconName;
  /** Show loading state — disables button and swaps icon to hourglass */
  isPending?: boolean;
  /** Label to show during loading (defaults to main label) */
  loadingLabel?: string;
  /** Whether the button is disabled (independent of isPending) */
  disabled?: boolean;
  /** Background color override (default: colors.button.primary) */
  color?: string;
  /** Pressed background color override (default: darken via opacity) */
  pressedColor?: string;
  /** Background color when disabled (default: colors.button.disabled) */
  disabledColor?: string;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  isPending = false,
  loadingLabel,
  disabled = false,
  color: colorProp,
  pressedColor,
  disabledColor: disabledColorProp,
}: PrimaryButtonProps) {
  const { colors, fonts, borderRadius, shadows } = useTheme();
  const color = colorProp ?? colors.button.primary;
  const disabledColor = disabledColorProp ?? colors.button.disabled;
  const isDisabled = disabled || isPending;
  const activeColor = isDisabled ? disabledColor : color;
  const displayIcon: IconName | undefined = isPending
    ? icon
      ? 'hourglass-outline'
      : undefined
    : icon;
  const displayLabel = isPending && loadingLabel ? loadingLabel : label;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      pressScale={0.97}
      hoverScale={1.02}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed && pressedColor ? pressedColor : activeColor,
          borderRadius: borderRadius.md,
          ...shadows.md,
          opacity: pressed && !pressedColor ? 0.9 : 1,
        },
      ]}
    >
      {isPending && !displayIcon ? (
        <ActivityIndicator
          size="small"
          color={colors.white}
          style={styles.spinner}
        />
      ) : displayIcon ? (
        <Ionicons
          name={displayIcon}
          size={20}
          color={colors.white}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: colors.white, fontFamily: fonts.bodySemibold },
        ]}
      >
        {displayLabel}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    marginRight: spacing.sm,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  label: {
    fontSize: fontSize.lg,
  },
});
