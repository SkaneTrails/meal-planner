import { ButtonGroup, IconButton } from '@/components';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

interface RecipeActionButtonsProps {
  canEdit: boolean;
  canCopy: boolean;
  isCopying: boolean;
  canEnhance: boolean;
  isEnhancing: boolean;
  isOwned: boolean | undefined;
  aiEnabled: boolean;
  t: TFunction;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onShare: () => void;
  onCopy: () => void;
  onEnhance: () => void;
}

export const RecipeActionButtons = ({
  canEdit,
  canCopy,
  isCopying,
  canEnhance,
  isEnhancing,
  isOwned,
  aiEnabled,
  t,
  onOpenEditModal,
  onShowPlanModal,
  onShare,
  onCopy,
  onEnhance,
}: RecipeActionButtonsProps) => {
  const { colors, visibility } = useTheme();
  if (!visibility.showRecipeActionButtons) return null;
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;

  return (
    <ButtonGroup gap={8}>
      <IconButton
        icon="create"
        iconSize={20}
        onPress={
          canEdit
            ? onOpenEditModal
            : () =>
                showAlert(
                  t('recipe.cannotEdit'),
                  t('recipe.cannotEditMessage'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    ...(canCopy
                      ? [{ text: t('recipe.copy'), onPress: onCopy }]
                      : [{ text: t('common.ok') }]),
                  ],
                )
        }
        label={t('recipe.edit')}
        disabled={!canEdit}
        disableAnimation={!canEdit}
        tone="glassSolid"
        size="md"
        style={{ opacity: canEdit ? 1 : 0.5 }}
      />
      <IconButton
        icon="calendar"
        iconSize={20}
        onPress={onShowPlanModal}
        label={t('mealPlan.title')}
        tone="glassSolid"
        size="md"
      />
      <IconButton
        icon="share"
        iconSize={20}
        onPress={onShare}
        label={t('recipe.share')}
        tone="glassSolid"
        size="md"
      />
      {canCopy && (
        <IconButton
          icon="copy-outline"
          iconSize={20}
          onPress={onCopy}
          label={t('recipe.copy')}
          disabled={isCopying}
          tone="glassSolid"
          size="md"
          style={{ opacity: isCopying ? 0.5 : 1 }}
        />
      )}
      {canEnhance && (
        <IconButton
          icon="sparkles"
          iconSize={20}
          onPress={onEnhance}
          label={t('recipe.enhance')}
          disabled={enhanceDisabled}
          disableAnimation={enhanceDisabled}
          tone="glassSolid"
          textColor={enhanceDisabled ? colors.gray[400] : colors.ai.primary}
          size="md"
          style={{ opacity: enhanceDisabled ? 0.5 : 1 }}
        />
      )}
    </ButtonGroup>
  );
};
