/**
 * Glass-backed card container used throughout settings, review, and info screens.
 *
 * Consolidates the repeated pattern of glass.card background + borderRadius +
 * shadows.sm into a single component. Accepts padding, borderRadius, and optional
 * extra styles for layout-specific needs (marginBottom, overflow, opacity, etc.).
 */

import type React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { spacing, useTheme } from '@/lib/theme';

interface SurfaceCardProps {
  children: React.ReactNode;
  /** Padding inside the card. Defaults to `spacing.lg` (16). */
  padding?: number;
  /** Border radius key from the theme. Defaults to `"md"`. */
  radius?: 'sm' | 'md' | 'lg';
  /** Additional styles merged after the base card styles. */
  style?: ViewStyle;
}

export const SurfaceCard = ({
  children,
  padding = spacing.lg,
  radius = 'md',
  style,
}: SurfaceCardProps) => {
  const { colors, borderRadius, shadows } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius[radius],
          padding,
          ...shadows.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
