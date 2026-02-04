/**
 * Luxurious gradient background component.
 * Soft cream to warm peach gradient for premium feel.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
  variant?: 'default' | 'warm' | 'soft';
}

// Gradient color presets
const gradients = {
  // Default: soft cream flowing down
  default: {
    colors: ['#FEFDFB', '#FAF7F2', '#F5F0E8'] as const,
    locations: [0, 0.5, 1] as const,
  },
  // Warm: subtle peach accent
  warm: {
    colors: ['#FFF8F0', '#FAF7F2', '#FEFDFB'] as const,
    locations: [0, 0.4, 1] as const,
  },
  // Soft: very subtle, almost white
  soft: {
    colors: ['#FEFDFB', '#FEFDFB', '#FAF7F2'] as const,
    locations: [0, 0.7, 1] as const,
  },
};

export function GradientBackground({
  children,
  style,
  variant = 'default',
}: GradientBackgroundProps) {
  const gradient = gradients[variant];

  // For web, use CSS gradient for better performance
  if (Platform.OS === 'web') {
    const cssGradient = `linear-gradient(180deg, ${gradient.colors[0]} ${gradient.locations[0] * 100}%, ${gradient.colors[1]} ${gradient.locations[1] * 100}%, ${gradient.colors[2]} ${gradient.locations[2] * 100}%)`;
    return (
      <View
        style={[
          styles.container,
          {
            // @ts-expect-error - web-specific CSS property
            background: cssGradient,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...gradient.colors]}
      locations={[...gradient.locations]}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
