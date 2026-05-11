/**
 * HeroNextMeal — full-bleed hero for the home screen.
 *
 * Replaces the labeled "NEXT UP" card + greeting + stats dashboard with a
 * single editorial hero: tall image, gradient overlay, eyebrow with
 * day + slot ("FRIDAY · DINNER"), big title, and meta line.
 *
 * Empty state: still uses the homepage hero asset, but copy invites the
 * user to plan their next meal.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { ThemeIcon } from '@/components/ThemeIcon';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

type Data = ReturnType<typeof useHomeScreenData>;
type TFn = Data['t'];
type NextMealType = Data['nextMeal'];

interface HeroNextMealProps {
  nextMeal: NextMealType;
  t: TFn;
  onPress: () => void;
}

export const HeroNextMeal = ({ nextMeal, t, onPress }: HeroNextMealProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();

  const eyebrow = nextMeal
    ? `${
        nextMeal.isTomorrow ? t('home.nextUp.tomorrow') : t('home.nextUp.today')
      } · ${t(`labels.mealTime.${nextMeal.mealType}`)}`
    : t('home.nextUp.noMealPlanned');

  const title = nextMeal?.title ?? t('home.nextUp.planYourNextMeal');
  const imageSource = nextMeal?.imageUrl
    ? { uri: nextMeal.imageUrl }
    : HOMEPAGE_HERO;

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        marginBottom: spacing['2xl'],
      }}
    >
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.card.bg,
          ...shadows.sm,
        }}
      >
        <Image
          source={imageSource}
          style={{ width: '100%', aspectRatio: 5 / 4, maxHeight: 320 }}
          contentFit="cover"
          placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
          transition={200}
        />

        {/* Floating "open" pill — clearer affordance than an inline
            chevron. Opaque white backdrop so the label stays readable
            over any photo (the theme's `glassSolid` tone is only 7%
            tint in petrol, which vanishes over busy hero images). */}
        <View
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 6,
            borderRadius: borderRadius.full,
            backgroundColor: colors.card.bg,
            ...shadows.sm,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: fontSize.xs,
              color: colors.content.body,
              letterSpacing: letterSpacing.wide,
              textTransform: 'uppercase',
            }}
          >
            {t('home.openPlanner')}
          </Text>
          <ThemeIcon
            name="arrow-forward"
            size={14}
            color={colors.content.body}
          />
        </View>

        <LinearGradient
          colors={['transparent', colors.overlay.gradientHeavy]}
          locations={[0.35, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing['2xl'],
            paddingBottom: spacing.xl,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: fontSize.xs,
              color: colors.white,
              opacity: 0.85,
              letterSpacing: letterSpacing.wider,
              textTransform: 'uppercase',
              marginBottom: spacing.xs,
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayBold,
              fontSize: fontSize['3xl'],
              lineHeight: 30,
              color: colors.white,
              letterSpacing: letterSpacing.tight,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
};
