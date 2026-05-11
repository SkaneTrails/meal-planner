import { RefreshControl, ScrollView, View } from 'react-native';
import { HomeScreenSkeleton, IconButton, ScreenLayout } from '@/components';
import { HeroNextMeal } from '@/components/home/HeroNextMeal';
import { InspirationSection } from '@/components/home/InspirationSection';
import { WeekStrip } from '@/components/home/WeekStrip';
import { ScreenTitle } from '@/components/ScreenTitle';
import { hapticLight } from '@/lib/haptics';
import { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { layout, spacing, useTheme } from '@/lib/theme';

export default function HomeScreen() {
  const { colors, shadows } = useTheme();
  const {
    router,
    recipes,
    isLoading,
    handleRefresh,
    t,
    nextMeal,
    mealPlan,
    weekStart,
    inspirationRecipes,
    inspirationRecipe,
    shuffleInspiration,
  } = useHomeScreenData();

  if (isLoading && recipes.length === 0) {
    return (
      <ScreenLayout animated>
        <HomeScreenSkeleton />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout animated>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: layout.screenPaddingTop,
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.lg,
          }}
        >
          <ScreenTitle
            title={t('signIn.appName')}
            subtitle={t('home.subtitle')}
            variant="large"
            style={{ flex: 1 }}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <IconButton
              onPress={() => {
                hapticLight();
                router.push({
                  pathname: '/(tabs)/recipes',
                  params: { addRecipe: 'true' },
                });
              }}
              icon="add"
              size={40}
              iconSize={20}
              color={colors.card.bg}
              textColor={colors.content.body}
              style={shadows.sm}
            />
            <IconButton
              onPress={() => {
                hapticLight();
                router.push('/settings');
              }}
              icon="settings-outline"
              size={40}
              iconSize={20}
              color={colors.card.bg}
              textColor={colors.content.body}
              style={shadows.sm}
            />
          </View>
        </View>

        <HeroNextMeal
          nextMeal={nextMeal}
          t={t}
          onPress={() =>
            nextMeal?.recipeId
              ? router.push(`/recipe/${nextMeal.recipeId}`)
              : router.push('/meal-plan')
          }
        />

        <WeekStrip mealPlan={mealPlan} weekStart={weekStart} t={t} />

        <InspirationSection
          inspirationRecipes={inspirationRecipes}
          inspirationRecipe={inspirationRecipe}
          shuffleInspiration={shuffleInspiration}
          t={t}
        />
      </ScrollView>
    </ScreenLayout>
  );
}
