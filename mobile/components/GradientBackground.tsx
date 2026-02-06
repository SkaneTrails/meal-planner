/**
 * Background component with two modes:
 * - Default: Static background image (background.png)
 * - Animated: Floating color orbs with smooth curved movement (for sign-in/no-access)
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions, ImageBackground, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Background image for most screens
const BACKGROUND_IMAGE = require('@/assets/images/background.png');

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
  animated?: boolean;
}

// Floating orb component
function FloatingOrb({
  color,
  size,
  initialX,
  initialY,
  duration,
  delay,
}: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateOrb = () => {
      // Create smooth curved movement using sequential animations
      Animated.loop(
        Animated.sequence([
          // Move to position 1 (curve up-right)
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 80,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(translateY, {
              toValue: -60,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(scale, {
              toValue: 1.15,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
              delay,
            }),
          ]),
          // Move to position 2 (curve down-right)
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 40,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 50,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ]),
          // Move to position 3 (curve down-left)
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -60,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 30,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.1,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ]),
          // Return to start (curve up-left)
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.25,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    };

    animateOrb();
  }, [translateX, translateY, scale, duration, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.6,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export function GradientBackground({ children, style, animated = false }: GradientBackgroundProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  // For non-animated (default), use static background image
  if (!animated) {
    // Always use the background image, stretched to fit the screen
    return (
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={[styles.container, style, { width: windowWidth, height: windowHeight }]}
        resizeMode="stretch"
      >
        {/* Slight darkening overlay for mobile to make colors richer */}
        {isMobile && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
              },
            ]}
          />
        )}
        {children}
      </ImageBackground>
    );
  }

  // Orb configurations - warm coral/terracotta tones matching background.png
  // Colors: cream top-left, dusty rose middle, rich coral/terracotta bottom-right
  const orbs = [
    { color: '#E8D0C0', size: SCREEN_WIDTH * 0.8, x: -SCREEN_WIDTH * 0.2, y: -SCREEN_HEIGHT * 0.1, duration: 20000, delay: 0 },      // Light cream
    { color: '#D4A080', size: SCREEN_WIDTH * 0.7, x: SCREEN_WIDTH * 0.4, y: SCREEN_HEIGHT * 0.6, duration: 25000, delay: 2000 },     // Warm terracotta
    { color: '#C8A090', size: SCREEN_WIDTH * 0.6, x: SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.3, duration: 18000, delay: 1000 },     // Dusty rose
    { color: '#E0B090', size: SCREEN_WIDTH * 0.5, x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.1, duration: 22000, delay: 3000 },     // Warm peach
    { color: '#D08060', size: SCREEN_WIDTH * 0.55, x: -SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.7, duration: 24000, delay: 1500 },   // Rich coral
    { color: '#C89070', size: SCREEN_WIDTH * 0.45, x: SCREEN_WIDTH * 0.6, y: SCREEN_HEIGHT * 0.4, duration: 19000, delay: 2500 },    // Terracotta
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient - matching background.png tones */}
      <LinearGradient
        colors={['#E8D8C8', '#D8B8A0', '#D0A080', '#C88060']}
        locations={[0, 0.33, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating orbs layer */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        {orbs.map((orb, index) => (
          <FloatingOrb
            key={index}
            color={orb.color}
            size={orb.size}
            initialX={orb.x}
            initialY={orb.y}
            duration={orb.duration}
            delay={orb.delay}
          />
        ))}
      </View>

      {/* Soft overlay for blending */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
