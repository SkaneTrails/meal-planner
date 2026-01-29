/**
 * Bouncing dots loader animation.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

interface BouncingLoaderProps {
  color?: string;
  size?: number;
}

export function BouncingLoader({ color = '#C4A77D', size = 12 }: BouncingLoaderProps) {
  const bounce1 = useSharedValue(0);
  const bounce2 = useSharedValue(0);
  const bounce3 = useSharedValue(0);

  useEffect(() => {
    const bounceAnimation = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-12, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          false
        )
      );

    bounce1.value = bounceAnimation(0);
    bounce2.value = bounceAnimation(150);
    bounce3.value = bounceAnimation(300);
  }, [bounce1, bounce2, bounce3]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce3.value }],
  }));

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: 4,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[dotStyle, animatedStyle1]} />
      <Animated.View style={[dotStyle, animatedStyle2]} />
      <Animated.View style={[dotStyle, animatedStyle3]} />
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
