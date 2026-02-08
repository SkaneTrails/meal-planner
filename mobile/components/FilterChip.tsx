import { Text, Pressable, type ViewStyle, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading content (emoji text or icon element) */
  leading?: ReactNode;
  /** Active background color. Default: '#5D4E40' */
  activeColor?: string;
  /** Active text color. Default: '#fff' */
  activeTextColor?: string;
  /** Inactive text color. Default: '#5D4E40' */
  inactiveTextColor?: string;
  /** Inactive border color. Default: '#8B7355' */
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
 * - **Diet filter chips** (recipes.tsx): per-category colors, emoji leading
 * - **Edit modal chips** (recipe/[id].tsx): theme-color active, emoji/text labels
 * - **Note tag chips** (meal-plan.tsx): muted palette, text-only
 *
 * For layout, wrap chips in a ScrollView (horizontal) or View (flexWrap).
 */
const FilterChip = ({
  label,
  selected,
  onPress,
  leading,
  activeColor = '#5D4E40',
  activeTextColor = '#fff',
  inactiveTextColor = '#5D4E40',
  inactiveBorderColor = '#8B7355',
  style,
  labelStyle,
}: FilterChipProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: selected ? activeColor : pressed ? `${activeColor}10` : 'transparent',
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
