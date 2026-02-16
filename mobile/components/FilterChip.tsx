import type { ReactNode } from 'react';
import { Pressable, Text, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '@/lib/theme';

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
  activeColor = colors.content.body,
  activeTextColor = colors.white,
  inactiveTextColor = colors.content.body,
  inactiveBorderColor = colors.content.secondary,
  style,
  labelStyle,
}: FilterChipProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: selected
        ? activeColor
        : pressed
          ? `${activeColor}10`
          : 'transparent',
      borderWidth: 1.5,
      borderColor: selected ? activeColor : inactiveBorderColor,
      flexDirection: 'row',
      alignItems: 'center',
      gap: leading ? 6 : 0,
      ...style,
    })}
  >
    {leading}
    <Text
      style={{
        fontSize: 14,
        fontWeight: '600',
        color: selected ? activeTextColor : inactiveTextColor,
        ...labelStyle,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

export { FilterChip };
export type { FilterChipProps };
