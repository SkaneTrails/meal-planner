import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import type { FrameSegment } from '@/components';
import { AnimatedPressable, Button, TerminalFrame } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import {
  fontSize,
  fontWeight,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

type Data = ReturnType<typeof useHomeScreenData>;

interface InspirationSectionProps {
  inspirationRecipes: Data['inspirationRecipes'];
  inspirationRecipe: Data['inspirationRecipe'];
  shuffleInspiration: Data['shuffleInspiration'];
  t: Data['t'];
}

export const InspirationSection = ({
  inspirationRecipes,
  inspirationRecipe,
  shuffleInspiration,
  t,
}: InspirationSectionProps) => {
  const router = useRouter();
  const { chrome } = useTheme();

  if (inspirationRecipes.length > 0 && inspirationRecipe) {
    if (chrome === 'flat') {
      const shuffleSegment: FrameSegment = {
        label: t('home.inspiration.shuffle').toUpperCase(),
        onPress: () => {
          hapticLight();
          shuffleInspiration();
        },
      };

      const mealLabel = inspirationRecipe.meal_label
        ? t(`labels.meal.${inspirationRecipe.meal_label}`).toUpperCase()
        : undefined;

      return (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <TerminalFrame
            label={t('home.inspiration.title').toUpperCase()}
            bottomLabel={mealLabel}
            rightSegments={[shuffleSegment]}
            variant="single"
          >
            <InspirationCardCrt
              recipe={inspirationRecipe}
              onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
            />
          </TerminalFrame>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <InspirationHeader t={t} onShuffle={shuffleInspiration} />
        <InspirationCard
          recipe={inspirationRecipe}
          t={t}
          onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)}
        />
      </View>
    );
  }

  return <GetStartedFallback t={t} onPress={() => router.push('/recipes')} />;
};

/* ── Sub-components ── */

const InspirationHeader = ({
  t,
  onShuffle,
}: {
  t: Data['t'];
  onShuffle: () => void;
}) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing['sm-md'],
      }}
    >
      <Text
        style={{
          fontSize: fontSize['2xl'],
          fontFamily: fonts.display,
          color: colors.white,
          letterSpacing: letterSpacing.normal,
        }}
      >
        {t('home.inspiration.title')}
      </Text>
      <Button
        variant="text"
        size="sm"
        onPress={() => {
          hapticLight();
          onShuffle();
        }}
        icon="shuffle"
        iconSize={12}
        label={t('home.inspiration.shuffle')}
        textColor={colors.content.body}
        color={'rgba(255, 255, 255, 0.25)'}
        style={{
          paddingHorizontal: spacing['sm-md'],
          paddingVertical: spacing['xs-sm'],
          borderRadius: borderRadius.full,
        }}
      />
    </View>
  );
};

const InspirationCard = ({
  recipe,
  t,
  onPress,
}: {
  recipe: Recipe;
  t: Data['t'];
  onPress: () => void;
}) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.01}
      pressScale={0.99}
      style={{ borderRadius: borderRadius.md, overflow: 'hidden' }}
    >
      <Image
        source={recipe.image_url ? { uri: recipe.image_url } : HOMEPAGE_HERO}
        style={{ width: '100%', height: 160 }}
        contentFit="cover"
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        transition={200}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 100,
          justifyContent: 'flex-end',
          padding: spacing['md-lg'],
        }}
      >
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontFamily: fonts.bodySemibold,
            color: colors.white,
            letterSpacing: letterSpacing.tight,
          }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            gap: spacing['xs-sm'],
          }}
        >
          {recipe.meal_label && (
            <LabelBadge
              label={t(`labels.meal.${recipe.meal_label}`)}
              borderColor={colors.glass.faint}
            />
          )}
          {recipe.diet_label && (
            <LabelBadge
              label={t(`labels.diet.${recipe.diet_label}`)}
              borderColor={
                recipe.diet_label === 'veggie'
                  ? colors.diet.veggie.border
                  : recipe.diet_label === 'fish'
                    ? colors.diet.fish.border
                    : colors.diet.meat.border
              }
            />
          )}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const InspirationCardCrt = ({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) => {
  const { colors, fonts } = useTheme();

  return (
    <AnimatedPressable onPress={onPress} hoverScale={1.01} pressScale={0.99}>
      <Image
        source={recipe.image_url ? { uri: recipe.image_url } : HOMEPAGE_HERO}
        style={{ width: '100%', height: 160 }}
        contentFit="cover"
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        transition={200}
      />
      <Text
        style={{
          fontSize: fontSize['2xl'],
          fontFamily: fonts.bodySemibold,
          color: colors.content.body,
          letterSpacing: letterSpacing.tight,
          marginTop: spacing.sm,
        }}
        numberOfLines={2}
      >
        {recipe.title}
      </Text>
    </AnimatedPressable>
  );
};

const LabelBadge = ({
  label,
  borderColor,
}: {
  label: string;
  borderColor: string;
}) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View
      style={{
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor,
        paddingHorizontal: spacing['sm-md'],
        paddingVertical: 4,
        borderRadius: borderRadius.full,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.bodyMedium,
          color: colors.glass.bright,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const GetStartedFallback = ({
  t,
  onPress,
}: {
  t: Data['t'];
  onPress: () => void;
}) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
      <Text
        style={{
          fontSize: fontSize['4xl'],
          fontFamily: fonts.display,
          color: colors.white,
          marginBottom: spacing.sm,
          letterSpacing: letterSpacing.tight,
        }}
      >
        {t('home.getStarted.title')}
      </Text>

      <AnimatedPressable
        onPress={onPress}
        hoverScale={1.01}
        pressScale={0.99}
        style={{
          backgroundColor: colors.glass.solid,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glass.border,
        }}
      >
        <Image
          source={HOMEPAGE_HERO}
          style={{ width: '100%', height: 140 }}
          contentFit="cover"
          placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            justifyContent: 'flex-end',
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xl,
              fontWeight: fontWeight.semibold,
              color: colors.white,
              letterSpacing: letterSpacing.tight,
            }}
            numberOfLines={2}
          >
            {t('home.getStarted.addFirstRecipe')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            {t('home.getStarted.pasteUrl')}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
};
