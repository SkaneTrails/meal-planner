/**
 * Background component with two modes:
 * - Default: Static background image (background.png)
 * - Animated: Floating color orbs with smooth curved movement (for sign-in/no-access)
 */

import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '@/lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const _BACKGROUND_IMAGE = require('@/assets/images/background.png');
const BACKGROUND_GRADIENT = require('@/assets/images/bck_b.png');

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
  animated?: boolean;
  muted?: boolean; // Adds a desaturating overlay for a B&W-ish effect
  structured?: boolean; // Faint gradient variant for structured content screens (meal plan, etc.)
  neutral?: boolean; // Warm neutral surface - no visible gradient, just light beige/warm gray
}

const FloatingOrb = ({
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
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateOrb = () => {
      Animated.loop(
        Animated.sequence([
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
};

export const GradientBackground = ({
  children,
  style,
  animated = false,
  muted = false,
  structured = false,
  neutral = false,
}: GradientBackgroundProps) => {
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const _isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  // Neutral variant: warm beige-grey solid surface for grocery list
  if (neutral) {
    return (
      <View
        style={[
          styles.container,
          style,
          {
            width: windowWidth,
            height: windowHeight,
            backgroundColor: colors.tabBar.bottomFill,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  // Muted variant for settings - uses gradient background image with darker overlay
  if (muted) {
    return (
      <View
        style={[
          styles.container,
          style,
          { width: windowWidth, height: windowHeight, overflow: 'hidden' },
        ]}
      >
        <ImageBackground
          source={BACKGROUND_GRADIENT}
          style={{
            width: windowWidth,
            height: windowHeight + 200,
            marginTop: -100,
          }}
          resizeMode="cover"
        >
          {/* Darker overlay for settings */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.background.mutedOverlay,
              },
            ]}
          />
        </ImageBackground>
        <View style={[StyleSheet.absoluteFill]}>{children}</View>
      </View>
    );
  }

  if (!animated) {
    return (
      <View
        style={[
          styles.container,
          style,
          { width: windowWidth, height: windowHeight, overflow: 'hidden' },
        ]}
      >
        <ImageBackground
          source={BACKGROUND_GRADIENT}
          style={{
            width: windowWidth,
            height: windowHeight + 200,
            marginTop: -100,
          }}
          resizeMode="cover"
        >
          {/* Brighten the image slightly for main page */}
          {!structured && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.background.defaultOverlay,
                },
              ]}
            />
          )}
          {/* Structured variant: stronger neutral wash for content-heavy screens */}
          {structured && (
            <>
              {/* Warm beige-grey surface for content screens */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: colors.background.structuredWash,
                  },
                ]}
              />
              {/* Very subtle warm tint at top only */}
              <LinearGradient
                colors={[
                  colors.background.structuredGradientStart,
                  colors.background.structuredGradientEnd,
                ]}
                locations={[0, 0.3]}
                style={[StyleSheet.absoluteFill]}
              />
            </>
          )}
        </ImageBackground>
        <View style={[StyleSheet.absoluteFill]}>{children}</View>
      </View>
    );
  }

  const orbs = [
    {
      color: colors.gradient.orb1,
      size: SCREEN_WIDTH * 0.8,
      x: -SCREEN_WIDTH * 0.2,
      y: -SCREEN_HEIGHT * 0.1,
      duration: 20000,
      delay: 0,
    },
    {
      color: colors.ai.primary,
      size: SCREEN_WIDTH * 0.5,
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT * 0.15,
      duration: 22000,
      delay: 3000,
    },
    {
      color: colors.gradient.orb2,
      size: SCREEN_WIDTH * 0.7,
      x: SCREEN_WIDTH * 0.4,
      y: SCREEN_HEIGHT * 0.6,
      duration: 25000,
      delay: 2000,
    },
    {
      color: colors.ai.primaryDark,
      size: SCREEN_WIDTH * 0.45,
      x: SCREEN_WIDTH * 0.1,
      y: SCREEN_HEIGHT * 0.35,
      duration: 18000,
      delay: 1000,
    },
    {
      color: colors.gradient.orb3,
      size: SCREEN_WIDTH * 0.55,
      x: SCREEN_WIDTH * 0.6,
      y: SCREEN_HEIGHT * 0.1,
      duration: 22000,
      delay: 3000,
    },
    {
      color: colors.gradient.orb4,
      size: SCREEN_WIDTH * 0.55,
      x: -SCREEN_WIDTH * 0.1,
      y: SCREEN_HEIGHT * 0.7,
      duration: 24000,
      delay: 1500,
    },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient - warm terracotta tones */}
      <LinearGradient
        colors={[
          colors.bgBase,
          colors.gradient.stop1,
          colors.gradient.stop2,
          colors.gradient.orb4,
        ]}
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
            backgroundColor: colors.background.animatedOverlay,
          },
        ]}
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
