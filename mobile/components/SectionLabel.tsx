/**
 * Uppercase sub-section divider label.
 *
 * Two sizes:
 * - `sm` (default) — small muted labels inside collapsible sections
 * - `lg` — prominent group headers in edit modals (tags, time & servings, visibility)
 */

import { Text } from 'react-native';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

interface SectionLabelProps {
  text: string;
  size?: 'sm' | 'lg';
}

export const SectionLabel = ({ text, size = 'sm' }: SectionLabelProps) => {
  const { colors, fonts } = useTheme();

  const isLg = size === 'lg';

  return (
    <Text
      style={{
        fontSize: isLg ? fontSize.lg : fontSize.sm,
        fontFamily: fonts.bodySemibold,
        color: isLg ? colors.gray[500] : colors.text.muted,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: isLg ? letterSpacing.wide : undefined,
      }}
    >
      {text}
    </Text>
  );
};
