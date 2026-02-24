/**
 * Fixed-width horizontal FAB bar for the terminal CRT theme.
 *
 * Renders N cells in a single box-drawing frame — one cell per possible FAB.
 * Active cells show a pressable label; inactive cells remain as empty boxes.
 * The bar is always fully rendered so layout never shifts.
 *
 * ```
 * ┌──────────┬──────────┐
 * │ ◈ IDAG   │ ☷ INKÖP  │   ← both active
 * └──────────┴──────────┘
 * ┌──────────┬──────────┐
 * │          │ ☷ INKÖP  │   ← only grocery active
 * └──────────┴──────────┘
 * ```
 *
 * Falls through to `null` when CRT theme is not active (callers must
 * handle the light-theme FAB layout separately).
 */

import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { fontSize, spacing, terminal, useTheme } from '@/lib/theme';
import { type IoniconName, ThemeIcon } from './ThemeIcon';

export interface FabSlot {
  /** Stable key for React list rendering. */
  key: string;
  /** Optional icon rendered before the label text via ThemeIcon. */
  icon?: IoniconName;
  /** Label shown when active (e.g. "IDAG"). */
  label: string;
  /** Accessible name for screen readers (required when label is empty). */
  accessibilityLabel?: string;
  /** Whether this slot is currently visible / pressable. */
  active: boolean;
  /** Handler for the press event. */
  onPress: () => void;
}

interface TerminalFabBarProps {
  /** Fixed list of all possible FAB slots. Length determines cell count. */
  slots: FabSlot[];
  /** Additional styles on the outer positioned wrapper. */
  style?: ViewStyle;
}

// ── Box-drawing characters (single-line variant) ────────────────────────
const B = {
  tl: '\u250C', // ┌
  tr: '\u2510', // ┐
  bl: '\u2514', // └
  br: '\u2518', // ┘
  h: '\u2500', // ─
  v: '\u2502', // │
  tJ: '\u252C', // ┬  (top T-junction)
  bJ: '\u2534', // ┴  (bottom T-junction)
} as const;

export const TerminalFabBar = ({ slots, style }: TerminalFabBarProps) => {
  const { colors, fonts, chrome } = useTheme();

  if (chrome !== 'flat') return null;

  const borderColor = colors.border;
  const charStyle = {
    color: borderColor,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    lineHeight: terminal.fabCharHeight,
  };
  const labelStyle = {
    color: colors.primary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    lineHeight: terminal.fabCharHeight,
  };

  const cellCount = slots.length;

  return (
    <View
      style={[{ backgroundColor: colors.bgBase, flexDirection: 'row' }, style]}
    >
      {slots.map((slot, i) => {
        const isFirst = i === 0;
        const isLast = i === cellCount - 1;

        return (
          <View key={slot.key}>
            {/* ── Top border segment ── */}
            <View style={{ flexDirection: 'row' }}>
              <Text style={charStyle} selectable={false}>
                {isFirst ? B.tl : B.tJ}
              </Text>
              <View
                style={{
                  width: 0,
                  flexGrow: 1,
                  overflow: 'hidden',
                  height: 16,
                }}
              >
                <Text style={charStyle} selectable={false}>
                  {B.h.repeat(200)}
                </Text>
              </View>
              {isLast && (
                <Text style={charStyle} selectable={false}>
                  {B.tr}
                </Text>
              )}
            </View>

            {/* ── Content row ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={charStyle} selectable={false}>
                {B.v}
              </Text>
              {slot.active ? (
                <Pressable
                  onPress={slot.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={
                    slot.accessibilityLabel || slot.label || slot.icon
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.sm,
                    gap: spacing.xs,
                  }}
                >
                  {slot.icon && (
                    <ThemeIcon
                      name={slot.icon}
                      size={14}
                      color={colors.primary}
                    />
                  )}
                  {slot.label ? (
                    <Text style={labelStyle} selectable={false}>
                      {slot.label}
                    </Text>
                  ) : null}
                </Pressable>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.sm,
                    gap: spacing.xs,
                  }}
                >
                  {slot.icon && (
                    <ThemeIcon
                      name={slot.icon}
                      size={14}
                      color={colors.bgBase}
                    />
                  )}
                  {slot.label ? (
                    <Text
                      style={[labelStyle, { color: colors.bgBase }]}
                      selectable={false}
                    >
                      {slot.label}
                    </Text>
                  ) : null}
                </View>
              )}
              {isLast && (
                <Text style={charStyle} selectable={false}>
                  {B.v}
                </Text>
              )}
            </View>

            {/* ── Bottom border segment ── */}
            <View style={{ flexDirection: 'row' }}>
              <Text style={charStyle} selectable={false}>
                {isFirst ? B.bl : B.bJ}
              </Text>
              <View
                style={{
                  width: 0,
                  flexGrow: 1,
                  overflow: 'hidden',
                  height: terminal.fabCharHeight,
                }}
              >
                <Text style={charStyle} selectable={false}>
                  {B.h.repeat(200)}
                </Text>
              </View>
              {isLast && (
                <Text style={charStyle} selectable={false}>
                  {B.br}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};
