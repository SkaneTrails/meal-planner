/**
 * URL input bar with link icon, text field, and action button.
 *
 * Used in both home-screen and recipes-screen import modals.
 * Optionally shows a clear button when the input has text.
 */

import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface UrlInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

export const UrlInputBar = ({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
  showClear,
  onClear,
}: UrlInputBarProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.input.bg,
        borderRadius: borderRadius.md,
        padding: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Ionicons
        name="link-outline"
        size={18}
        color={colors.content.secondary}
        style={{ marginLeft: spacing.md }}
      />
      <TextInput
        style={{
          flex: 1,
          paddingHorizontal: spacing['sm-md'],
          paddingVertical: spacing.md,
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          color: colors.input.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
        editable={!disabled}
      />
      {showClear && onClear && (
        <Button
          variant="icon"
          tone="cancel"
          icon="close-circle"
          size="sm"
          onPress={onClear}
          style={{ marginRight: spacing.sm }}
        />
      )}
      {!showClear && (
        <Button
          variant="primary"
          onPress={onSubmit}
          disabled={!value.trim()}
          label={submitLabel}
          tone="primary"
          size="sm"
          style={{
            borderRadius: borderRadius.sm,
            paddingVertical: spacing['sm-md'],
            paddingHorizontal: spacing['md-lg'],
            marginRight: spacing['2xs'],
          }}
        />
      )}
    </View>
  );
};
