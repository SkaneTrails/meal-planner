import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  AnimatedPressable,
  GradientBackground,
  HomeScreenSkeleton,
  PrimaryButton,
} from '@/components';
import { AddRecipeModal } from '@/components/home/AddRecipeModal';
import { InspirationSection } from '@/components/home/InspirationSection';
import { StatsCards } from '@/components/home/StatsCards';
import { ScreenTitle } from '@/components/ScreenTitle';
import { hapticLight } from '@/lib/haptics';
import { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  layout,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

export default function HomeScreen() {
  const data = useHomeScreenData();
  const {
    router,
    recipes,
    totalCount,
    isLoading,
    handleRefresh,
    greetingKey,
    t,
    recipeUrl,
    setRecipeUrl,
    showAddModal,
    setShowAddModal,
    groceryItemsCount,
    plannedMealsCount,
    plannedMealsPercentage,
    nextMeal,
    inspirationRecipes,
    inspirationRecipe,
    shuffleInspiration,
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
        contentContainerStyle={[
          {
            paddingBottom: layout.tabBar.contentBottomPadding,
            paddingTop: 0,
          },
          layout.contentContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header
          greetingKey={greetingKey}
          t={t}
          onSettings={() => {
            hapticLight();
            router.push('/settings');
          }}
        />

        <StatsCards
          recipesCount={totalCount}
          plannedMealsCount={plannedMealsCount}
          plannedMealsPercentage={plannedMealsPercentage}
          groceryItemsCount={groceryItemsCount}
          t={t}
        />

        <AddRecipeButton
          t={t}
          onPress={() => {
            hapticLight();
            router.push('/add-recipe');
          }}
        />

        <NextMealCard
          nextMeal={nextMeal}
          t={t}
          onPress={() =>
            nextMeal?.recipeId
              ? router.push(`/recipe/${nextMeal.recipeId}`)
              : router.push('/meal-plan')
          }
        />

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

const Header = ({
  greetingKey,
  t,
  onSettings,
}: {
  greetingKey: string;
  t: TFn;
  onSettings: () => void;
}) => (
  <View style={{ paddingHorizontal: 20, paddingTop: 44, paddingBottom: 16 }}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1 }}>
        <ScreenTitle
          variant="large"
          title={t(`home.${greetingKey}`)}
          subtitle={t('home.subtitle')}
        />
      </View>
      <AnimatedPressable
        onPress={onSettings}
        hoverScale={1.08}
        pressScale={0.95}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        }}
      >
        <Ionicons name="settings-outline" size={24} color={colors.white} />
      </AnimatedPressable>
    </View>
  </View>
);

const AddRecipeButton = ({ t, onPress }: { t: TFn; onPress: () => void }) => (
  <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
    <PrimaryButton
      onPress={onPress}
      icon="add-circle-outline"
      label={t('home.addRecipe.title')}
    />
  </View>
);

type NextMealType = ReturnType<typeof useHomeScreenData>['nextMeal'];

const NextMealCard = ({
  nextMeal,
  t,
  onPress,
}: {
  nextMeal: NextMealType;
  t: TFn;
  onPress: () => void;
}) => (
  <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
    <Text
      style={{
        fontSize: fontSize.xl,
        fontFamily: fontFamily.display,
        color: colors.white,
        marginBottom: 8,
        letterSpacing: letterSpacing.normal,
      }}
    >
      {t('home.nextUp.title')}
    </Text>

    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.01}
      pressScale={0.99}
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing['md-lg'],
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
      }}
    >
      <Image
        source={nextMeal?.imageUrl ? { uri: nextMeal.imageUrl } : HOMEPAGE_HERO}
        style={{ width: 72, height: 72, borderRadius: borderRadius.md }}
        contentFit="cover"
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        transition={200}
      />
      <View style={{ flex: 1, marginLeft: spacing['md-lg'] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing['xs-sm'],
          }}
        >
          {nextMeal && !nextMeal.isTomorrow && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.ai.primary,
                marginRight: spacing['xs-sm'],
              }}
            />
          )}
          <Text
            style={{
              fontSize: fontSize.sm,
              color:
                nextMeal && !nextMeal.isTomorrow
                  ? colors.content.body
                  : colors.content.secondary,
              fontFamily:
                nextMeal && !nextMeal.isTomorrow
                  ? fontFamily.bodySemibold
                  : fontFamily.body,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {nextMeal
              ? `${nextMeal.isTomorrow ? t('home.nextUp.tomorrow') : t('home.nextUp.today')} · ${t(`labels.mealTime.${nextMeal.mealType}`)}`
              : t('home.nextUp.noMealPlanned')}
          </Text>
        </View>
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fontFamily.bodySemibold,
            color: colors.content.body,
          }}
          numberOfLines={2}
        >
          {nextMeal?.title || t('home.nextUp.planYourNextMeal')}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.content.secondary}
      />
    </AnimatedPressable>
  </View>
);
