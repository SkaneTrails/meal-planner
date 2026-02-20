/**
 * Fixed screen header bar with semi-transparent background and side fade.
 * The bottom edge is a sharp solid line; the left and right sides
 * fade into the page background. Top is untouched.
 *
 * Excluded from: Home and Recipe detail (they manage their own headers).
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

interface ScreenHeaderBarProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const ScreenHeaderBar = ({ children, style }: ScreenHeaderBarProps) => {
  const { colors } = useTheme();
  const fadeWidth = colors.header.fadeWidth;

  return (
    <View style={{ position: 'relative', zIndex: 1 }}>
      <View
        style={[
          {
            backgroundColor: colors.header.bg,
            boxShadow: colors.header.shadow,
          },
          style,
        ]}
      >
        {children}
      </View>

      {/* Left side fade */}
      <LinearGradient
        colors={[colors.header.fadeEnd, colors.header.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -fadeWidth,
          width: fadeWidth,
        }}
      />

      {/* Right side fade */}
      <LinearGradient
        colors={[colors.header.bg, colors.header.fadeEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: -fadeWidth,
          width: fadeWidth,
        }}
      />
    </View>
  );
};
