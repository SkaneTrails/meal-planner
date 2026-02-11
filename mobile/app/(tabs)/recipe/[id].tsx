/**
 * Recipe detail screen.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Pressable,
  Animated,
  Text,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontFamily, fontSize } from '@/lib/theme';
import { MirroredBackground } from '@/components/MirroredBackground';
import { useRecipe, useMealPlan } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { formatDateLocal, getWeekDatesArray } from '@/lib/utils/dateFormatter';
import { BouncingLoader, GradientBackground } from '@/components';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import type { MealType } from '@/lib/types';
import { RecipeHero } from '@/components/recipe-detail/RecipeHero';
import { RecipeContent } from '@/components/recipe-detail/RecipeContent';
import { PlanMealModal } from '@/components/recipe-detail/PlanMealModal';
import { EditRecipeModal } from '@/components/recipe-detail/EditRecipeModal';
import { ImageUrlModal } from '@/components/recipe-detail/ImageUrlModal';
import { useRecipeActions } from '@/lib/hooks/useRecipeActions';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { isFavorite, toggleFavorite } = useSettings();
  const isRecipeFavorite = id ? isFavorite(id) : false;

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 350;

  const { data: recipe, isLoading, error } = useRecipe(id);

  const {
    canEdit, isSuperuser, households, isUpdatingImage,
    isReviewingEnhancement, needsEnhancementReview,
    canEnhance, isEnhancing, t,
    showPlanModal, setShowPlanModal,
    showEditModal, setShowEditModal,
    showUrlModal, setShowUrlModal,
    handlePickImage, saveImageUrl,
    handlePlanMeal, handleClearMeal,
    handleThumbUp, handleThumbDown,
    handleShare, handleDelete,
    handleSaveEdit, handleTransferRecipe,
    handleReviewEnhancement,
    handleEnhanceRecipe,
  } = useRecipeActions(id, recipe);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDatesArray(weekOffset, 'saturday'), [weekOffset]);
  const { data: mealPlan } = useMealPlan();

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showAiChanges, setShowAiChanges] = useState(false);
  const [showOriginal, setShowOriginal] = useState(
    () => recipe?.enhanced === true && recipe?.show_enhanced === false && recipe?.enhancement_reviewed === true,
  );

  const toggleStep = (index: number) => {
    hapticSelection();
    setCompletedSteps(prev => {
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
    return (
      <GradientBackground structured style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 64, height: 64, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
          <BouncingLoader size={12} />
        </View>
      </GradientBackground>
    );
  }

  if (error || !recipe) {
    return (
      <GradientBackground structured style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}>
          <Ionicons name="alert-circle-outline" size={40} color="rgba(93, 78, 64, 0.6)" />
        </View>
        <Text style={{ color: '#3D3D3D', fontSize: fontSize['2xl'], fontFamily: fontFamily.displayBold, textAlign: 'center' }}>{t('recipe.notFound')}</Text>
        <Text style={{ color: 'rgba(93, 78, 64, 0.7)', fontSize: fontSize.md, fontFamily: fontFamily.body, marginTop: spacing.sm, textAlign: 'center' }}>{t('recipe.notFoundMessage')}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingHorizontal: 24,
            paddingVertical: spacing.md,
            backgroundColor: pressed ? 'rgba(122, 104, 88, 0.2)' : 'rgba(122, 104, 88, 0.12)',
            borderRadius: borderRadius.sm,
          })}
        >
          <Text style={{ color: '#5D4E40', fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold }}>{t('common.goBack')}</Text>
        </Pressable>
      </GradientBackground>
    );
  }

  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
          { useNativeDriver: true }
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
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(235, 232, 228, 0.94)',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }} />
          <View style={{
            padding: spacing.xl,
            paddingBottom: 140,
            maxWidth: 720,
            alignSelf: 'center',
            width: '100%',
          }}>
            <RecipeContent
              recipe={recipe}
              totalTime={totalTime}
              completedSteps={completedSteps}
              showAiChanges={showAiChanges}
              showOriginal={showOriginal}
              canEdit={canEdit}
              canEnhance={canEnhance}
              isEnhancing={isEnhancing}
              needsEnhancementReview={needsEnhancementReview}
              isReviewingEnhancement={isReviewingEnhancement}
              t={t}
              onToggleStep={toggleStep}
              onToggleAiChanges={() => setShowAiChanges(!showAiChanges)}
              onToggleOriginal={() => { hapticSelection(); setShowOriginal(!showOriginal); setCompletedSteps(new Set()); }}
              onOpenEditModal={() => setShowEditModal(true)}
              onShowPlanModal={() => setShowPlanModal(true)}
              onShare={handleShare}
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
    </GradientBackground>
  );
}
