/**
 * Gradient background component matching the food delivery app design.
 * Flows from warm beige at top to light cream at bottom (inverted).
 */

import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

export function GradientBackground({
  children,
  style,
}: GradientBackgroundProps) {
  // For web, use CSS gradient for better performance
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            // @ts-expect-error - web-specific CSS property
            background:
              'linear-gradient(180deg, #E8D5C4 0%, #F5E6D3 50%, #FDFBF7 100%)',
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
      colors={['#E8D5C4', '#F5E6D3', '#FDFBF7']}
      locations={[0, 0.5, 1]}
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
