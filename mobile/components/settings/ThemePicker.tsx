import { useMemo } from 'react';
import { View } from 'react-native';
import { DropdownPicker } from '@/components/DropdownPicker';
import { spacing, type ThemeDefinition, themes, useTheme } from '@/lib/theme';

const THEME_ENTRIES = Object.entries(themes) as [string, ThemeDefinition][];

interface ThemePickerProps {
  currentTheme: string;
  onChangeTheme: (name: string) => void;
}

export const ThemePicker = ({
  currentTheme,
  onChangeTheme,
}: ThemePickerProps) => {
  const { colors, borderRadius } = useTheme();

  const options = useMemo(
    () =>
      THEME_ENTRIES.map(([key, definition]) => ({
        value: key,
        label: definition.name,
        adornment: (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: borderRadius.full,
              backgroundColor: definition.colors.primary,
              marginRight: spacing.md,
              borderWidth: 1,
              borderColor: colors.gray[200],
            }}
          />
        ),
      })),
    [colors.gray[200], borderRadius.full],
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
