/**
 * Theme-aware content container.
 *
 * Two variants:
 *
 * ### `variant="card"` (default)
 * - **Full chrome** (light/pastel): card with background, rounded corners,
 *   border, and shadow — all from theme tokens. Use `highlighted` for
 *   accent-border variants (e.g. today's meal-plan card).
 * - **Flat chrome** (terminal): renders inside a `TerminalFrame` with
 *   box-drawing borders and optional labels/segments.
 *
 * ### `variant="surface"`
 * Inner grouping container — must always live inside a card-variant ContentCard.
 * - **Full chrome**: `surface.subtle` background, theme `borderRadius`, no
 *   border or shadow.
 * - **Flat chrome**: plain `View` (no TerminalFrame).
 * - Ignores `collapsed`, `label`, `rightSegments`, `highlighted`.
 *
 * Consumers use this component unconditionally — no theme check required.
 */

import type React from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fontSize, iconSize, spacing, useTheme } from '@/lib/theme';
import type { FrameSegment } from './TerminalFrame';
import { TerminalFrame } from './TerminalFrame';
import { ThemeIcon } from './ThemeIcon';

interface ContentCardProps {
  children: React.ReactNode;
  /**
   * Visual variant:
   * - `"card"` (default) — top-level card with bg, border, shadow, TerminalFrame.
   * - `"surface"` — inner grouping: subtle bg, no border/shadow, plain View in flat.
   */
  variant?: 'card' | 'surface';
  /** TerminalFrame label (flat chrome) / collapsed row title (full chrome). Card only. */
  label?: string;
  /** Pressable segments: TerminalFrame border (flat) / collapsed row actions (full). Card only. */
  rightSegments?: FrameSegment[];
  /** Flat chrome: box-drawing variant. Default: 'single'. Card only. */
  frameVariant?: 'single' | 'double';
  /** Flat chrome: inner padding inside the frame. Default: spacing.md. Card only. */
  framePadding?: number;
  /** Collapse to a compact header-only row (both chrome modes). Card only. */
  collapsed?: boolean;
  /** Full chrome: override the default card styling (merged on top of defaults). */
  cardStyle?: StyleProp<ViewStyle>;
  /** When false, light mode renders a bare View (no card bg/shadow). Default: true. Card only. */
  card?: boolean;
  /** Accent border + highlighted background (e.g. today's card). Card only. */
  highlighted?: boolean;
  /** Override padding. Default: `spacing.md` for card, `spacing.md` for surface. */
  padding?: number;
  /** Layout event forwarded to the outer View. */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Outer wrapper style applied in both modes. */
  style?: StyleProp<ViewStyle>;
}

export const ContentCard = ({
  children,
  variant = 'card',
  label,
  rightSegments,
  frameVariant = 'single',
  framePadding,
  collapsed,
  cardStyle,
  card = true,
  highlighted = false,
  padding,
  onLayout,
  style,
}: ContentCardProps) => {
  const { colors, fonts, borderRadius, shadows, overrides, chrome } =
    useTheme();

  /* ── Surface variant ───────────────────────────────────────── */
  if (variant === 'surface') {
    if (chrome === 'flat') {
      return (
        <View style={style} onLayout={onLayout}>
          {children}
        </View>
      );
    }

    return (
      <View
        onLayout={onLayout}
        style={[
          {
            backgroundColor: colors.surface.subtle,
            borderRadius: borderRadius.md,
            padding: padding ?? spacing.md,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  /* ── Card variant ──────────────────────────────────────────── */
  if (chrome === 'flat') {
    return (
      <TerminalFrame
        label={label}
        rightSegments={rightSegments}
        variant={frameVariant}
        padding={framePadding}
        collapsed={collapsed}
        style={style}
      >
        {children}
      </TerminalFrame>
    );
  }

  if (!card) {
    return (
      <View style={style} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  /* ── Full-chrome collapsed summary row ─────────────────────── */
  if (collapsed) {
    const expandSegment = rightSegments?.find((s) => s.onPress);
    const summarySegment = rightSegments?.find((s) => !s.onPress);

    return (
      <Pressable
        onPress={expandSegment?.onPress}
        onLayout={onLayout}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.card.bg,
            borderRadius: borderRadius.md,
            borderWidth: overrides.cardBorderWidth,
            borderColor: colors.card.borderColor,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            ...shadows.card,
          },
          cardStyle,
          style,
        ]}
      >
        {label && (
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: fontSize.sm,
              color: colors.content.heading,
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          {summarySegment && (
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
                color: colors.content.subtitle,
              }}
            >
              {summarySegment.label}
            </Text>
          )}
          <ThemeIcon
            name={expandSegment?.icon ?? 'chevron-down'}
            size={iconSize.sm}
            color={colors.content.subtitle}
          />
        </View>
      </Pressable>
    );
  }

  const hasHeader = !!label || (rightSegments && rightSegments.length > 0);

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          backgroundColor: highlighted
            ? colors.dayCard.bgToday
            : colors.card.bg,
          borderRadius: borderRadius.md,
          borderWidth: highlighted
            ? overrides.cardHighlightBorderWidth
            : overrides.cardBorderWidth,
          borderColor: highlighted
            ? colors.ai.primary
            : colors.card.borderColor,
          padding: padding ?? spacing.md,
          ...shadows.card,
        },
        cardStyle,
        style,
      ]}
    >
      {hasHeader && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
          }}
        >
          {label && (
            <Text
              style={{
                fontFamily: fonts.bodySemibold,
                fontSize: fontSize.sm,
                color: colors.content.heading,
              }}
            >
              {label}
            </Text>
          )}
          {rightSegments && rightSegments.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              {rightSegments.map((seg, idx) => {
                const key = seg.icon ?? seg.label ?? String(idx);
                const segStyle = {
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  gap: spacing.xs,
                };
                const icon = seg.icon ? (
                  <ThemeIcon
                    key={`${key}-icon`}
                    name={seg.icon}
                    size={iconSize.sm}
                    color={colors.content.subtitle}
                  />
                ) : null;
                const text = seg.label ? (
                  <Text
                    key={`${key}-text`}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.sm,
                      color: colors.content.subtitle,
                    }}
                  >
                    {seg.label}
                  </Text>
                ) : null;
                return seg.onPress ? (
                  <Pressable key={key} onPress={seg.onPress} style={segStyle}>
                    {icon}
                    {text}
                  </Pressable>
                ) : (
                  <View key={key} style={segStyle}>
                    {icon}
                    {text}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
      {children}
    </View>
  );
};
