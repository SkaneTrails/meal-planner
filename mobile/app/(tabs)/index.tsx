import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, fontSize, letterSpacing, fontFamily } from '@/lib/theme';
import { AnimatedPressable, GradientBackground, HomeScreenSkeleton } from '@/components';
import { hapticLight } from '@/lib/haptics';
import { useHomeScreenData } from './index/useHomeScreenData';
import { StatsCards } from './index/StatsCards';
import { InspirationSection } from './index/InspirationSection';
import { AddRecipeModal } from './index/AddRecipeModal';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

export default function HomeScreen() {
  const data = useHomeScreenData();
  const {
    router, recipes, isLoading, handleRefresh,
    greetingKey, t, recipeUrl, setRecipeUrl,
    showAddModal, setShowAddModal,
    groceryItemsCount, plannedMealsCount, nextMeal,
    inspirationRecipes, inspirationRecipe, shuffleInspiration,
    handleImportRecipe,
  } = data;

  if (isLoading && recipes.length === 0) {
    return (
      <GradientBackground>
        <HomeScreenSkeleton />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header greetingKey={greetingKey} t={t} onSettings={() => { hapticLight(); router.push('/settings'); }} />

        <StatsCards
          recipesCount={recipes.length}
          plannedMealsCount={plannedMealsCount}
          groceryItemsCount={groceryItemsCount}
          t={t}
        />

        <AddRecipeButton t={t} onPress={() => { hapticLight(); setShowAddModal(true); }} />

        <NextMealCard nextMeal={nextMeal} t={t} onPress={() => nextMeal?.recipeId ? router.push(`/recipe/${nextMeal.recipeId}`) : router.push('/meal-plan')} />

        <InspirationSection
          inspirationRecipes={inspirationRecipes}
          inspirationRecipe={inspirationRecipe}
          shuffleInspiration={shuffleInspiration}
          t={t}
        />
      </ScrollView>

      <AddRecipeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        recipeUrl={recipeUrl}
        setRecipeUrl={setRecipeUrl}
        onImport={handleImportRecipe}
        t={t}
      />
    </GradientBackground>
  );
}

/* ── Inline sub-components ── */

type TFn = ReturnType<typeof useHomeScreenData>['t'];

const Header = ({ greetingKey, t, onSettings }: { greetingKey: string; t: TFn; onSettings: () => void }) => (
  <View style={{ paddingHorizontal: 20, paddingTop: 44, paddingBottom: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: fontSize['4xl'], fontFamily: fontFamily.display,
          color: colors.text.primary, letterSpacing: letterSpacing.tight,
          marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.15)',
          textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
        }}>
          {t(`home.${greetingKey}` as any)}
        </Text>
        <Text style={{
          fontSize: fontSize.lg, fontFamily: fontFamily.body,
          color: colors.text.secondary, letterSpacing: letterSpacing.normal,
        }}>
          {t('home.subtitle')}
        </Text>
      </View>
      <AnimatedPressable
        onPress={onSettings}
        hoverScale={1.08}
        pressScale={0.95}
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.glass.card,
          alignItems: 'center', justifyContent: 'center', ...shadows.sm,
        }}
      >
        <Ionicons name="settings-outline" size={22} color="#5D4E40" />
      </AnimatedPressable>
    </View>
  </View>
);

const AddRecipeButton = ({ t, onPress }: { t: TFn; onPress: () => void }) => (
  <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.02}
      pressScale={0.97}
      style={{
        backgroundColor: '#7A6858', borderRadius: borderRadius.md,
        paddingVertical: 14, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        ...shadows.md,
      }}
    >
      <Ionicons name="add-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
      <Text style={{ color: colors.white, fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold }}>
        {t('home.addRecipe.title')}
      </Text>
    </AnimatedPressable>
  </View>
);

type NextMealType = ReturnType<typeof useHomeScreenData>['nextMeal'];

const NextMealCard = ({ nextMeal, t, onPress }: { nextMeal: NextMealType; t: TFn; onPress: () => void }) => (
  <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
    <Text style={{
      fontSize: fontSize.xl, fontFamily: fontFamily.display,
      color: colors.white, marginBottom: 8, letterSpacing: letterSpacing.normal,
    }}>
      {t('home.nextUp.title')}
    </Text>

    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.01}
      pressScale={0.99}
      style={{
        backgroundColor: colors.glass.card, borderRadius: borderRadius.md,
        padding: 12, flexDirection: 'row', alignItems: 'center',
      }}
    >
      <Image
        source={nextMeal?.imageUrl ? { uri: nextMeal.imageUrl } : HOMEPAGE_HERO}
        style={{ width: 64, height: 64, borderRadius: borderRadius.md }}
        contentFit="cover"
        placeholder={PLACEHOLDER_BLURHASH}
        transition={200}
      />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          {nextMeal && !nextMeal.isTomorrow && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E07B54', marginRight: 6 }} />
          )}
          <Text style={{
            fontSize: fontSize.xs,
            color: nextMeal && !nextMeal.isTomorrow ? '#5D4E40' : '#8B7355',
            fontFamily: nextMeal && !nextMeal.isTomorrow ? fontFamily.bodySemibold : fontFamily.body,
            textTransform: 'uppercase', letterSpacing: letterSpacing.wide,
          }}>
            {nextMeal
              ? `${nextMeal.isTomorrow ? t('home.nextUp.tomorrow') : t('home.nextUp.today')} · ${t(`labels.mealTime.${nextMeal.mealType}` as any)}`
              : t('home.nextUp.noMealPlanned')}
          </Text>
        </View>
        <Text style={{
          fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: '#5D4E40',
        }} numberOfLines={1}>
          {nextMeal?.title || t('home.nextUp.planYourNextMeal')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8B7355" />
    </AnimatedPressable>
  </View>
);
