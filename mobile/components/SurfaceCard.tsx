/**
 * Glass-backed card container used throughout settings, review, and info screens.
 *
 * Consolidates the repeated pattern of glass.card background + borderRadius.md +
 * shadows.sm into a single component. Accepts a padding override and optional
 * extra styles for layout-specific needs (marginBottom, overflow, opacity, etc.).
 */

import type React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { borderRadius, shadows, spacing, useTheme } from '@/lib/theme';

interface SurfaceCardProps {
  children: React.ReactNode;
  /** Padding inside the card. Defaults to `spacing.lg` (16). */
  padding?: number;
  /** Additional styles merged after the base card styles. */
  style?: ViewStyle;
}

export const SurfaceCard = ({
  children,
  padding = spacing.lg,
  style,
}: SurfaceCardProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
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
