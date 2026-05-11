import { Text, View, type ViewStyle } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import type { IoniconName } from '@/components/ThemeIcon';
import { ThemeIcon } from '@/components/ThemeIcon';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  fontSize,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

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
  /** Use the AI accent fg instead of the regular content color. */
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
  const { visibility, colors, fonts, shadows } = useTheme();
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
            accentAi: true,
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
      {tiles.map((tile) => {
        const fg = tile.accentAi
          ? colors.tones.glassAi.fg
          : colors.content.body;
        return (
          <AnimatedPressable
            key={tile.key}
            onPress={tile.onPress}
            disabled={tile.disabled}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            hoverScale={1.02}
            pressScale={0.97}
            style={{
              ...tileStyle,
              backgroundColor: colors.card.bg,
              ...shadows.sm,
              ...(tile.dimmed ? { opacity: 0.5 } : null),
            }}
          >
            <ThemeIcon name={tile.icon} size={22} color={fg} />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.bodySemibold,
                fontSize: fontSize.xs,
                color: fg,
                letterSpacing: letterSpacing.wide,
                textTransform: 'uppercase',
                marginTop: spacing.xs,
              }}
            >
              {tile.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const rowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: spacing.sm,
  width: '100%',
};

const tileStyle: ViewStyle = {
  flex: 1,
  minWidth: 0,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xs,
  borderRadius: borderRadius.md,
};
