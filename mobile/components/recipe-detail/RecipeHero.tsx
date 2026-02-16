import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
} from '@/lib/theme';
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
  isUpdatingImage: boolean;
  onPickImage: () => void;
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
  isUpdatingImage,
  onPickImage,
  onThumbUp,
  onThumbDown,
}: RecipeHeroProps) => (
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

    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.7)']}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: Math.round((headerHeight * 2) / 7),
        paddingBottom: spacing['4xl'] + spacing.sm,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Text
          style={{
            fontSize: fontSize['4xl'],
            fontFamily: fontFamily.display,
            color: colors.white,
            letterSpacing: letterSpacing.tight,
            flex: 1,
            marginRight: spacing.md,
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 1, height: 2 },
            textShadowRadius: 4,
          }}
        >
          {title}
        </Text>
        <ThumbRating
          rating={rating}
          hidden={hidden}
          onThumbUp={onThumbUp}
          onThumbDown={onThumbDown}
          size={24}
        />
      </View>
    </LinearGradient>

    <Pressable
      onPress={onPickImage}
      style={({ pressed }) => ({
        position: 'absolute',
        top: 60,
        right: spacing.lg,
        backgroundColor: pressed
          ? 'rgba(255, 255, 255, 0.45)'
          : 'rgba(255, 255, 255, 0.3)',
        borderRadius: borderRadius.xl,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {isUpdatingImage ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Ionicons name="camera" size={20} color={colors.white} />
      )}
    </Pressable>
  </Animated.View>
);
