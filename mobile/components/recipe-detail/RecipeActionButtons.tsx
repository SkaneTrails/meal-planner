import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { ThemeIcon } from '@/components/ThemeIcon';
import { showAlert } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  fontSize,
  letterSpacing,
  opacity,
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

type TileTone = 'glassSolid' | 'glassSubtle' | 'glassAi';

interface ActionTile {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
  tone: TileTone;
  disabled?: boolean;
  fadeWhenDisabled?: boolean;
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

  const tone = colors.tones.glassSolid;
  const aiFg = colors.tones.glassAi.fg;

  const tiles: ActionTile[] = [
    {
      key: 'edit',
      icon: 'create',
      label: t('recipe.edit'),
      tone: 'glassSolid',
      disabled: !canEdit,
      fadeWhenDisabled: true,
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
      tone: 'glassSolid',
      onPress: onShowPlanModal,
    },
    ...(canCopy
      ? [
          {
            key: 'copy',
            icon: 'copy-outline',
            label: t('recipe.copy'),
            tone: 'glassSolid' as const,
            disabled: isCopying,
            fadeWhenDisabled: true,
            onPress: onCopy,
          },
        ]
      : []),
    ...(canEnhance
      ? [
          {
            key: 'enhance',
            icon: 'sparkles',
            label: t('recipe.enhance'),
            tone: 'glassAi' as const,
            disabled: enhanceDisabled,
            fadeWhenDisabled: true,
            onPress: onEnhance,
          },
        ]
      : []),
    {
      key: 'screen',
      icon: keepScreenOn ? 'sunny' : 'sunny-outline',
      label: t(keepScreenOn ? 'recipe.screenOnActive' : 'recipe.keepScreenOn'),
      tone: keepScreenOn ? 'glassSolid' : 'glassSubtle',
      onPress: onToggleKeepScreenOn,
    },
  ];

  return (
    <View style={rowStyle}>
      {tiles.map((tile) => {
        // Unified background; only icon color differentiates the AI action.
        const fg = tile.tone === 'glassAi' ? aiFg : tone.fg;
        const dimmed = tile.fadeWhenDisabled && tile.disabled;
        return (
          <Pressable
            key={tile.key}
            onPress={tile.onPress}
            disabled={tile.disabled}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            style={({ pressed }) => [
              pillStyle,
              shadows.sm,
              {
                backgroundColor:
                  pressed && !tile.disabled ? tone.pressed : tone.bg,
              },
              dimmed
                ? { opacity: tile.key === 'enhance' ? opacity.disabled : 0.5 }
                : null,
            ]}
          >
            <ThemeIcon name={tile.icon as never} size={18} color={fg} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: fontSize.md,
                fontFamily: fonts.bodyMedium,
                color: fg,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {tile.label}
            </Text>
          </Pressable>
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

const pillStyle: ViewStyle = {
  flex: 1,
  minWidth: 0,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  borderRadius: borderRadius.full,
};
