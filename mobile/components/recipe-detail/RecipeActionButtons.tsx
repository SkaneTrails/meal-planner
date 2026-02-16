import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { circleStyle, colors, iconContainer } from '@/lib/theme';

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

const actionButtonStyle = {
  ...circleStyle(iconContainer.md),
  backgroundColor: colors.glass.solid,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

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
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <AnimatedPressable
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
        hoverScale={1.1}
        pressScale={0.9}
        disableAnimation={!canEdit}
        style={{ ...actionButtonStyle, opacity: canEdit ? 1 : 0.5 }}
      >
        <Ionicons name="create" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={onShowPlanModal}
        hoverScale={1.1}
        pressScale={0.9}
        style={actionButtonStyle}
      >
        <Ionicons name="calendar" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={onShare}
        hoverScale={1.1}
        pressScale={0.9}
        style={actionButtonStyle}
      >
        <Ionicons name="share" size={20} color={colors.text.inverse} />
      </AnimatedPressable>
      {canCopy && (
        <AnimatedPressable
          onPress={onCopy}
          hoverScale={1.1}
          pressScale={0.9}
          disabled={isCopying}
          style={{
            ...actionButtonStyle,
            opacity: isCopying ? 0.5 : 1,
          }}
        >
          <Ionicons name="copy-outline" size={20} color={colors.text.inverse} />
        </AnimatedPressable>
      )}
      {canEnhance && (
        <AnimatedPressable
          onPress={onEnhance}
          hoverScale={1.1}
          pressScale={0.9}
          disabled={isEnhancing}
          disableAnimation={enhanceDisabled}
          style={{
            ...actionButtonStyle,
            opacity: enhanceDisabled ? 0.5 : 1,
          }}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={enhanceDisabled ? colors.gray[400] : colors.ai.primary}
          />
        </AnimatedPressable>
      )}
    </View>
  );
};
