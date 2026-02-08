import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, colors, fontSize, letterSpacing, fontFamily } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { Recipe } from '@/lib/types';
import type { useHomeScreenData } from './useHomeScreenData';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

type Data = ReturnType<typeof useHomeScreenData>;

interface InspirationSectionProps {
  inspirationRecipes: Data['inspirationRecipes'];
  inspirationRecipe: Data['inspirationRecipe'];
  shuffleInspiration: Data['shuffleInspiration'];
  t: Data['t'];
}

export const InspirationSection = ({ inspirationRecipes, inspirationRecipe, shuffleInspiration, t }: InspirationSectionProps) => {
  const router = useRouter();

  if (inspirationRecipes.length > 0 && inspirationRecipe) {
    return (
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <InspirationHeader t={t} onShuffle={shuffleInspiration} />
        <InspirationCard recipe={inspirationRecipe} t={t} onPress={() => router.push(`/recipe/${inspirationRecipe.id}`)} />
      </View>
    );
  }

  return <GetStartedFallback t={t} onPress={() => router.push('/recipes')} />;
};

/* ── Sub-components ── */

const InspirationHeader = ({ t, onShuffle }: { t: Data['t']; onShuffle: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
    <Text style={{
      fontSize: fontSize['2xl'],
      fontFamily: fontFamily.display,
      color: colors.white,
      letterSpacing: letterSpacing.normal,
    }}>
      {t('home.inspiration.title')}
    </Text>
    <AnimatedPressable
      onPress={() => { hapticLight(); onShuffle(); }}
      hoverScale={1.05}
      pressScale={0.95}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: borderRadius.full,
      }}
    >
      <Ionicons name="shuffle" size={12} color="#8B7355" />
      <Text style={{ color: '#5D4E40', fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs, marginLeft: 4 }}>
        {t('home.inspiration.shuffle')}
      </Text>
    </AnimatedPressable>
  </View>
);

const InspirationCard = ({ recipe, t, onPress }: { recipe: Recipe; t: Data['t']; onPress: () => void }) => (
  <AnimatedPressable onPress={onPress} hoverScale={1.01} pressScale={0.99}
    style={{ backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: borderRadius.md, overflow: 'hidden' }}>
    <Image
      source={recipe.image_url ? { uri: recipe.image_url } : HOMEPAGE_HERO}
      style={{ width: '100%', height: 160 }}
      contentFit="cover"
      placeholder={PLACEHOLDER_BLURHASH}
      transition={200}
    />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.75)']}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
        justifyContent: 'flex-end', padding: 14,
      }}
    >
      <Text style={{
        fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold,
        color: colors.white, letterSpacing: letterSpacing.tight,
      }} numberOfLines={2}>
        {recipe.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
        {recipe.meal_label && <LabelBadge label={t(`labels.meal.${recipe.meal_label}` as any)} borderColor="rgba(255,255,255,0.5)" />}
        {recipe.diet_label && (
          <LabelBadge
            label={t(`labels.diet.${recipe.diet_label}` as any)}
            borderColor={
              recipe.diet_label === 'veggie' ? 'rgba(76, 175, 80, 0.7)' :
              recipe.diet_label === 'fish' ? 'rgba(66, 165, 245, 0.7)' : 'rgba(229, 115, 115, 0.7)'
            }
          />
        )}
      </View>
    </LinearGradient>
  </AnimatedPressable>
);

const LabelBadge = ({ label, borderColor }: { label: string; borderColor: string }) => (
  <View style={{
    backgroundColor: 'transparent', borderWidth: 1, borderColor,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full,
  }}>
    <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium, color: 'rgba(255,255,255,0.9)' }}>
      {label}
    </Text>
  </View>
);

const GetStartedFallback = ({ t, onPress }: { t: Data['t']; onPress: () => void }) => (
  <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
    <Text style={{
      fontSize: fontSize['4xl'], fontFamily: fontFamily.display,
      color: colors.white, marginBottom: 8, letterSpacing: letterSpacing.tight,
    }}>
      {t('home.getStarted.title')}
    </Text>

    <AnimatedPressable onPress={onPress} hoverScale={1.01} pressScale={0.99}
      style={{ backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: borderRadius.md, overflow: 'hidden' }}>
      <Image
        source={HOMEPAGE_HERO}
        style={{ width: '100%', height: 140 }}
        contentFit="cover"
        placeholder={PLACEHOLDER_BLURHASH}
        transition={200}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
          justifyContent: 'flex-end', padding: 12,
        }}
      >
        <Text style={{
          fontSize: fontSize.xl, fontWeight: '600',
          color: colors.white, letterSpacing: letterSpacing.tight,
        }} numberOfLines={2}>
          {t('home.getStarted.addFirstRecipe')}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }}>
          {t('home.getStarted.pasteUrl')}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  </View>
);
