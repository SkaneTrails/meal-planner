/**
 * ASCII horizontal rule — renders a ═══ (or ───) divider with optional
 * centered decoration.
 *
 * In light theme it falls back to a simple 1px line using the theme border
 * color, so callers can use it unconditionally.
 */

import { Text, View, type ViewStyle } from 'react-native';
import { fontSize, spacing, terminal, useTheme } from '@/lib/theme';

interface TerminalDividerProps {
  /** Additional styles on the outer View. */
  style?: ViewStyle;
  /** Use single-line (─) instead of double (═). Defaults to single. */
  variant?: 'single' | 'double';
  /** Optional center decoration character (e.g. '◆', '●', '■'). */
  decoration?: string;
}

const H_SINGLE = '\u2500'; // ─
const H_DOUBLE = '\u2550'; // ═

export const TerminalDivider = ({
  style,
  variant = 'single',
  decoration,
}: TerminalDividerProps) => {
  const { colors, fonts, chrome } = useTheme();

  if (chrome !== 'flat') {
    return (
      <View
        style={[
          {
            height: 1,
            backgroundColor: colors.surface.divider,
            marginVertical: spacing.lg,
          },
          style,
        ]}
      />
    );
  }

  const h = variant === 'double' ? H_DOUBLE : H_SINGLE;
  const charStyle = {
    color: colors.border,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    lineHeight: terminal.charHeight,
  };

  if (decoration) {
    return (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.md,
          },
          style,
        ]}
      >
        <View
          style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
        >
          <Text style={charStyle} selectable={false}>
            {h.repeat(200)}
          </Text>
        </View>
        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.body,
            fontSize: fontSize.md,
            paddingHorizontal: spacing['xs-sm'],
          }}
          selectable={false}
        >
          {decoration}
        </Text>
        <View
          style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
        >
          <Text style={charStyle} selectable={false}>
            {h.repeat(200)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', marginVertical: spacing.md }, style]}>
      <View
        style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
      >
        <Text style={charStyle} selectable={false}>
          {h.repeat(200)}
        </Text>
      </View>
    </View>
  );
};
