/**
 * Theme-aware toggle that renders a native Switch or an ASCII [X]/[ ] toggle
 * depending on the active theme's font family.
 */

import { Pressable, Switch, Text } from 'react-native';
import { fontSize, spacing, terminalFontFamily, useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ThemeToggle = ({
  value,
  onValueChange,
  disabled = false,
}: ThemeToggleProps) => {
  const { colors, fonts } = useTheme();
  const isTerminal = fonts === terminalFontFamily;

  if (!isTerminal) {
    return (
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    );
  }

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ padding: spacing.xs }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.lg,
          color: disabled
            ? colors.content.placeholder
            : value
              ? colors.primary
              : colors.content.secondary,
        }}
      >
        {value ? '[X]' : '[ ]'}
      </Text>
    </Pressable>
  );
};
