/**
 * Background component with two modes:
 * - Default: Plain beige (bgBase) for all content screens
 * - Animated: Shifting warm beige-grey gradient (home, sign-in, no-access)
 */

import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '@/lib/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
  animated?: boolean;
}

/** Three cross-fading gradient layers create a smooth shifting warm background. */
const AnimatedGradient = () => {
  const { colors } = useTheme();
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity1, {
            toValue: 0.2,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 0.8,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity1, {
            toValue: 0.7,
            duration: 3000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0.3,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 0.2,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity1, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0,
            duration: 3800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity3, {
            toValue: 0.6,
            duration: 3400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [opacity1, opacity2, opacity3]);

  return (
    <>
      {/* Layer A: warm cream → soft grey */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity1 }]}>
        <LinearGradient
          colors={[
            colors.gradient.orb1,
            colors.gradient.orb5,
            colors.gradient.orb4,
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Layer B: grey → warm beige */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity2 }]}>
        <LinearGradient
          colors={[
            colors.gradient.orb6,
            colors.gradient.orb3,
            colors.gradient.stop1,
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.7, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Layer C: diagonal beige-grey wash */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity3 }]}>
        <LinearGradient
          colors={[
            colors.gradient.stop2,
            colors.gradient.orb1,
            colors.gradient.orb6,
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
};

export const GradientBackground = ({
  children,
  style,
  animated = false,
}: GradientBackgroundProps) => {
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Non-animated: plain beige background
  if (!animated) {
    return (
      <View
        style={[
          styles.container,
          style,
          {
            width: windowWidth,
            height: windowHeight,
            backgroundColor: colors.bgBase,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  // Animated: shifting warm beige-grey gradient
  return (
    <View style={[styles.container, style]}>
      <AnimatedGradient />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
