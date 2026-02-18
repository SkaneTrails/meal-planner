import type { ReactNode } from 'react';
import { Pressable, Text, type TextStyle, type ViewStyle } from 'react-native';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading content (colored dot or icon element) */
  leading?: ReactNode;
  /** Active background color. Default: colors.content.body */
  activeColor?: string;
  /** Active text color. Default: '#fff' */
  activeTextColor?: string;
  /** Inactive text color. Default: colors.content.body */
  inactiveTextColor?: string;
  /** Inactive border color. Default: colors.content.secondary */
  inactiveBorderColor?: string;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional label text styles */
  labelStyle?: TextStyle;
}

/**
 * Reusable filter chip with active/inactive toggle styling.
 *
 * Supports three visual patterns found across the app:
 * - **Diet filter chips** (recipes.tsx): per-category colors, colored dot leading
 * - **Edit modal chips** (recipe/[id].tsx): theme-color active, text labels
 * - **Note tag chips** (meal-plan.tsx): muted palette, colored dot + text
 *
 * For layout, wrap chips in a ScrollView (horizontal) or View (flexWrap).
 */
const FilterChip = ({
  label,
  selected,
  onPress,
  leading,
  activeColor: activeColorProp,
  activeTextColor: activeTextColorProp,
  inactiveTextColor: inactiveTextColorProp,
  inactiveBorderColor: inactiveBorderColorProp,
  style,
  labelStyle,
}: FilterChipProps) => {
  const { colors, borderRadius } = useTheme();
  const activeColor = activeColorProp ?? colors.content.body;
  const activeTextColor = activeTextColorProp ?? colors.white;
  const inactiveTextColor = inactiveTextColorProp ?? colors.content.body;
  const inactiveBorderColor =
    inactiveBorderColorProp ?? colors.content.secondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: selected
          ? activeColor
          : pressed
            ? `${activeColor}10` // Dynamic prop color — cannot use static token
            : 'transparent',
        borderWidth: 1.5,
        borderColor: selected ? activeColor : inactiveBorderColor,
        flexDirection: 'row',
        alignItems: 'center',
        gap: leading ? spacing.xs : 0,
        ...style,
      })}
    >
      {leading}
      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
          color: selected ? activeTextColor : inactiveTextColor,
          ...labelStyle,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export { FilterChip };
export type { FilterChipProps };
