import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  AnimatedPressable,
  Button,
  ContentCard,
  GradientBackground,
  HomeScreenSkeleton,
  TerminalFabBar,
  TerminalFrame,
} from '@/components';
import { InspirationSection } from '@/components/home/InspirationSection';
import { StatsCards } from '@/components/home/StatsCards';
import { ScreenTitle } from '@/components/ScreenTitle';
import { hapticLight } from '@/lib/haptics';
import { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import {
  fontSize,
  layout,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

const HOMEPAGE_HERO = require('@/assets/images/homepage-hero.png');
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

export default function HomeScreen() {
  const { colors } = useTheme();
  const data = useHomeScreenData();
  const {
    router,
    recipes,
    totalCount,
    isLoading,
    handleRefresh,
    greetingKey,
    t,
    groceryItemsCount,
    plannedMealsCount,
    plannedMealsPercentage,
    nextMeal,
    inspirationRecipes,
    inspirationRecipe,
    shuffleInspiration,
  } = data;

  if (isLoading && recipes.length === 0) {
    return (
      <GradientBackground animated>
        <HomeScreenSkeleton />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground animated>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
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
              router.push({
                pathname: '/(tabs)/recipes',
                params: { addRecipe: 'true' },
              });
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
      </View>
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
}) => {
  const { colors, borderRadius, shadows, chrome } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: layout.screenPaddingTop,
        paddingBottom: spacing.lg,
      }}
    >
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
        {chrome === 'flat' ? (
          <TerminalFabBar
            slots={[
              {
                key: 'settings',
                label: '\u2699',
                active: true,
                onPress: onSettings,
              },
            ]}
          />
        ) : (
          <Button
            variant="icon"
            onPress={onSettings}
            icon="settings-outline"
            iconSize={24}
            style={{
              width: 44,
              height: 44,
              borderRadius: borderRadius['lg-xl'],
              backgroundColor: colors.border,
              ...shadows.sm,
            }}
          />
        )}
      </View>
    </View>
  );
};

const AddRecipeButton = ({ t, onPress }: { t: TFn; onPress: () => void }) => {
  const { chrome, colors, fonts } = useTheme();

  if (chrome === 'flat') {
    return (
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <TerminalFrame variant="single">
          <AnimatedPressable
            onPress={onPress}
            hoverScale={1.01}
            pressScale={0.97}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.lg,
                fontFamily: fonts.bodySemibold,
                color: colors.primary,
              }}
            >
              + {t('home.addRecipe.title').toUpperCase()}
            </Text>
          </AnimatedPressable>
        </TerminalFrame>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
      <Button
        variant="primary"
        onPress={onPress}
        icon="add-circle-outline"
        label={t('home.addRecipe.title')}
      />
    </View>
  );
};

type NextMealType = ReturnType<typeof useHomeScreenData>['nextMeal'];

const NextMealCard = ({
  nextMeal,
  t,
  onPress,
}: {
  nextMeal: NextMealType;
  t: TFn;
  onPress: () => void;
}) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();

  const mealTimeLabel = nextMeal
    ? `${nextMeal.isTomorrow ? t('home.nextUp.tomorrow') : t('home.nextUp.today')} · ${t(`labels.mealTime.${nextMeal.mealType}`)}`
    : t('home.nextUp.noMealPlanned');

  const content = (
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.01}
      pressScale={0.99}
      style={{
        backgroundColor: colors.card.bg,
        borderRadius: borderRadius.md,
        padding: spacing['md-lg'],
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.card.borderColor,
      }}
    >
      <Image
        source={nextMeal?.imageUrl ? { uri: nextMeal.imageUrl } : HOMEPAGE_HERO}
        style={{
          width: 72,
          height: 72,
          borderRadius: borderRadius.md,
        }}
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
          {visibility.showTodayDot && nextMeal && !nextMeal.isTomorrow && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: borderRadius['2xs'],
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
                  ? fonts.bodySemibold
                  : fonts.body,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {mealTimeLabel}
          </Text>
        </View>
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fonts.bodySemibold,
            color: colors.content.body,
          }}
          numberOfLines={2}
        >
          {nextMeal?.title || t('home.nextUp.planYourNextMeal')}
        </Text>
      </View>
      {visibility.showChevrons && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.content.secondary}
        />
      )}
    </AnimatedPressable>
  );

  return (
    <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
      {!visibility.showFrameLabels && (
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fonts.display,
            color: colors.content.heading,
            marginBottom: spacing.sm,
            letterSpacing: letterSpacing.normal,
          }}
        >
          {t('home.nextUp.title')}
        </Text>
      )}
      <ContentCard card={false} label={t('home.nextUp.title').toUpperCase()}>
        {content}
      </ContentCard>
    </View>
  );
};
