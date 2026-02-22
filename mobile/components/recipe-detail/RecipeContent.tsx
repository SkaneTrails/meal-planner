import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ContentCard, Section } from '@/components';
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
  showOriginal: boolean;
  isOwned: boolean | undefined;
  canEdit: boolean;
  canCopy: boolean;
  isCopying: boolean;
  canEnhance: boolean;
  isEnhancing: boolean;
  aiEnabled: boolean;
  keepScreenOn: boolean;
  needsEnhancementReview: boolean;
  isReviewingEnhancement: boolean;
  t: TFunction;
  onToggleStep: (index: number) => void;
  onToggleOriginal: () => void;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onCopy: () => void;
  onEnhance: () => void;
  onToggleKeepScreenOn: () => void;
  onReviewEnhancement: (action: EnhancementReviewAction) => void;
}

type SectionKey =
  | 'header'
  | 'ingredients'
  | 'instructions'
  | 'tips'
  | 'aiChanges'
  | 'footer';

export const RecipeContent = ({
  recipe,
  recipeId,
  totalTime,
  completedSteps,
  showOriginal,
  isOwned,
  canEdit,
  canCopy,
  isCopying,
  canEnhance,
  isEnhancing,
  aiEnabled,
  keepScreenOn,
  needsEnhancementReview,
  isReviewingEnhancement,
  t,
  onToggleStep,
  onToggleOriginal,
  onOpenEditModal,
  onShowPlanModal,
  onCopy,
  onEnhance,
  onToggleKeepScreenOn,
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

  const { colors, fonts, chrome } = useTheme();

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    header: true,
    ingredients: true,
    instructions: true,
    tips: true,
    aiChanges: false,
    footer: true,
  });

  const toggle = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const actionSegments: FrameSegment[] | undefined =
    chrome === 'flat'
      ? [
          { label: '\u270e', onPress: onOpenEditModal },
          { label: '\u2261', onPress: onShowPlanModal },
        ]
      : undefined;

  const visibilityLabel =
    chrome === 'flat' && recipe.visibility
      ? t(
          `labels.visibility.${recipe.visibility === 'shared' ? 'shared' : 'private'}`,
        ).toUpperCase()
      : undefined;

  const hasTips = recipe.enhanced && !showOriginal && recipe.tips;
  const hasAiChanges =
    recipe.enhanced &&
    !showOriginal &&
    recipe.changes_made &&
    recipe.changes_made.length > 0;

  return (
    <View>
      {/* Title (flat chrome only — full chrome shows title in hero) */}
      {chrome === 'flat' && (
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

      {/* ── Card 1: Header (actions, time, tags, toggle) ── */}
      <ContentCard
        label={chrome === 'flat' ? 'INFO' : undefined}
        style={{ marginBottom: spacing.md }}
      >
        <Section
          title={t('recipe.details')}
          icon="information-circle"
          size="sm"
          collapsible
          expanded={expanded.header}
          onToggle={() => toggle('header')}
          spacing={0}
        >
          <RecipeActionButtons
            canEdit={canEdit}
            canCopy={canCopy}
            isCopying={isCopying}
            canEnhance={canEnhance}
            isEnhancing={isEnhancing}
            isOwned={isOwned}
            aiEnabled={aiEnabled}
            keepScreenOn={keepScreenOn}
            t={t}
            onOpenEditModal={onOpenEditModal}
            onShowPlanModal={onShowPlanModal}
            onCopy={onCopy}
            onEnhance={onEnhance}
            onToggleKeepScreenOn={onToggleKeepScreenOn}
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
        </Section>
      </ContentCard>

      {/* ── Card 2: Ingredients ── */}
      <ContentCard
        label={
          chrome === 'flat' ? t('recipe.ingredients').toUpperCase() : undefined
        }
        style={{ marginBottom: spacing.md }}
      >
        <RecipeIngredientsList
          ingredients={displayIngredients}
          t={t}
          collapsible
          expanded={expanded.ingredients}
          onToggle={() => toggle('ingredients')}
        />
      </ContentCard>

      {/* ── Card 3: Instructions ── */}
      <ContentCard
        label={
          chrome === 'flat' ? t('recipe.instructions').toUpperCase() : undefined
        }
        style={{ marginBottom: spacing.md }}
      >
        <RecipeInstructions
          recipe={displayRecipe}
          completedSteps={completedSteps}
          t={t}
          onToggleStep={onToggleStep}
          collapsible
          expanded={expanded.instructions}
          onToggle={() => toggle('instructions')}
        />
      </ContentCard>

      {/* ── Card 4: Tips ── */}
      {hasTips && (
        <ContentCard
          label={chrome === 'flat' ? t('recipe.tips').toUpperCase() : undefined}
          style={{ marginBottom: spacing.md }}
        >
          <RecipeEnhancedInfo
            recipe={recipe}
            showOriginal={showOriginal}
            t={t}
            section="tips"
            collapsible
            expanded={expanded.tips}
            onToggle={() => toggle('tips')}
          />
        </ContentCard>
      )}

      {/* ── Card 5: AI Enhancements ── */}
      {hasAiChanges && (
        <ContentCard
          label={
            chrome === 'flat'
              ? t('recipe.aiImprovements').toUpperCase()
              : undefined
          }
          style={{ marginBottom: spacing.md }}
        >
          <RecipeEnhancedInfo
            recipe={recipe}
            showOriginal={showOriginal}
            t={t}
            section="changes"
            collapsible
            expanded={expanded.aiChanges}
            onToggle={() => toggle('aiChanges')}
          />
        </ContentCard>
      )}

      {/* ── Card 6: Notes + Source + Plan ── */}
      <ContentCard
        label={chrome === 'flat' ? t('recipe.notes').toUpperCase() : undefined}
        style={{ marginBottom: spacing.md }}
      >
        <Section
          title={t('recipe.moreActions')}
          icon="ellipsis-horizontal-circle"
          size="sm"
          collapsible
          expanded={expanded.footer}
          onToggle={() => toggle('footer')}
          spacing={0}
        >
          <RecipeNotes
            recipeId={recipeId}
            isOwned={isOwned}
            canCopy={canCopy}
            t={t}
            onCopy={onCopy}
            embedded
          />

          <RecipeActionsFooter
            url={recipe.url}
            t={t}
            onShowPlanModal={onShowPlanModal}
          />
        </Section>
      </ContentCard>
    </View>
  );
};
