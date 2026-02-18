import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { FrameSegment } from '@/components/TerminalFrame';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';
import type { EnhancementReviewAction, Recipe } from '@/lib/types';
import { EnhancementReviewBanner } from './EnhancementReviewBanner';
import { OriginalEnhancedToggle } from './OriginalEnhancedToggle';
import { RecipeActionButtons } from './RecipeActionButtons';
import { RecipeActionsFooter } from './RecipeActionsFooter';
import { RecipeEnhancedInfo } from './RecipeEnhancedInfo';
import { RecipeIngredientsList } from './RecipeIngredientsList';
import { RecipeInstructions } from './RecipeInstructions';
import { RecipeMetaLabels } from './RecipeMetaLabels';
import { RecipeNotes } from './RecipeNotes';
import { RecipeTags } from './RecipeTags';
import { RecipeTimeServings } from './RecipeTimeServings';

interface RecipeContentProps {
  recipe: Recipe;
  recipeId: string;
  totalTime: number | null;
  completedSteps: Set<number>;
  showAiChanges: boolean;
  showOriginal: boolean;
  isOwned: boolean | undefined;
  canEdit: boolean;
  canCopy: boolean;
  isCopying: boolean;
  canEnhance: boolean;
  isEnhancing: boolean;
  aiEnabled: boolean;
  needsEnhancementReview: boolean;
  isReviewingEnhancement: boolean;
  t: TFunction;
  onToggleStep: (index: number) => void;
  onToggleAiChanges: () => void;
  onToggleOriginal: () => void;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onShare: () => void;
  onCopy: () => void;
  onEnhance: () => void;
  onReviewEnhancement: (action: EnhancementReviewAction) => void;
}

export const RecipeContent = ({
  recipe,
  recipeId,
  totalTime,
  completedSteps,
  showAiChanges,
  showOriginal,
  isOwned,
  canEdit,
  canCopy,
  isCopying,
  canEnhance,
  isEnhancing,
  aiEnabled,
  needsEnhancementReview,
  isReviewingEnhancement,
  t,
  onToggleStep,
  onToggleAiChanges,
  onToggleOriginal,
  onOpenEditModal,
  onShowPlanModal,
  onShare,
  onCopy,
  onEnhance,
  onReviewEnhancement,
}: RecipeContentProps) => {
  const hasOriginal = Boolean(recipe.enhanced && recipe.original);
  const displayIngredients = useMemo(
    () =>
      showOriginal && recipe.original
        ? recipe.original.ingredients
        : recipe.ingredients,
    [showOriginal, recipe.original, recipe.ingredients],
  );
  const displayInstructions = useMemo(
    () =>
      showOriginal && recipe.original
        ? recipe.original.instructions
        : recipe.instructions,
    [showOriginal, recipe.original, recipe.instructions],
  );

  const displayRecipe = useMemo(
    () =>
      showOriginal && recipe.original
        ? {
            ...recipe,
            ingredients: displayIngredients,
            instructions: displayInstructions,
            structured_instructions: undefined,
          }
        : recipe,
    [showOriginal, recipe, displayIngredients, displayInstructions],
  );

  const { colors, fonts, crt } = useTheme();

  const actionSegments: FrameSegment[] | undefined = crt
    ? [
        { label: '\u270e', onPress: onOpenEditModal },
        { label: '\u2261', onPress: onShowPlanModal },
        { label: '\u2197', onPress: onShare },
      ]
    : undefined;

  const visibilityLabel =
    crt && recipe.visibility
      ? t(
          `labels.visibility.${recipe.visibility === 'shared' ? 'shared' : 'private'}`,
        ).toUpperCase()
      : undefined;

  return (
    <>
      {crt && (
        <Text
          style={{
            fontSize: fontSize['4xl'],
            fontFamily: fonts.display,
            color: colors.primary,
            letterSpacing: letterSpacing.tight,
            marginBottom: spacing.sm,
          }}
        >
          {recipe.title}
        </Text>
      )}

      <RecipeActionButtons
        canEdit={canEdit}
        canCopy={canCopy}
        isCopying={isCopying}
        canEnhance={canEnhance}
        isEnhancing={isEnhancing}
        isOwned={isOwned}
        aiEnabled={aiEnabled}
        t={t}
        onOpenEditModal={onOpenEditModal}
        onShowPlanModal={onShowPlanModal}
        onShare={onShare}
        onCopy={onCopy}
        onEnhance={onEnhance}
      />

      <RecipeMetaLabels recipe={recipe} t={t} />

      <RecipeTimeServings
        prepTime={recipe.prep_time}
        cookTime={recipe.cook_time}
        totalTime={totalTime}
        servings={recipe.servings}
        tags={recipe.tags}
        actionSegments={actionSegments}
        visibilityLabel={visibilityLabel}
        t={t}
      />

      <RecipeTags tags={recipe.tags} />

      {hasOriginal && (
        <OriginalEnhancedToggle
          showOriginal={showOriginal}
          t={t}
          onToggle={onToggleOriginal}
        />
      )}

      {needsEnhancementReview && (
        <EnhancementReviewBanner
          t={t}
          isSubmitting={isReviewingEnhancement}
          onApprove={() => onReviewEnhancement('approve')}
          onReject={() => onReviewEnhancement('reject')}
        />
      )}

      <RecipeIngredientsList ingredients={displayIngredients} t={t} />

      <RecipeInstructions
        recipe={displayRecipe}
        completedSteps={completedSteps}
        t={t}
        onToggleStep={onToggleStep}
      />

      <RecipeEnhancedInfo
        recipe={recipe}
        showOriginal={showOriginal}
        showAiChanges={showAiChanges}
        t={t}
        onToggleAiChanges={onToggleAiChanges}
      />

      <RecipeNotes
        recipeId={recipeId}
        isOwned={isOwned}
        canCopy={canCopy}
        t={t}
        onCopy={onCopy}
      />

      <RecipeActionsFooter
        url={recipe.url}
        t={t}
        onShowPlanModal={onShowPlanModal}
      />
    </>
  );
};
