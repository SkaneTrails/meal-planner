import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { DropdownPicker } from '@/components/DropdownPicker';
import {
  fontSize,
  spacing,
  type ThemeDefinition,
  themes,
  useTheme,
} from '@/lib/theme';
import type { PickerSwatch } from '@/lib/theme/theme-context';

const THEME_ENTRIES = Object.entries(themes) as [string, ThemeDefinition][];

interface ThemePickerProps {
  currentTheme: string;
  onChangeTheme: (name: string) => void;
}

const SwatchColor = ({
  swatch,
  borderRadius,
  borderColor,
}: {
  swatch: Extract<PickerSwatch, { type: 'color' }>;
  borderRadius: number;
  borderColor: string;
}) => (
  <View
    style={{
      width: 28,
      height: 28,
      borderRadius,
      backgroundColor: swatch.value,
      marginRight: spacing.md,
      borderWidth: 1,
      borderColor,
    }}
  />
);

const SwatchText = ({
  swatch,
  fontFamily,
  color,
}: {
  swatch: Extract<PickerSwatch, { type: 'text' }>;
  fontFamily: string;
  color: string;
}) => (
  <Text
    style={{
      width: 28,
      fontSize: fontSize.lg,
      lineHeight: 28,
      textAlign: 'center',
      fontFamily,
      color,
      marginRight: spacing.md,
    }}
  >
    {swatch.label}
  </Text>
);

export const ThemePicker = ({
  currentTheme,
  onChangeTheme,
}: ThemePickerProps) => {
  const { colors, borderRadius, fonts } = useTheme();

  const options = useMemo(
    () =>
      THEME_ENTRIES.map(([key, definition]) => {
        const { pickerSwatch } = definition;
        const adornment =
          pickerSwatch.type === 'color' ? (
            <SwatchColor
              key={key}
              swatch={pickerSwatch}
              borderRadius={borderRadius.full}
              borderColor={colors.gray[200]}
            />
          ) : (
            <SwatchText
              key={key}
              swatch={pickerSwatch}
              fontFamily={fonts.body}
              color={colors.content.body}
            />
          );

        return { value: key, label: definition.name, adornment };
      }),
    [colors, borderRadius.full, fonts.body],
  );

  return (
    <DropdownPicker
      options={options}
      value={currentTheme}
      onSelect={onChangeTheme}
      testID="theme-picker"
    />
  );
};
