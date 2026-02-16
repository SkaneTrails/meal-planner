/**
 * Recipe detail screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { EnhancingOverlay, GradientBackground } from '@/components';
import { MirroredBackground } from '@/components/MirroredBackground';
import { EditRecipeModal } from '@/components/recipe-detail/EditRecipeModal';
import { ImageUrlModal } from '@/components/recipe-detail/ImageUrlModal';
import { PlanMealModal } from '@/components/recipe-detail/PlanMealModal';
import { RecipeContent } from '@/components/recipe-detail/RecipeContent';
import { RecipeHero } from '@/components/recipe-detail/RecipeHero';
import {
  RecipeLoading,
  RecipeNotFound,
} from '@/components/recipe-detail/RecipeLoadingStates';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { useMealPlan, useRecipe } from '@/lib/hooks';
import { useRecipeActions } from '@/lib/hooks/useRecipeActions';
import { useSettings } from '@/lib/settings-context';
import {
  circleStyle,
  colors,
  iconContainer,
  layout,
  spacing,
} from '@/lib/theme';
import type { MealType } from '@/lib/types';
import { formatDateLocal, getWeekDatesArray } from '@/lib/utils/dateFormatter';

const HEADER_BUTTON_BG = colors.surface.overlayMedium;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { isFavorite, toggleFavorite, weekStart, settings } = useSettings();
  const isRecipeFavorite = id ? isFavorite(id) : false;

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 350;

  const { data: recipe, isLoading, error } = useRecipe(id);

  const {
    isOwned,
    canEdit,
    canCopy,
    isCopying,
    isSuperuser,
    households,
    isUpdatingImage,
    isReviewingEnhancement,
    needsEnhancementReview,
    canEnhance,
    isEnhancing,
    t,
    showPlanModal,
    setShowPlanModal,
    showEditModal,
    setShowEditModal,
    showUrlModal,
    setShowUrlModal,
    handlePickImage,
    saveImageUrl,
    handlePlanMeal,
    handleClearMeal,
    handleThumbUp,
    handleThumbDown,
    handleShare,
    handleDelete,
    handleCopyRecipe,
    handleSaveEdit,
    handleTransferRecipe,
    handleReviewEnhancement,
    handleEnhanceRecipe,
  } = useRecipeActions(id, recipe);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(
    () => getWeekDatesArray(weekOffset, weekStart),
    [weekOffset, weekStart],
  );
  const { data: mealPlan } = useMealPlan();

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showAiChanges, setShowAiChanges] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (recipe?.enhanced !== true) return;
    setShowOriginal(recipe.show_enhanced === false);
  }, [recipe?.enhanced, recipe?.show_enhanced]);

  const toggleStep = (index: number) => {
    hapticSelection();
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getMealForSlot = (date: Date, mealType: MealType): string | null => {
    if (!mealPlan?.meals) return null;
    return mealPlan.meals[`${formatDateLocal(date)}_${mealType}`] || null;
  };

  if (isLoading) {
    return <RecipeLoading />;
  }

  if (error || !recipe) {
    return <RecipeNotFound t={t} onGoBack={() => router.back()} />;
  }

  const totalTime =
    recipe.total_time ||
    (recipe.prep_time && recipe.cook_time
      ? recipe.prep_time + recipe.cook_time
      : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerTintColor: colors.white,
          headerBackTitle: '',
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)/recipes')}
              style={{
                ...circleStyle(iconContainer.md),
                backgroundColor: HEADER_BUTTON_BG,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: spacing.sm,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => {
                hapticLight();
                if (id) toggleFavorite(id);
              }}
              style={{
                ...circleStyle(iconContainer.md),
                backgroundColor: HEADER_BUTTON_BG,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.sm,
              }}
            >
              <Ionicons
                name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isRecipeFavorite ? colors.coral : colors.white}
              />
            </Pressable>
          ),
        }}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <RecipeHero
          title={recipe.title}
          imageUrl={recipe.image_url}
          rating={recipe.rating}
          hidden={recipe.hidden}
          headerHeight={HEADER_HEIGHT}
          scrollY={scrollY}
          isUpdatingImage={isUpdatingImage}
          onPickImage={handlePickImage}
          onThumbUp={handleThumbUp}
          onThumbDown={handleThumbDown}
        />

        <MirroredBackground
          source={require('@/assets/images/background2.png')}
          tileCount={4}
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            flex: 1,
            width: '100%',
            minWidth: '100%',
            marginTop: -32,
          }}
          borderTopLeftRadius={32}
          borderTopRightRadius={32}
        >
          {/* Warm grey overlay matching other screens */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(235, 232, 228, 0.94)',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
          />
          <View
            style={[
              {
                padding: spacing.xl,
                paddingBottom: layout.tabBar.contentBottomPadding,
              },
              layout.contentContainer,
            ]}
          >
            <RecipeContent
              recipe={recipe}
              recipeId={id}
              totalTime={totalTime}
              completedSteps={completedSteps}
              showAiChanges={showAiChanges}
              showOriginal={showOriginal}
              isOwned={isOwned}
              canEdit={canEdit}
              canCopy={canCopy}
              isCopying={isCopying}
              canEnhance={canEnhance}
              isEnhancing={isEnhancing}
              aiEnabled={settings.aiEnabled}
              needsEnhancementReview={needsEnhancementReview}
              isReviewingEnhancement={isReviewingEnhancement}
              t={t}
              onToggleStep={toggleStep}
              onToggleAiChanges={() => setShowAiChanges(!showAiChanges)}
              onToggleOriginal={() => {
                hapticSelection();
                setShowOriginal(!showOriginal);
                setCompletedSteps(new Set());
              }}
              onOpenEditModal={() => setShowEditModal(true)}
              onShowPlanModal={() => setShowPlanModal(true)}
              onShare={handleShare}
              onCopy={handleCopyRecipe}
              onEnhance={handleEnhanceRecipe}
              onReviewEnhancement={handleReviewEnhancement}
            />
          </View>
        </MirroredBackground>
      </Animated.ScrollView>

      <PlanMealModal
        visible={showPlanModal}
        recipeTitle={recipe.title}
        weekDates={weekDates}
        weekOffset={weekOffset}
        language={settings.language}
        t={t}
        onClose={() => setShowPlanModal(false)}
        onSetWeekOffset={setWeekOffset}
        onPlanMeal={handlePlanMeal}
        onClearMeal={handleClearMeal}
        getMealForSlot={getMealForSlot}
      />

      {showEditModal && (
        <EditRecipeModal
          visible={showEditModal}
          recipe={recipe}
          isSuperuser={isSuperuser}
          households={households}
          t={t}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
          onTransferRecipe={handleTransferRecipe}
          onDelete={handleDelete}
        />
      )}

      <ImageUrlModal
        visible={showUrlModal}
        initialUrl={recipe.image_url || ''}
        t={t}
        onClose={() => setShowUrlModal(false)}
        onSave={saveImageUrl}
      />

      <EnhancingOverlay visible={isEnhancing} message={t('recipe.enhancing')} />
    </GradientBackground>
  );
}
