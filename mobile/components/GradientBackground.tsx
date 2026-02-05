/**
 * Luxurious animated background component.
 * Floating color orbs with smooth curved movement for premium, alive feel.
 * Creates a subtle lava lamp-like effect.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export function GradientBackground({ children, style, animated = true }: GradientBackgroundProps) {
  // For non-animated, use simple gradient
  if (!animated) {
    return (
      <LinearGradient
        colors={['#D4C4B8', '#D8C0AC', '#DDB89C', '#E2AC88', '#D8A078']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={[styles.container, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Orb configurations - different sizes, colors, positions, and timing
  const orbs = [
    { color: '#E8C8A8', size: SCREEN_WIDTH * 0.8, x: -SCREEN_WIDTH * 0.2, y: -SCREEN_HEIGHT * 0.1, duration: 20000, delay: 0 },
    { color: '#D4A088', size: SCREEN_WIDTH * 0.7, x: SCREEN_WIDTH * 0.4, y: SCREEN_HEIGHT * 0.6, duration: 25000, delay: 2000 },
    { color: '#E0B898', size: SCREEN_WIDTH * 0.6, x: SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.3, duration: 18000, delay: 1000 },
    { color: '#C8A890', size: SCREEN_WIDTH * 0.5, x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.1, duration: 22000, delay: 3000 },
    { color: '#DCC0A0', size: SCREEN_WIDTH * 0.55, x: -SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.7, duration: 24000, delay: 1500 },
    { color: '#E4B8A0', size: SCREEN_WIDTH * 0.45, x: SCREEN_WIDTH * 0.6, y: SCREEN_HEIGHT * 0.4, duration: 19000, delay: 2500 },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#D8C8B8', '#DCC4B0', '#E0C0A8', '#E4BCA0']}
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
