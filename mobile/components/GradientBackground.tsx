/**
 * Luxurious background component.
 * Uses a soft gradient image for premium feel.
 * Adapts to all screen sizes with proper scaling.
 */

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { ImageBackground } from 'react-native';
import { Image } from 'expo-image';

// Background image - soft peach/cream gradient
const BACKGROUND_IMAGE = require('@/assets/images/background.png');

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  // Use expo-image for web to handle the image properly
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={BACKGROUND_IMAGE}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
        />
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={[styles.container, style]}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
