import { View, type ViewStyle } from 'react-native';
import type { ButtonTone } from '@/components/Button';
import { Button } from '@/components/Button';
import type { IoniconName } from '@/components/ThemeIcon';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

interface RecipeActionButtonsProps {
  canEdit: boolean;
  canCopy: boolean;
  isCopying: boolean;
  canEnhance: boolean;
  isEnhancing: boolean;
  isOwned: boolean | undefined;
  aiEnabled: boolean;
  keepScreenOn: boolean;
  t: TFunction;
  onOpenEditModal: () => void;
  onShowPlanModal: () => void;
  onCopy: () => void;
  onEnhance: () => void;
  onToggleKeepScreenOn: () => void;
}

interface ActionTile {
  key: string;
  icon: IoniconName;
  label: string;
  onPress: () => void;
  /** Tone override — defaults to "glass". Use "glassAi" for AI-accented actions. */
  tone?: ButtonTone;
  disabled?: boolean;
  dimmed?: boolean;
}

export const RecipeActionButtons = ({
  canEdit,
  canCopy,
  isCopying,
  canEnhance,
  isEnhancing,
  isOwned,
  aiEnabled,
  keepScreenOn,
  t,
  onOpenEditModal,
  onShowPlanModal,
  onCopy,
  onEnhance,
  onToggleKeepScreenOn,
}: RecipeActionButtonsProps) => {
  const { visibility } = useTheme();
  if (!visibility.showRecipeActionButtons) return null;
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;

  const tiles: ActionTile[] = [
    {
      key: 'edit',
      icon: 'create-outline',
      label: t('recipe.edit'),
      // Not disabled — onPress shows an alert with copy option when uneditable.
      dimmed: !canEdit,
      onPress: canEdit
        ? onOpenEditModal
        : () =>
            showAlert(t('recipe.cannotEdit'), t('recipe.cannotEditMessage'), [
              { text: t('common.cancel'), style: 'cancel' },
              ...(canCopy
                ? [{ text: t('recipe.copy'), onPress: onCopy }]
                : [{ text: t('common.ok') }]),
            ]),
    },
    {
      key: 'plan',
      icon: 'calendar-outline',
      label: t('mealPlan.title'),
      onPress: onShowPlanModal,
    },
    ...(canCopy
      ? [
          {
            key: 'copy',
            icon: 'copy-outline' as IoniconName,
            label: t('recipe.copy'),
            disabled: isCopying,
            dimmed: isCopying,
            onPress: onCopy,
          },
        ]
      : []),
    ...(canEnhance
      ? [
          {
            key: 'enhance',
            icon: 'sparkles' as IoniconName,
            label: t('recipe.enhance'),
            tone: 'glassAi' as const,
            disabled: enhanceDisabled,
            dimmed: enhanceDisabled,
            onPress: onEnhance,
          },
        ]
      : []),
    {
      key: 'screen',
      icon: (keepScreenOn ? 'sunny' : 'sunny-outline') as IoniconName,
      label: t(keepScreenOn ? 'recipe.screenOnActive' : 'recipe.keepScreenOn'),
      onPress: onToggleKeepScreenOn,
    },
  ];

  return (
    <View style={rowStyle}>
      {tiles.map((tile) => (
        <Button
          key={tile.key}
          variant="primary"
          size="sm"
          tone={tile.tone ?? 'glass'}
          icon={tile.icon}
          label={tile.label}
          onPress={tile.onPress}
          disabled={tile.disabled}
          style={{
            flex: 1,
            minWidth: 0,
            ...(tile.dimmed ? { opacity: 0.5 } : null),
          }}
        />
      ))}
    </View>
  );
};

const rowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: spacing.sm,
  width: '100%',
  flexWrap: 'wrap',
};
