/**
 * CRT visual overlay — scanlines, phosphor glow, and subtle flicker.
 *
 * Renders only when the active theme provides a `crt` configuration
 * (e.g. the terminal theme). The overlay is non-interactive and sits
 * on top of all content via absolute positioning + pointerEvents="none".
 *
 * Effects:
 * - **Scanlines** — repeating horizontal stripes (web-only CSS gradient)
 * - **Glow** — inner box-shadow in the theme's phosphor color
 * - **Flicker** — looping opacity pulse that mimics CRT refresh jitter
 */

import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme';

export const CRTOverlay = () => {
  const { crt } = useTheme();
  const flickerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!crt) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: crt.flickerMin,
          duration: crt.flickerMs,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: crt.flickerMs,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [crt, flickerAnim]);

  if (!crt) return null;

  const scanlineStyle =
    Platform.OS === 'web'
      ? {
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${crt.scanlineOpacity}) 2px,
            rgba(0, 0, 0, ${crt.scanlineOpacity}) 4px
          )`,
        }
      : undefined;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: flickerAnim }]}
      pointerEvents="none"
    >
      {/* Scanlines (web only — CSS gradient) */}
      {Platform.OS === 'web' && (
        <View style={[styles.scanlines, scanlineStyle]} />
      )}

      {/* Phosphor glow — inner vignette */}
      <View
        style={[
          styles.glow,
          {
            boxShadow: `inset 0 0 ${crt.glowSpread}px ${crt.glowSize}px ${crt.glowColor}`,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
});
