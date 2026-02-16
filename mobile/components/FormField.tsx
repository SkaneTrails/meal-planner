import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { colors, fontSize, spacing } from '@/lib/theme';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  /** Tighter spacing for inline row usage (flex: 1, smaller margin) */
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Label + content wrapper for form inputs.
 * Renders a styled label above any children (TextInput, icon-wrapped input, etc.).
 */
const FormField = ({ label, children, compact, style }: FormFieldProps) => (
  <View
    style={{
      marginBottom: compact ? spacing.sm : spacing.lg,
      ...(compact && { flex: 1 }),
      ...style,
    }}
  >
    <Text
      style={{
        fontSize: compact ? fontSize.md : fontSize.lg,
        fontWeight: '600',
        color: colors.text.inverse,
        marginBottom: compact ? spacing.xs : spacing.sm,
      }}
    >
      {label}
    </Text>
    {children}
  </View>
);

export { FormField };
