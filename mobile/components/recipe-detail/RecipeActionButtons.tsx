import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { showNotification } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { colors } from '@/lib/theme';

interface RecipeActionButtonsProps {
  canEdit: boolean;
  canEnhance: boolean;
  isEnhancing: boolean;
  aiEnabled: boolean;
  t: TFunction;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onShare: () => void;
  onEnhance: () => void;
}

const actionButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.glass.solid,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export const RecipeActionButtons = ({
  canEdit,
  canEnhance,
  isEnhancing,
  aiEnabled,
  t,
  onOpenEditModal,
  onShowPlanModal,
  onShare,
  onEnhance,
}: RecipeActionButtonsProps) => (
  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
    <AnimatedPressable
      onPress={
        canEdit
          ? onOpenEditModal
          : () =>
              showNotification(
                t('recipe.cannotEdit'),
                t('recipe.cannotEditMessage'),
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
    {canEnhance && (
      <AnimatedPressable
        onPress={
          aiEnabled
            ? onEnhance
            : () =>
                showNotification(
                  t('recipe.enhanceRecipe'),
                  t('common.aiDisabledHint'),
                )
        }
        hoverScale={1.1}
        pressScale={0.9}
        disabled={isEnhancing}
        style={{
          ...actionButtonStyle,
          opacity: isEnhancing || !aiEnabled ? 0.5 : 1,
        }}
      >
        <Ionicons
          name="sparkles"
          size={20}
          color={
            !aiEnabled
              ? colors.gray[400]
              : isEnhancing
                ? colors.gray[400]
                : colors.ai.primary
          }
        />
      </AnimatedPressable>
    )}
  </View>
);
