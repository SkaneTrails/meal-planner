import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { dotSize, fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

type ChipVariant = 'filled' | 'outline' | 'toggle' | 'display';
type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  /** Visual variant:
   * - `filled` — solid bg, press-to-remove (errorBg flash), optional trailing close icon
   * - `outline` — dashed border, press-to-add (successBg flash), optional leading add icon
   * - `toggle` — solid border, active/inactive states with optional dot
   * - `display` — read-only tint bg with optional dot
   */
  variant?: ChipVariant;
  /** Colored dot (index into colors.tagDot, or explicit hex). Omit for no dot. */
  dot?: string;
  /** Whether the chip is in its active state (only meaningful for `toggle` variant). */
  active?: boolean;
  /** Show a trailing remove icon (`close-circle`). Default: true for `filled`. */
  showRemove?: boolean;
  /** Show a leading add icon (`add`). Default: true for `outline`. */
  showAdd?: boolean;
  /** Capitalize the label text (used for pantry items). */
  capitalize?: boolean;
  /** Custom background color override. */
  bg?: string;
  /** Custom text/icon color override. */
  color?: string;
  /** Leading Ionicons icon name (e.g., `"lock-closed-outline"`). */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Text prefix prepended to label (e.g., `"#"` for hashtags). */
  prefix?: string;
  /** Apply uppercase text transform (e.g., role badges). */
  uppercase?: boolean;
  /** Size: `"sm"` for compact badges, `"md"` (default) for standard chips. */
  size?: ChipSize;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

/**
 * Universal chip/tag pill used across settings and meal-plan screens.
 *
 * Consolidates 8 bespoke implementations into a single component with
 * four visual variants. All styling comes from theme tokens.
 */
export const Chip = ({
  label,
  variant = 'filled',
  dot,
  active = false,
  showRemove,
  showAdd,
  capitalize = false,
  bg,
  color: colorOverride,
  icon,
  prefix,
  uppercase = false,
  size = 'md',
  disabled = false,
  onPress,
  testID,
}: ChipProps) => {
  const { colors, borderRadius, overrides, visibility } = useTheme();

  const resolvedShowRemove = showRemove ?? variant === 'filled';
  const resolvedShowAdd = showAdd ?? variant === 'outline';
  const isSmall = size === 'sm';
  const resolvedColor = colorOverride ?? labelColor(variant, active, colors);
  const iconSize = isSmall ? 12 : 14;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      testID={testID}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: variant === 'toggle' ? overrides.chipToggleGap : spacing.xs,
        paddingHorizontal: isSmall
          ? spacing.sm
          : variant === 'toggle'
            ? spacing.md
            : spacing.sm,
        paddingVertical: isSmall
          ? 2
          : variant === 'toggle'
            ? spacing.sm
            : spacing.xs,
        borderRadius:
          variant === 'display' ? borderRadius.md : borderRadius.full,
        ...variantStyle(variant, active, pressed && !disabled, colors, bg),
      })}
    >
      {/* Leading add icon (outline variant) */}
      {resolvedShowAdd && variant === 'outline' && (
        <Ionicons name="add" size={iconSize} color={colors.content.strong} />
      )}

      {/* Leading icon (custom) */}
      {icon && <Ionicons name={icon} size={iconSize} color={resolvedColor} />}

      {/* Colored dot */}
      {dot && (variant !== 'toggle' || visibility.showChipToggleDot) && (
        <View
          style={{
            width: dotSize.md,
            height: dotSize.md,
            borderRadius: dotSize.md / 2,
            backgroundColor: dot,
          }}
        />
      )}

      {/* Label */}
      <Text
        style={{
          fontSize: chipFontSize(variant, isSmall),
          fontWeight: isSmall ? fontWeight.medium : undefined,
          color: resolvedColor,
          ...(capitalize && { textTransform: 'capitalize' as const }),
          ...(uppercase && { textTransform: 'uppercase' as const }),
        }}
      >
        {prefix ? `${prefix}${label}` : label}
      </Text>

      {/* Trailing remove icon (filled variant) */}
      {resolvedShowRemove && variant === 'filled' && !disabled && (
        <Ionicons
          name="close-circle"
          size={iconSize}
          color={colors.content.subtitle}
        />
      )}
    </Pressable>
  );
};

type Colors = ReturnType<typeof useTheme>['colors'];

const chipFontSize = (variant: ChipVariant, small: boolean) => {
  if (small) return fontSize.xs;
  switch (variant) {
    case 'toggle':
      return fontSize.md;
    case 'display':
      return fontSize.base;
    default:
      return fontSize.sm;
  }
};

const variantStyle = (
  variant: ChipVariant,
  active: boolean,
  pressed: boolean,
  colors: Colors,
  bg?: string,
) => {
  if (bg) {
    // Custom bg overrides variant background but preserves variant border
    const base = bg ? { backgroundColor: bg } : {};
    switch (variant) {
      case 'filled':
      case 'display':
        return { ...base, borderWidth: 1, borderColor: colors.chip.border };
      case 'outline':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.surface.borderLight,
          borderStyle: 'dashed' as const,
        };
      case 'toggle':
        return {
          ...base,
          borderWidth: 1,
          borderColor: active
            ? colors.chip.toggleActiveBorder
            : colors.surface.divider,
        };
      default:
        return base;
    }
  }
  switch (variant) {
    case 'filled':
      return {
        backgroundColor: pressed ? colors.errorBg : colors.bgDark,
        borderWidth: 1,
        borderColor: colors.chip.border,
      };
    case 'outline':
      return {
        backgroundColor: pressed ? colors.successBg : 'transparent',
        borderWidth: 1,
        borderColor: colors.surface.borderLight,
        borderStyle: 'dashed' as const,
      };
    case 'toggle':
      return {
        borderWidth: 1,
        backgroundColor: active
          ? colors.chip.toggleActiveBg
          : colors.chip.toggleInactiveBg,
        borderColor: active
          ? colors.chip.toggleActiveBorder
          : colors.surface.divider,
      };
    case 'display':
      return {
        backgroundColor: colors.surface.tint,
        borderWidth: 1,
        borderColor: colors.chip.border,
      };
  }
};

const labelColor = (variant: ChipVariant, active: boolean, colors: Colors) => {
  switch (variant) {
    case 'filled':
      return colors.content.body;
    case 'outline':
      return colors.content.strong;
    case 'toggle':
      return active
        ? colors.chip.toggleActiveText
        : colors.chip.toggleInactiveText;
    case 'display':
      return colors.content.secondary;
  }
};
