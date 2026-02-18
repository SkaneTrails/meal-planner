/**
 * Button — shared visual button component with theme-driven rendering.
 *
 * Light theme: AnimatedPressable with icon, label, or both.
 * Terminal theme: box-drawing segment `╡ LABEL ╞`.
 *
 * Components provide both `icon` and `label`; the theme's `buttonDisplay`
 * config decides what to show. No `crt` checks in consumer code.
 */

import type { Ionicons as IoniconsType } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useButtonGroup } from '@/components/ButtonGroup';
import { fontSize, spacing, terminal, useTheme } from '@/lib/theme';

type IconName = ComponentProps<typeof IoniconsType>['name'];

// ── Box-drawing chars for terminal segments ────────────────────────────
const SEG = { l: '\u2561', r: '\u255E' } as const; // ╡ ╞

/** Strip icon suffixes for a cleaner terminal fallback label. */
const cleanIconName = (name: string): string =>
  name.replace(/-(outline|sharp|circle)$/i, '');

// ── Types ──────────────────────────────────────────────────────────────

type ButtonVariant = 'text' | 'icon' | 'primary';
type ButtonTone = 'default' | 'destructive' | 'ai' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  /** Visual variant — determines layout and sizing. */
  variant?: ButtonVariant;
  /** Color tone — overrides default palette. */
  tone?: ButtonTone;
  /** Button size — controls padding and font size. */
  size?: ButtonSize;
  /** Button label text (used by text/primary, and as segment label in terminal). */
  label?: string;
  /** Ionicons icon name. */
  icon?: IconName;
  /** Press handler. */
  onPress: () => void;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Show loading state (primary variant only). */
  isPending?: boolean;
  /** Label to show during loading. */
  loadingLabel?: string;
  /** Background color override. */
  color?: string;
  /** Text/icon color override. */
  textColor?: string;
  /** Custom icon size override. */
  iconSize?: number;
  /** Animation scale when pressed (default: varies by variant). */
  pressScale?: number;
  /** Animation scale when hovered (default: varies by variant). */
  hoverScale?: number;
  /** Disable hover/press animation. */
  disableAnimation?: boolean;
  /**
   * Render as a terminal segment (`╡ LABEL ╞`) in CRT mode.
   * Defaults to `true` for text/primary, `false` for icon.
   * Override per-button to opt icon buttons into segments or keep text buttons as-is.
   */
  segment?: boolean;
  /** Additional outer style (flex, margin, etc.). */
  style?: ViewStyle;
  /** Test ID for testing. */
  testID?: string;
}

// ── Size presets ───────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { padding: spacing.sm, iconPx: 14, fontSize: fontSize.sm },
  md: { padding: spacing.md, iconPx: 18, fontSize: fontSize.md },
  lg: { padding: spacing.lg, iconPx: 20, fontSize: fontSize.lg },
} as const;

// ── Component ──────────────────────────────────────────────────────────

