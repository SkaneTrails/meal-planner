import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';
import { SurfaceCard } from '@/components/SurfaceCard';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface InlineAddInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** Override the placeholder text color. Default: `colors.content.placeholderHex`. */
  placeholderTextColor?: string;
}

/**
 * Compact text input with an add button, used in settings screens
 * for adding note suggestions or pantry items.
 *
 * Wraps in a SurfaceCard with minimal padding and a submit button
 * that enables/disables based on whether the input has content.
 */
export const InlineAddInput = ({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  placeholderTextColor: placeholderTextColorProp,
}: InlineAddInputProps) => {
  const { colors, borderRadius } = useTheme();
  const hasContent = !!value.trim();
  const resolvedPlaceholderColor =
    placeholderTextColorProp ?? colors.content.placeholderHex;

  return (
    <SurfaceCard
      padding={spacing.xs}
      style={{ flexDirection: 'row', marginBottom: spacing.md }}
    >
      <TextInput
        style={{
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSize.md,
          color: colors.content.body,
        }}
        placeholder={placeholder}
        placeholderTextColor={resolvedPlaceholderColor}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <Pressable
        onPress={onSubmit}
        disabled={!hasContent}
        style={({ pressed }) => ({
          backgroundColor: hasContent ? colors.primary : colors.bgDark,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Ionicons
          name="add"
          size={20}
          color={hasContent ? colors.white : colors.button.disabled}
        />
      </Pressable>
    </SurfaceCard>
  );
};
