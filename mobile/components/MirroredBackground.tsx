/**
 * A background component that tiles an image seamlessly by flipping
 * every other copy vertically, so the bottom of one matches the top
 * of the next (mirrored). This eliminates visible seams on long pages.
 */

import React from 'react';
import { View, Image, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

interface MirroredBackgroundProps {
  /** The image to tile */
  source: ImageSourcePropType;
  /** How many tiles to stack (default: 4 for long pages) */
  tileCount?: number;
  /** Aspect ratio of the source image (width/height). Default: 672/1450 for background2.png */
  imageAspectRatio?: number;
  /** Style for the outer container */
  style?: StyleProp<ViewStyle>;
  /** Style applied to the top-left/right corners of the first tile */
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  /** Children rendered on top of the background */
  children?: React.ReactNode;
}

export const MirroredBackground = ({
  source,
  tileCount = 4,
  imageAspectRatio = 672 / 1450,
  style,
  borderTopLeftRadius = 0,
  borderTopRightRadius = 0,
  children,
}: MirroredBackgroundProps) => {
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
              { width: '100%' as const, aspectRatio: imageAspectRatio },
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
  flipped: {
    transform: [{ scaleY: -1 }],
  },
});
