/**
 * Uppercase sub-section divider label.
 *
 * Two sizes:
 * - `sm` (default) — small muted labels inside collapsible sections
 * - `lg` — prominent group headers in edit modals (tags, time & servings, visibility)
 *
 * Pass `tooltip` to render an ⓘ icon that opens a help popup.
 */

import { Text, View } from 'react-native';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';
import { HelpTipIcon } from './HelpTip';

interface SectionLabelProps {
  text: string;
  size?: 'sm' | 'lg';
  /** When set, renders an ⓘ icon that opens a help-tip popup with this text. */
  tooltip?: string;
}

export const SectionLabel = ({
  text,
  size = 'sm',
  tooltip,
}: SectionLabelProps) => {
  const { colors, fonts } = useTheme();

  const isLg = size === 'lg';

  const label = (
    <Text
      style={{
        fontSize: isLg ? fontSize.lg : fontSize.sm,
        fontFamily: fonts.bodySemibold,
        color: isLg ? colors.gray[500] : colors.text.muted,
        marginBottom: tooltip ? 0 : spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: isLg ? letterSpacing.wide : undefined,
      }}
    >
      {text}
    </Text>
  );

  if (!tooltip) return label;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      }}
    >
      {label}
      <HelpTipIcon helpText={tooltip} />
    </View>
  );
};
