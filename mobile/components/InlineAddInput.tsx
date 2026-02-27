import { TextInput } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ContentCard } from '@/components/ContentCard';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface InlineAddInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** Override the placeholder text color. Default: `colors.content.placeholderHex`. */
  placeholderTextColor?: string;
  /** Whether the input is disabled (no typing or submission). */
  disabled?: boolean;
}

/**
 * Compact text input with an add button, used in settings screens
 * for adding note suggestions or pantry items.
 *
 * Wraps in a ContentCard surface variant with minimal padding and a submit button
 * that enables/disables based on whether the input has content.
 */
export const InlineAddInput = ({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  placeholderTextColor: placeholderTextColorProp,
  disabled = false,
}: InlineAddInputProps) => {
  const { colors, fonts } = useTheme();
  const hasContent = !!value.trim();
  const resolvedPlaceholderColor =
    placeholderTextColorProp ?? colors.content.placeholderHex;

  return (
    <ContentCard
      variant="surface"
      padding={spacing.sm}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
      }}
    >
      <TextInput
        style={{
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          color: colors.content.body,
          opacity: disabled ? 0.5 : 1,
        }}
        placeholder={placeholder}
        placeholderTextColor={resolvedPlaceholderColor}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={disabled ? undefined : onSubmit}
        editable={!disabled}
        returnKeyType="done"
      />
      <ActionButton.Add
        onPress={onSubmit}
        disabled={disabled || !hasContent}
        testID="inline-add-button"
        size="md"
      />
    </ContentCard>
  );
};
