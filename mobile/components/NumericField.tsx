/**
 * Compact numeric input inside a FormField.
 *
 * Used for servings, prep time, and cook time in recipe creation/edit forms.
 * Renders a small bordered input with numeric keyboard.
 */

import { TextInput } from 'react-native';
import { FormField } from '@/components/FormField';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface NumericFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export const NumericField = ({
  label,
  placeholder,
  value,
  onChangeText,
  disabled,
}: NumericFieldProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();

  return (
    <FormField label={label} compact>
      <TextInput
        style={{
          backgroundColor: colors.input.bg,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.input.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          color: colors.input.text,
          ...shadows.sm,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        editable={!disabled}
      />
    </FormField>
  );
};
