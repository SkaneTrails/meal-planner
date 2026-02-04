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

// Gradient color presets - warm brown/peach tones (lighter for better contrast)
const gradients = {
  // Default: soft warm gradient
  default: {
    colors: ['#D4C4B8', '#D8C0AC', '#DDB89C', '#E2AC88', '#D8A078'] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
  },
  // Warm: richer brown to orange
  warm: {
    colors: ['#C8B8A8', '#D0B098', '#D8A888', '#E0A078'] as const,
    locations: [0, 0.33, 0.66, 1] as const,
  },
  // Soft: muted warm tones
  soft: {
    colors: ['#D4C4B8', '#D8C0AC', '#DDB89C', '#E2AC88', '#D8A078'] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
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
    // Build CSS gradient string dynamically for any number of color stops
    const colorStops = gradient.colors
      .map((color, i) => `${color} ${gradient.locations[i] * 100}%`)
      .join(', ');
    const cssGradient = `linear-gradient(180deg, ${colorStops})`;
    return (
      <View
        style={[
          styles.container,
          {
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
