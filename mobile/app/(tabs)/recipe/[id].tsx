/**
 * Recipe detail screen.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Pressable,
  Animated,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamily, fontSize } from '@/lib/theme';
import { MirroredBackground } from '@/components/MirroredBackground';
import { useRecipe, useMealPlan } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { formatDateLocal, getWeekDatesArray } from '@/lib/utils/dateFormatter';
import { BouncingLoader, GradientBackground } from '@/components';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import type { MealType } from '@/lib/types';
import { RecipeHero } from './RecipeHero';
import { RecipeContent } from './RecipeContent';
import { PlanMealModal } from './PlanMealModal';
import { EditRecipeModal } from './EditRecipeModal';
import { ImageUrlModal } from './ImageUrlModal';
import { useRecipeActions } from './useRecipeActions';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { isFavorite, toggleFavorite } = useSettings();
  const isRecipeFavorite = id ? isFavorite(id) : false;

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 350;

  const { data: recipe, isLoading, error } = useRecipe(id);

  const {
    canEdit, isSuperuser, households, isUpdatingImage, t,
    showPlanModal, setShowPlanModal,
    showEditModal, setShowEditModal,
    showUrlModal, setShowUrlModal,
    handlePickImage, saveImageUrl,
    handlePlanMeal, handleClearMeal,
    handleThumbUp, handleThumbDown,
    handleDelete, handleShare,
    handleSaveEdit, handleTransferRecipe,
  } = useRecipeActions(id, recipe);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDatesArray(weekOffset, 'saturday'), [weekOffset]);
  const { data: mealPlan } = useMealPlan();

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showAiChanges, setShowAiChanges] = useState(false);

  const toggleStep = (index: number) => {
    hapticSelection();
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getMealForSlot = (date: Date, mealType: MealType): string | null => {
    if (!mealPlan?.meals) return null;
    const dateStr = formatDateLocal(date);
    const key = `${dateStr}_${mealType}`;
    return mealPlan.meals[key] || null;
  };

  if (isLoading) {
    return (
      <GradientBackground style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 96,
          height: 96,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <BouncingLoader size={14} />
        </View>
        <Text style={{ color: colors.text.primary, fontSize: fontSize['2xl'], fontFamily: fontFamily.displayBold }}>{t('recipe.loading')}</Text>
      </GradientBackground>
    );
  }

  if (error || !recipe) {
    return (
      <GradientBackground style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View style={{
          width: 96,
          height: 96,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.primary} />
        </View>
        <Text style={{ color: colors.text.primary, fontSize: 32, fontFamily: fontFamily.displayBold, marginBottom: spacing.sm }}>{t('recipe.notFound')}</Text>
        <Text style={{ color: colors.text.secondary, fontSize: fontSize.lg, fontFamily: fontFamily.body, marginTop: spacing.sm, textAlign: 'center' }}>{t('recipe.notFoundMessage')}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingHorizontal: 28,
            paddingVertical: spacing.lg,
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.5)',
            borderRadius: 12,
          })}
        >
          <Text style={{ color: colors.text.primary, fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold }}>{t('common.goBack')}</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
                }}
              >
                <Ionicons
                  name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isRecipeFavorite ? colors.coral : colors.white}
                />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.white} />
              </Pressable>
            </View>
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
              canEdit={canEdit}
              t={t}
              onToggleStep={toggleStep}
              onToggleAiChanges={() => setShowAiChanges(!showAiChanges)}
              onOpenEditModal={() => setShowEditModal(true)}
              onShowPlanModal={() => setShowPlanModal(true)}
              onShare={handleShare}
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
