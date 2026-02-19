/**
 * Theme-aware content container.
 *
 * - **Full chrome** (light/pastel): renders a card with background, rounded
 *   corners, and a subtle shadow. Override the defaults via `cardStyle`.
 * - **Flat chrome** (terminal): renders inside a `TerminalFrame` with
 *   box-drawing borders and optional labels/segments.
 *
 * Consumers use this component unconditionally — no theme check required.
 */

import type React from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { spacing, useTheme } from '@/lib/theme';
import type { FrameSegment } from './TerminalFrame';
import { TerminalFrame } from './TerminalFrame';

interface ContentCardProps {
  children: React.ReactNode;
  /** Flat chrome: TerminalFrame border label (top-left). */
  label?: string;
  /** Flat chrome: pressable segments in the top border (right). */
  rightSegments?: FrameSegment[];
  /** Flat chrome: box-drawing variant. Default: 'single'. */
  frameVariant?: 'single' | 'double';
  /** Flat chrome: inner padding inside the frame. Default: spacing.md. */
  framePadding?: number;
  /** Full chrome: override the default card styling (merged on top of defaults). */
  cardStyle?: StyleProp<ViewStyle>;
  /** When false, light mode renders a bare View (no card bg/shadow). Default: true. */
  card?: boolean;
  /** Outer wrapper style applied in both modes. */
  style?: StyleProp<ViewStyle>;
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
  const { colors, borderRadius, shadows, chrome } = useTheme();

  if (chrome === 'flat') {
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
          backgroundColor: colors.card.bg,
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
