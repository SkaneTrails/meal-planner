import { Pressable, Text, View } from 'react-native';
import {
  borderRadius,
  dotSize,
  fontSize,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

interface ChipOption<T> {
  value: T;
  labelKey: string;
  dotColor?: string | null;
}

interface ChipPickerProps<T> {
  label: string;
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  /** Translate function — receives labelKey, returns display string */
  t: (key: string) => string;
  /**
   * Inactive chip appearance:
   * - `'glass'` — glass card bg, glass border (default, for screens)
   * - `'solid'` — gray-50 bg, darker border (for modals)
   */
  variant?: 'glass' | 'solid';
}

/**
 * Labeled section with a flexWrap chip grid for single-select pickers.
 *
 * Used for diet type and meal type selection in review-recipe and EditRecipeModal.
 * For horizontal scrolling filter bars, use `FilterChip` instead.
 */
const ChipPicker = <T,>({
  label,
  options,
  selected,
  onSelect,
  t,
  variant = 'glass',
}: ChipPickerProps<T>) => {
  const { colors, fonts } = useTheme();
  const isGlass = variant === 'glass';
  const inactiveBg = isGlass ? colors.glass.card : colors.gray[50];
  const inactiveBorder = isGlass ? colors.glass.border : colors.bgDark;

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fonts.bodySemibold,
          color: colors.gray[500],
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: letterSpacing.wide,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map(({ value, labelKey, dotColor }) => {
          const isSelected = selected === value;
          return (
            <Pressable
              key={labelKey}
              onPress={() => onSelect(value)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isSelected
                  ? colors.primary
                  : pressed
                    ? colors.bgMid
                    : inactiveBg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : inactiveBorder,
                gap: spacing.xs,
              })}
            >
              {dotColor != null && (
                <View
                  style={{
                    width: dotSize.md,
                    height: dotSize.md,
                    borderRadius: dotSize.md / 2,
                    backgroundColor: isSelected ? colors.white : dotColor,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontFamily: fonts.bodyMedium,
                  color: isSelected ? colors.white : colors.text.inverse,
                }}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export { ChipPicker };
export type { ChipOption, ChipPickerProps };
