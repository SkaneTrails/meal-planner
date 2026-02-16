import { useMemo } from 'react';
import type { TFunction } from '@/lib/i18n';
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

  return (
    <>
      <RecipeActionButtons
        canEdit={canEdit}
        canCopy={canCopy}
        isCopying={isCopying}
        canEnhance={canEnhance}
        isEnhancing={isEnhancing}
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

      <RecipeNotes recipeId={recipeId} t={t} />

      <RecipeActionsFooter
        url={recipe.url}
        t={t}
        onShowPlanModal={onShowPlanModal}
      />
    </>
  );
};