export const Button = ({
  variant = 'text',
  tone = 'default',
  size = 'md',
  label,
  icon,
  onPress,
  disabled = false,
  isPending = false,
  loadingLabel,
  color: colorProp,
  textColor: textColorProp,
  iconSize: iconSizeProp,
  pressScale: pressScaleProp,
  hoverScale: hoverScaleProp,
  disableAnimation,
  segment: segmentProp,
  style,
  testID,
}: ButtonProps) => {
  const { colors, fonts, borderRadius, shadows, buttonDisplay } = useTheme();
  const inGroup = useButtonGroup();
  const isDisabled = disabled || isPending;
  const sizeConfig = SIZE_CONFIG[size];
  const useSegment = segmentProp ?? variant !== 'icon';

  // ── Resolve colors per tone ────────────────────────────────────────
  const resolveColors = (): { bg: string; fg: string; pressedBg?: string } => {
    if (colorProp || textColorProp) {
      return {
        bg: colorProp ?? 'transparent',
        fg: textColorProp ?? colors.content.body,
      };
    }
    switch (tone) {
      case 'destructive':
        return variant === 'primary'
          ? { bg: colors.danger, fg: colors.white }
          : { bg: colors.destructive.bg, fg: colors.destructive.text };
      case 'ai':
        return { bg: colors.ai.bg, fg: colors.ai.primary };
      case 'subtle':
        return { bg: colors.surface.hover, fg: colors.content.icon };
      default:
        switch (variant) {
          case 'primary':
            return {
              bg: colors.button.primary,
              fg: colors.white,
              pressedBg: colors.button.primaryPressed,
            };
          case 'icon':
            return { bg: colors.glass.solid, fg: colors.text.inverse };
          default:
            return { bg: 'transparent', fg: colors.content.body };
        }
    }
  };

  const { bg, fg, pressedBg } = resolveColors();
  const disabledBg = variant === 'primary' ? colors.button.disabled : undefined;
  const activeBg = isDisabled && disabledBg ? disabledBg : bg;
  const activeFg = isDisabled ? colors.content.placeholder : fg;
  const resolvedIconSize = iconSizeProp ?? sizeConfig.iconPx;

  // ── Display label ─────────────────────────────────────────────────
  const displayLabel = isPending && loadingLabel ? loadingLabel : label;
  const displayIcon: IconName | undefined = isPending
    ? icon
      ? 'hourglass-outline'
      : undefined
    : icon;

  // ── Terminal segment rendering ────────────────────────────────────
  if (buttonDisplay.wrapper === 'segment' && useSegment) {
    const segLabel =
      displayLabel ?? (displayIcon ? cleanIconName(displayIcon) : '?');
    // Strip dimension styles meant for light-theme icon circles
    const {
      width: _w,
      height: _h,
      minWidth: _mw,
      minHeight: _mh,
      borderRadius: _br,
      ...segmentStyle
    } = (style ?? {}) as ViewStyle;
    // When inside a ButtonGroup the group provides outer ╡ ╞ and | separators
    const text = inGroup
      ? ` ${segLabel.toUpperCase()} `
      : `${SEG.l} ${segLabel.toUpperCase()} ${SEG.r}`;
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        testID={testID}
        style={[{ opacity: isDisabled ? 0.4 : 1 }, segmentStyle]}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: sizeConfig.fontSize,
            color: activeFg,
            lineHeight: terminal.charHeight,
          }}
        >
          {text}
        </Text>
      </Pressable>
    );
  }

  // ── Light theme: animated pressable ───────────────────────────────

  // Interaction-dependent hover/press colors for highlight mode
  const hoverBg = colors.surface.hover;
  const pressedBgResolved = pressedBg ?? colors.surface.pressed;
  const useHighlight = buttonDisplay.interaction === 'highlight';

  const defaultPressScale =
    variant === 'primary' ? 0.97 : variant === 'icon' ? 0.9 : 0.98;
  const defaultHoverScale =
    variant === 'primary' ? 1.02 : variant === 'icon' ? 1.1 : 1.02;
  const resolvedPressScale = useHighlight
    ? 1
    : (pressScaleProp ?? defaultPressScale);
  const resolvedHoverScale = useHighlight
    ? 1
    : (hoverScaleProp ?? defaultHoverScale);

  // Variant-specific styling
  const variantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.md,
          ...shadows.md,
        };
      case 'icon':
        return {
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius:
            buttonDisplay.shape === 'circle'
              ? borderRadius.full
              : borderRadius['sm-md'],
        };
      default:
        return {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizeConfig.padding,
          paddingVertical: Math.max(sizeConfig.padding - 4, 4),
          borderRadius: borderRadius.md,
          gap: spacing.xs,
        };
    }
  };

  const labelStyle: TextStyle = {
    fontSize: variant === 'primary' ? fontSize.lg : sizeConfig.fontSize,
    fontFamily: variant === 'primary' ? fonts.bodySemibold : fonts.body,
    color: activeFg,
  };

  // Decide what to render based on buttonDisplay.display.
  // Icon-variant buttons that skipped the segment path always show their icon.
  const showIcon =
    displayIcon &&
    (variant === 'icon' ||
      buttonDisplay.display === 'icon' ||
      buttonDisplay.display === 'both');
  const showLabel =
    displayLabel &&
    (buttonDisplay.display === 'text' ||
      buttonDisplay.display === 'both' ||
      variant === 'primary') &&
    variant !== 'icon';

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      pressScale={resolvedPressScale}
      hoverScale={resolvedHoverScale}
      disableAnimation={useHighlight || (disableAnimation ?? isDisabled)}
      testID={testID}
      style={({ pressed, hovered }) => [
        variantStyle(),
        {
          backgroundColor: useHighlight
            ? pressed
              ? pressedBgResolved
              : hovered
                ? hoverBg
                : activeBg
            : pressed && pressedBg
              ? pressedBg
              : activeBg,
          opacity: useHighlight
            ? isDisabled
              ? 0.5
              : 1
            : pressed && !pressedBg
              ? 0.9
              : isDisabled
                ? 0.5
                : 1,
        },
        style,
      ]}
    >
      {isPending && !displayIcon ? (
        <ActivityIndicator
          size="small"
          color={activeFg}
          style={styles.iconGap}
        />
      ) : showIcon ? (
        <Ionicons
          name={displayIcon as ComponentProps<typeof Ionicons>['name']}
          size={resolvedIconSize}
          color={activeFg}
          style={showLabel ? styles.iconGap : undefined}
        />
      ) : null}
      {showLabel && <Text style={labelStyle}>{displayLabel}</Text>}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  iconGap: {
    marginRight: spacing.xs,
  },
});

export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize };
