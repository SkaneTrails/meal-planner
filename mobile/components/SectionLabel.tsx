/**
 * Uppercase sub-section divider label.
 *
 * Used inside collapsible sections to separate groups (e.g., "MEAT DISHES",
 * "DAIRY", equipment categories). Renders as small, semibold, muted uppercase
 * text with bottom spacing.
 */

import { Text } from 'react-native';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

interface SectionLabelProps {
  text: string;
}

export const SectionLabel = ({ text }: SectionLabelProps) => {
  const { colors } = useTheme();

  return (
    <Text
      style={{
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.text.muted,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Text>
  );
};
