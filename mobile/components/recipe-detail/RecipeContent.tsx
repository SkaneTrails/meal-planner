import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontFamily, fontSize, letterSpacing } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import { showNotification } from '@/lib/alert';
import { RecipeInstructions } from './RecipeInstructions';
import { RecipeEnhancedInfo } from './RecipeEnhancedInfo';
import { OriginalEnhancedToggle } from './OriginalEnhancedToggle';
import { RecipeActionsFooter } from './RecipeActionsFooter';
import { DIET_LABELS } from './recipe-detail-constants';
import type { Recipe } from '@/lib/types';
import type { TFunction } from '@/lib/i18n';

interface RecipeContentProps {
  recipe: Recipe;
  totalTime: number | null;
  completedSteps: Set<number>;
  showAiChanges: boolean;
  showOriginal: boolean;
  canEdit: boolean;
  t: TFunction;
  onToggleStep: (index: number) => void;
  onToggleAiChanges: () => void;
  onToggleOriginal: () => void;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onShare: () => void;
}

export const RecipeContent = ({
  recipe,
  totalTime,
  completedSteps,
  showAiChanges,
  showOriginal,
  canEdit,
  t,
  onToggleStep,
  onToggleAiChanges,
  onToggleOriginal,
  onOpenEditModal,
  onShowPlanModal,
  onShare,
}: RecipeContentProps) => {
  const hasOriginal = Boolean(recipe.enhanced && recipe.original);
  const displayIngredients = useMemo(
    () => (showOriginal && recipe.original ? recipe.original.ingredients : recipe.ingredients),
    [showOriginal, recipe.original, recipe.ingredients],
  );
  const displayInstructions = useMemo(
    () => (showOriginal && recipe.original ? recipe.original.instructions : recipe.instructions),
    [showOriginal, recipe.original, recipe.instructions],
  );

  const displayRecipe = useMemo(
    () => (showOriginal && recipe.original
      ? { ...recipe, ingredients: displayIngredients, instructions: displayInstructions, structured_instructions: undefined }
      : recipe),
    [showOriginal, recipe, displayIngredients, displayInstructions],
  );

  return (
  <>
    {/* Action buttons row */}
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <AnimatedPressable
        onPress={canEdit ? onOpenEditModal : () => showNotification(t('recipe.cannotEdit'), t('recipe.cannotEditMessage'))}
        hoverScale={1.1}
        pressScale={0.9}
        disableAnimation={!canEdit}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canEdit ? 1 : 0.5,
        }}
      >
        <Ionicons name="create" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={onShowPlanModal}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="calendar" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={onShare}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="share" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
    </View>

    {/* Meta info (labels) */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm, alignItems: 'center' }}>
      {recipe.diet_label && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
        }}>
          <Text style={{ marginRight: spacing.xs, fontSize: fontSize.lg }}>{DIET_LABELS[recipe.diet_label].emoji}</Text>
          <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: DIET_LABELS[recipe.diet_label].color }}>
            {t(`labels.diet.${recipe.diet_label}` as 'labels.diet.veggie')}
          </Text>
        </View>
      )}
      {recipe.meal_label && (
        <View style={{ backgroundColor: colors.bgDark, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 }}>
          <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>
            {t(`labels.meal.${recipe.meal_label}` as 'labels.meal.meal')}
          </Text>
        </View>
      )}
    </View>

    {/* Time and servings - compact */}
    <View style={{
      flexDirection: 'row',
      marginTop: spacing.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    }}>
      {recipe.prep_time && (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="timer" size={18} color="#5D4037" />
          <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.prep')}</Text>
          <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
            {recipe.prep_time}m
          </Text>
        </View>
      )}
      {recipe.cook_time && (
        <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: recipe.prep_time ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
          <Ionicons name="flame" size={18} color="#5D4037" />
          <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.cook')}</Text>
          <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
            {recipe.cook_time}m
          </Text>
        </View>
      )}
      {totalTime && (
        <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time) ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
          <Ionicons name="time" size={18} color="#5D4037" />
          <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.total')}</Text>
          <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
            {totalTime}m
          </Text>
        </View>
      )}
      {recipe.servings && (
        <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time || totalTime) ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
          <Ionicons name="people" size={18} color="#5D4037" />
          <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.serves')}</Text>
          <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
            {recipe.servings}
          </Text>
        </View>
      )}
    </View>

    {/* Tags */}
    {recipe.tags.length > 0 && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: spacing.sm }}>
        {recipe.tags.map((tag) => (
          <View
            key={tag}
            style={{ backgroundColor: 'rgba(93, 64, 55, 0.65)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg }}
          >
            <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.bodySemibold, color: colors.white }}>#{tag}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Original / Enhanced toggle */}
    {hasOriginal && (
      <OriginalEnhancedToggle
        showOriginal={showOriginal}
        t={t}
        onToggle={onToggleOriginal}
      />
    )}

    {/* Ingredients */}
    <View style={{ marginTop: spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(93, 78, 64, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
          <Ionicons name="list" size={18} color="#5D4037" />
        </View>
        <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: '#3D3D3D', letterSpacing: letterSpacing.normal }}>
          {t('recipe.ingredients')}
        </Text>
      </View>
      {displayIngredients.length === 0 ? (
        <Text style={{ color: colors.gray[500], fontSize: fontSize.xl, fontStyle: 'italic' }}>{t('recipe.noIngredients')}</Text>
      ) : (
        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: borderRadius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
          {displayIngredients.map((ingredient, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: spacing.sm,
                borderBottomWidth: index < displayIngredients.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(139, 115, 85, 0.15)',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7, marginRight: spacing.md }} />
              <Text style={{ flex: 1, fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.text.inverse, lineHeight: 22 }}>
                {ingredient}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>

    <RecipeInstructions
      recipe={displayRecipe}
      completedSteps={completedSteps}
      t={t}
      onToggleStep={onToggleStep}
    />

    <RecipeEnhancedInfo
      recipe={recipe}
      showAiChanges={showAiChanges}
      t={t}
      onToggleAiChanges={onToggleAiChanges}
    />

    <RecipeActionsFooter
      url={recipe.url}
      t={t}
      onShowPlanModal={onShowPlanModal}
    />
  </>
  );
};
