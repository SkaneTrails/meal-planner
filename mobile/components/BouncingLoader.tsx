/**
 * Bouncing dots loader animation.
 * Uses React Native's built-in Animated API.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface BouncingLoaderProps {
  color?: string;
  size?: number;
}

export function BouncingLoader({ color = '#C4A77D', size = 12 }: BouncingLoaderProps) {
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounceAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: -12,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createBounceAnimation(bounce1, 0);
    const anim2 = createBounceAnimation(bounce2, 150);
    const anim3 = createBounceAnimation(bounce3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [bounce1, bounce2, bounce3]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: 4,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[dotStyle, { transform: [{ translateY: bounce1 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: bounce2 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: bounce3 }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
