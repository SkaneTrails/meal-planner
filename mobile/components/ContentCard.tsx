/**
 * Theme-aware content container.
 *
 * - **Full chrome** (light/pastel): renders a card with background, rounded
 *   corners, border, and shadow — all from theme tokens. Use `highlighted`
 *   for accent-border variants (e.g. today's meal-plan card).
 * - **Flat chrome** (terminal): renders inside a `TerminalFrame` with
 *   box-drawing borders and optional labels/segments.
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
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { FrameSegment } from './TerminalFrame';
import { TerminalFrame } from './TerminalFrame';

interface ContentCardProps {
  children: React.ReactNode;
  /** TerminalFrame label (flat chrome) / collapsed row title (full chrome). */
  label?: string;
  /** Pressable segments: TerminalFrame border (flat) / collapsed row actions (full). */
  rightSegments?: FrameSegment[];
  /** Flat chrome: box-drawing variant. Default: 'single'. */
  frameVariant?: 'single' | 'double';
  /** Flat chrome: inner padding inside the frame. Default: spacing.md. */
  framePadding?: number;
  /** Collapse to a compact header-only row (both chrome modes). */
  collapsed?: boolean;
  /** Full chrome: override the default card styling (merged on top of defaults). */
  cardStyle?: StyleProp<ViewStyle>;
  /** When false, light mode renders a bare View (no card bg/shadow). Default: true. */
  card?: boolean;
  /** Accent border + highlighted background (e.g. today's card). */
  highlighted?: boolean;
  /** Layout event forwarded to the outer View. */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Outer wrapper style applied in both modes. */
  style?: StyleProp<ViewStyle>;
}

export const ContentCard = ({
  children,
  label,
  rightSegments,
  frameVariant = 'single',
  framePadding,
  collapsed,
  cardStyle,
  card = true,
  highlighted = false,
  onLayout,
  style,
}: ContentCardProps) => {
  const { colors, fonts, borderRadius, shadows, overrides, chrome } =
    useTheme();

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
      </Pressable>
    );
  }

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
          padding: spacing.md,
          ...shadows.card,
        },
        cardStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};
