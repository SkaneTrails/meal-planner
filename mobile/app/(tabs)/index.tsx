import { RefreshControl, ScrollView, View } from 'react-native';
import { HomeScreenSkeleton, IconButton, ScreenLayout } from '@/components';
import { HeroNextMeal } from '@/components/home/HeroNextMeal';
import { InspirationSection } from '@/components/home/InspirationSection';
import { WeekStrip } from '@/components/home/WeekStrip';
import { hapticLight } from '@/lib/haptics';
import { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { layout, spacing, useTheme } from '@/lib/theme';

export default function HomeScreen() {
  const { colors } = useTheme();
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
        <TopBar
          onAdd={() => {
            hapticLight();
            router.push({
              pathname: '/(tabs)/recipes',
              params: { addRecipe: 'true' },
            });
          }}
          onSettings={() => {
            hapticLight();
            router.push('/settings');
          }}
        />

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

/**
 * Bare top bar with the only two header actions: add recipe + settings.
 * No greeting, no title — the hero IS the title.
 */
const TopBar = ({
  onAdd,
  onSettings,
}: {
  onAdd: () => void;
  onSettings: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
      }}
    >
      <IconButton
        onPress={onAdd}
        icon="add"
        size={44}
        iconSize={22}
        textColor={colors.content.heading}
      />
      <IconButton
        onPress={onSettings}
        icon="settings-outline"
        size={44}
        iconSize={22}
        textColor={colors.content.heading}
      />
    </View>
  );
};
