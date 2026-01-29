/**
 * Gradient background component matching the food delivery app design.
 * Flows from light cream at top to warm beige at bottom.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  // For web, use CSS gradient for better performance
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            // @ts-ignore - web-specific CSS property
            background: 'linear-gradient(180deg, #FDFBF7 0%, #F5E6D3 50%, #E8D5C4 100%)',
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
      colors={['#FDFBF7', '#F5E6D3', '#E8D5C4']}
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
