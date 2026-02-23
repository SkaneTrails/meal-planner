/**
 * Theme-aware text input.
 *
 * Applies color, font, border-radius, and opacity tokens from the active theme.
 * Renders a plain bordered input for elegant/bubblegum themes, and a minimal
 * flat input for the terminal theme (no background, green-on-black text).
 *
 * Use this anywhere a single-line text input is needed in settings or forms
 * instead of the raw RN TextInput to keep styling consistent across all themes.
 */

import type { StyleProp, TextStyle } from 'react-native';
import { TextInput } from 'react-native';
import { fontSize, opacity, spacing, useTheme } from '@/lib/theme';

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  /** Additional styles merged onto the input. */
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export const ThemedTextInput = ({
  value,
  onChangeText,
  placeholder,
  disabled = false,
  maxLength,
  style,
  testID,
}: ThemedTextInputProps) => {
  const { colors, fonts, borderRadius, chrome } = useTheme();

  const isFlat = chrome === 'flat';

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={!disabled}
      placeholder={placeholder}
      placeholderTextColor={colors.input.placeholder}
      maxLength={maxLength}
      testID={testID}
      style={[
        {
          flex: 1,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          fontSize: fontSize.sm,
          fontFamily: fonts.body,
          color: colors.input.text,
          backgroundColor: isFlat ? 'transparent' : colors.input.bg,
          borderRadius: isFlat ? 0 : borderRadius.md,
          borderWidth: isFlat ? 0 : 1,
          borderColor: colors.input.border,
          borderBottomWidth: isFlat ? 1 : 1,
          borderBottomColor: colors.input.border,
          opacity: disabled ? opacity.disabled : 1,
        },
        style,
      ]}
    />
  );
};
