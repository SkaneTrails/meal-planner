import { useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Button } from '@/components/Button';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { borderRadius, spacing, useTheme } from '@/lib/theme';

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

type IconName = Parameters<typeof Button>[0]['icon'];

interface ActionTile {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
  /** When true, the AI accent tone is used (glassAi instead of glassSolid). */
  accentAi?: boolean;
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
  const { visibility, shadows } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  if (!visibility.showRecipeActionButtons) return null;
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;

  const tiles: ActionTile[] = [
    {
      key: 'edit',
      icon: 'create',
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
      icon: 'calendar',
      label: t('mealPlan.title'),
      onPress: onShowPlanModal,
    },
    ...(canCopy
      ? [
          {
            key: 'copy',
            icon: 'copy-outline' as IconName,
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
            icon: 'sparkles' as IconName,
            label: t('recipe.enhance'),
            accentAi: true,
            disabled: enhanceDisabled,
            dimmed: enhanceDisabled,
            onPress: onEnhance,
          },
        ]
      : []),
    {
      key: 'screen',
      icon: (keepScreenOn ? 'sunny' : 'sunny-outline') as IconName,
      label: t(keepScreenOn ? 'recipe.screenOnActive' : 'recipe.keepScreenOn'),
      onPress: onToggleKeepScreenOn,
    },
  ];

  return (
    <View style={rowStyle}>
      {tiles.map((tile) => (
        <Button
          key={tile.key}
          variant="text"
          tone={tile.accentAi ? 'glassAi' : 'glassSolid'}
          size="md"
          icon={tile.icon}
          label={compact ? undefined : tile.label}
          disabled={tile.disabled}
          onPress={tile.onPress}
          iconSize={18}
          style={{
            ...pillStyleBase,
            ...(compact ? compactPillExtra : null),
            ...shadows.sm,
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
};

const pillStyleBase: ViewStyle = {
  flex: 1,
  minWidth: 0,
  justifyContent: 'center',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  borderRadius: borderRadius.full,
};

const compactPillExtra: ViewStyle = {
  paddingHorizontal: spacing.xs,
};

/** Below this width, action pills collapse to icon-only (no labels). */
const COMPACT_BREAKPOINT = 480;
