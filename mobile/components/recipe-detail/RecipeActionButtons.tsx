import { Button, ButtonGroup } from '@/components';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { iconContainer, useTheme } from '@/lib/theme';

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
  const { colors, circleStyle } = useTheme();
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;
  const iconBtnSize = iconContainer.md;

  return (
    <ButtonGroup gap={8}>
      <Button
        variant="icon"
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
        color={colors.glass.solid}
        textColor={colors.text.inverse}
        style={{
          ...circleStyle(iconBtnSize),
          opacity: canEdit ? 1 : 0.5,
        }}
      />
      <Button
        variant="icon"
        icon="calendar"
        iconSize={20}
        onPress={onShowPlanModal}
        label={t('mealPlan.title')}
        color={colors.glass.solid}
        textColor={colors.text.inverse}
        style={circleStyle(iconBtnSize)}
      />
      <Button
        variant="icon"
        icon="share"
        iconSize={20}
        onPress={onShare}
        label={t('recipe.share')}
        color={colors.glass.solid}
        textColor={colors.text.inverse}
        style={circleStyle(iconBtnSize)}
      />
      {canCopy && (
        <Button
          variant="icon"
          icon="copy-outline"
          iconSize={20}
          onPress={onCopy}
          label={t('recipe.copy')}
          disabled={isCopying}
          color={colors.glass.solid}
          textColor={colors.text.inverse}
          style={{
            ...circleStyle(iconBtnSize),
            opacity: isCopying ? 0.5 : 1,
          }}
        />
      )}
      {canEnhance && (
        <Button
          variant="icon"
          icon="sparkles"
          iconSize={20}
          onPress={onEnhance}
          label={t('recipe.enhance')}
          disabled={enhanceDisabled}
          disableAnimation={enhanceDisabled}
          color={colors.glass.solid}
          textColor={enhanceDisabled ? colors.gray[400] : colors.ai.primary}
          style={{
            ...circleStyle(iconBtnSize),
            opacity: enhanceDisabled ? 0.5 : 1,
          }}
        />
      )}
    </ButtonGroup>
  );
};
