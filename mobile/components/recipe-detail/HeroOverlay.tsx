import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, type TextStyle, View, type ViewStyle } from 'react-native';
import {
  fontSize,
  layout,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

interface HeroOverlayProps {
  /** Content rendered in the top-right corner, below the status bar. */
  topRight?: ReactNode;
  /** Recipe title displayed in the bottom gradient. */
  title: string;
  /** Content rendered to the right of the title (e.g. ThumbRating). */
  titleRight?: ReactNode;
  /** Total height of the hero area (used for gradient sizing). */
  headerHeight: number;
}

export const HeroOverlay = ({
  topRight,
  title,
  titleRight,
  headerHeight,
}: HeroOverlayProps) => {
  const { colors, fonts } = useTheme();

  return (
    <>
      <LinearGradient
        colors={['transparent', colors.overlay.gradientHeavy]}
        style={gradientStyle(headerHeight)}
      >
        <View style={titleRowStyle}>
          <Text style={titleStyle(colors, fonts) as TextStyle}>{title}</Text>
          {titleRight}
        </View>
      </LinearGradient>

      {topRight && <View style={topRightContainerStyle}>{topRight}</View>}
    </>
  );
};

const gradientStyle = (headerHeight: number): ViewStyle => ({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  paddingTop: Math.round((headerHeight * 2) / 7),
  paddingBottom: spacing['4xl'] + spacing.sm,
  paddingHorizontal: spacing.xl,
});

const titleRowStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const titleStyle = (
  colors: ReturnType<typeof useTheme>['colors'],
  fonts: ReturnType<typeof useTheme>['fonts'],
) => ({
  fontSize: fontSize['4xl'],
  fontFamily: fonts.display,
  color: colors.white,
  letterSpacing: letterSpacing.tight,
  flex: 1,
  marginRight: spacing.md,
  textShadow: `1px 2px 4px ${colors.overlay.backdrop}`,
});

const topRightContainerStyle: ViewStyle = {
  position: 'absolute',
  top: layout.screenPaddingTop + spacing.sm,
  right: spacing.lg,
  gap: spacing.sm,
  alignItems: 'center',
};
