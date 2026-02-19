/**
 * Theme-aware content container.
 *
 * - **Light mode**: renders a card with white background, rounded corners,
 *   and a subtle shadow. Override the defaults via `cardStyle`.
 * - **CRT mode**: renders inside a `TerminalFrame` with box-drawing borders
 *   and optional labels/segments.
 *
 * Consumers use this component unconditionally — no `crt` check required.
 */

import type React from 'react';
import { View, type ViewStyle } from 'react-native';
import { spacing, useTheme } from '@/lib/theme';
import type { FrameSegment } from './TerminalFrame';
import { TerminalFrame } from './TerminalFrame';

interface ContentCardProps {
  children: React.ReactNode;
  /** CRT: TerminalFrame border label (top-left). */
  label?: string;
  /** CRT: pressable segments in the top border (right). */
  rightSegments?: FrameSegment[];
  /** CRT: box-drawing variant. Default: 'single'. */
  frameVariant?: 'single' | 'double';
  /** CRT: inner padding inside the frame. Default: spacing.md. */
  framePadding?: number;
  /** Light: override the default card styling (merged on top of defaults). */
  cardStyle?: ViewStyle;
  /** When false, light mode renders a bare View (no card bg/shadow). Default: true. */
  card?: boolean;
  /** Outer wrapper style applied in both modes. */
  style?: ViewStyle;
}

export const ContentCard = ({
  children,
  label,
  rightSegments,
  frameVariant = 'single',
  framePadding,
  cardStyle,
  card = true,
  style,
}: ContentCardProps) => {
  const { colors, borderRadius, shadows, crt } = useTheme();

  if (crt) {
    return (
      <TerminalFrame
        label={label}
        rightSegments={rightSegments}
        variant={frameVariant}
        padding={framePadding}
        style={style}
      >
        {children}
      </TerminalFrame>
    );
  }

  if (!card) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          ...shadows.sm,
        },
        cardStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};
