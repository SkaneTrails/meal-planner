import {
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
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

interface ActionTile {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
  /** When true, the AI accent color is used for the icon. */
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
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  if (!visibility.showRecipeActionButtons) return null;
  const enhanceDisabled = isEnhancing || !aiEnabled || !isOwned;

  const tone = colors.tones.glassSolid;
  const aiFg = colors.tones.glassAi.fg;

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
            icon: 'copy-outline',
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
            icon: 'sparkles',
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
      icon: keepScreenOn ? 'sunny' : 'sunny-outline',
      label: t(keepScreenOn ? 'recipe.screenOnActive' : 'recipe.keepScreenOn'),
      onPress: onToggleKeepScreenOn,
    },
  ];

  return (
    <View style={rowStyle}>
      {tiles.map((tile) => {
        const fg = tile.accentAi ? aiFg : tone.fg;
        return (
          <Pressable
            key={tile.key}
            onPress={tile.onPress}
            disabled={tile.disabled}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            style={({ pressed }) => [
              pillStyle,
              compact ? compactPillStyle : null,
              shadows.sm,
              {
                backgroundColor:
                  pressed && !tile.disabled ? tone.pressed : tone.bg,
              },
              tile.dimmed ? { opacity: opacity.disabled } : null,
            ]}
          >
            <ThemeIcon name={tile.icon as never} size={18} color={fg} />
            {!compact && (
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
            )}
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

const compactPillStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  gap: 0,
};

/** Below this width, action pills collapse to icon-only (no labels). */
const COMPACT_BREAKPOINT = 480;
