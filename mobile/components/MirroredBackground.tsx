/**
 * A background component that tiles an image seamlessly by flipping
 * every other copy vertically, so the bottom of one matches the top
 * of the next (mirrored). This eliminates visible seams on long pages.
 */

import React from 'react';
import { View, Image, StyleSheet, type ViewStyle, type ImageSourcePropType } from 'react-native';

interface MirroredBackgroundProps {
  /** The image to tile */
  source: ImageSourcePropType;
  /** How many tiles to stack (default: 4 for long pages) */
  tileCount?: number;
  /** Style for the outer container */
  style?: ViewStyle;
  /** Style applied to the top-left/right corners of the first tile */
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  /** Children rendered on top of the background */
  children?: React.ReactNode;
}

export function MirroredBackground({
  source,
  tileCount = 4,
  style,
  borderTopLeftRadius = 0,
  borderTopRightRadius = 0,
  children,
}: MirroredBackgroundProps) {
  const tiles = Array.from({ length: tileCount }, (_, i) => i);

  return (
    <View style={[styles.container, style]}>
      {/* Background tiles layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map((i) => (
          <Image
            key={i}
            source={source}
            style={[
              styles.tile,
              i % 2 === 1 && styles.flipped,
              i === 0 && {
                borderTopLeftRadius,
                borderTopRightRadius,
              },
            ]}
            resizeMode="stretch"
          />
        ))}
      </View>
      {/* Content layer */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  tile: {
    width: '100%',
    // Tiles are stretched to fill width; aspectRatio controls
    // the height of each tile relative to its width.
    // 672x1300 background.png → ~0.517 aspect ratio
    aspectRatio: 672 / 1300,
  },
  flipped: {
    transform: [{ scaleY: -1 }],
  },
});
