import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@/lib/theme';
import { HeroOverlay } from './HeroOverlay';
import {
  PLACEHOLDER_BLURHASH,
  PLACEHOLDER_IMAGE,
} from './recipe-detail-constants';
import { ThumbRating } from './ThumbRating';

interface RecipeHeroProps {
  title: string;
  imageUrl: string | null;
  rating: number | null;
  hidden: boolean;
  headerHeight: number;
  scrollY: Animated.Value;
  /** Buttons rendered in the top-right corner of the hero (e.g. favorite, camera). */
  topRightButtons?: ReactNode;
  onThumbUp: () => void;
  onThumbDown: () => void;
}

export const RecipeHero = ({
  title,
  imageUrl,
  rating,
  hidden,
  headerHeight,
  scrollY,
  topRightButtons,
  onThumbUp,
  onThumbDown,
}: RecipeHeroProps) => {
  const { visibility } = useTheme();
  return (
    <Animated.View
      style={{
        position: 'relative',
        height: headerHeight,
        overflow: 'hidden',
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [-headerHeight, 0, headerHeight],
              outputRange: [-headerHeight / 2, 0, headerHeight * 0.5],
              extrapolate: 'clamp',
            }),
          },
          {
            scale: scrollY.interpolate({
              inputRange: [-headerHeight, 0, 1],
              outputRange: [2, 1, 1],
              extrapolate: 'clamp',
            }),
          },
        ],
      }}
    >
      <Image
        source={{ uri: imageUrl || PLACEHOLDER_IMAGE }}
        style={{ width: '100%', height: headerHeight }}
        contentFit="cover"
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        transition={400}
      />

      {visibility.showHeroOverlay && (
        <HeroOverlay
          title={title}
          headerHeight={headerHeight}
          topRight={topRightButtons}
          titleRight={
            <ThumbRating
              rating={rating}
              hidden={hidden}
              onThumbUp={onThumbUp}
              onThumbDown={onThumbDown}
              size={24}
            />
          }
        />
      )}
    </Animated.View>
  );
};
