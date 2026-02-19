/**
 * ASCII box-drawing frame — wraps content in ╔═╗║╚═╝ borders.
 *
 * Only renders box-drawing decorations when the active theme uses flat chrome
 * (detected via `useTheme().chrome`). Full-chrome themes render children
 * inside a plain View with no visual border so callers can use it
 * unconditionally.
 *
 * An optional `label` is rendered inside a `╡ LABEL ╞` break in the top
 * border, matching classic DOS/BIOS panel aesthetics.
 *
 * When `collapsed` is true, only the header is rendered — children are hidden.
 * Flat chrome shows the top border line only. Full chrome shows a compact card row.
 */

import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fontSize, iconSize, spacing, terminal, useTheme } from '@/lib/theme';

// ── Box-drawing characters (Unicode block 0x2500) ──────────────────────
const BOX = {
  tl: '\u2554', // ╔
  tr: '\u2557', // ╗
  bl: '\u255A', // ╚
  br: '\u255D', // ╝
  h: '\u2550', // ═
  v: '\u2551', // ║
  labelL: '\u2561', // ╡
  labelR: '\u255E', // ╞
} as const;

export interface FrameSegment {
  label: string;
  onPress?: () => void;
}

interface TerminalFrameProps {
  children: React.ReactNode;
  /** Optional label rendered in the top border (left). */
  label?: string;
  /** Optional label rendered in the top border (right), static text. */
  rightLabel?: string;
  /** When true, renders rightLabel in dim border color instead of bright label color. */
  rightLabelDimmed?: boolean;
  /** Optional label rendered in the bottom border (left). */
  bottomLabel?: string;
  /** Optional label rendered in the bottom border (right), static text. */
  bottomRightLabel?: string;
  /** Optional segments rendered in the top border (right), each independently pressable. */
  rightSegments?: FrameSegment[];
  /** Additional styles applied to the outer wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Padding inside the frame. Defaults to `spacing.md` (12). */
  padding?: number;
  /** If true, uses single-line box drawing (\u250C\u2500\u2510\u2502\u2514\u2500\u2518) instead of double. */
  variant?: 'single' | 'double';
  /** When true, hides children and shows only the header (border line or compact row). */
  collapsed?: boolean;
}

const SINGLE = {
  tl: '\u250C', // ┌
  tr: '\u2510', // ┐
  bl: '\u2514', // └
  br: '\u2518', // ┘
  h: '\u2500', // ─
  v: '\u2502', // │
  labelL: '\u2524', // ┤
  labelR: '\u251C', // ├
} as const;

export const TerminalFrame = ({
  children,
  label,
  rightLabel,
  rightLabelDimmed,
  bottomLabel,
  bottomRightLabel,
  rightSegments,
  style,
  padding = spacing.md,
  variant = 'double',
  collapsed = false,
}: TerminalFrameProps) => {
  const { colors, fonts, borderRadius, shadows, chrome } = useTheme();

  // ── Full chrome (light/pastel) ─────────────────────────────────────
  if (chrome !== 'flat') {
    if (collapsed) {
      return (
        <Pressable
          onPress={rightSegments?.find((s) => s.onPress)?.onPress}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              ...shadows.xs,
            },
            style,
          ]}
        >
          {label && (
            <Text
              style={{
                fontSize: fontSize.md,
                fontFamily: fonts.bodySemibold,
                color: colors.content.body,
                textTransform: 'capitalize',
              }}
            >
              {label}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            {rightSegments
              ?.filter((s) => !s.onPress)
              .map((seg) => (
                <Text
                  key={seg.label}
                  style={{
                    fontSize: fontSize.sm,
                    fontFamily: fonts.body,
                    color: colors.content.icon,
                  }}
                >
                  {seg.label}
                </Text>
              ))}
            <Ionicons
              name="chevron-down"
              size={iconSize.sm}
              color={colors.content.subtitle}
            />
          </View>
        </Pressable>
      );
    }
    return <View style={style}>{children}</View>;
  }

  const B = variant === 'single' ? SINGLE : BOX;
  const borderColor = colors.border;
  const labelColor = colors.primary;

  const charStyle = {
    color: borderColor,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    lineHeight: terminal.charHeight,
  };

  // ── Right segments fragment (reused in both labeled & plain top borders) ─
  const rightFragment =
    rightSegments && rightSegments.length > 0
      ? rightSegments.map((seg, i) => {
          const inner = (
            <View
              key={seg.label}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={charStyle} selectable={false}>
                {B.labelL}
              </Text>
              <Text
                style={{
                  color: labelColor,
                  fontFamily: fonts.bodySemibold,
                  fontSize: fontSize.base,
                  letterSpacing: 1,
                  paddingHorizontal: spacing.xs,
                }}
                selectable={false}
              >
                {seg.label}
              </Text>
              {i === rightSegments.length - 1 && (
                <Text style={charStyle} selectable={false}>
                  {B.labelR}
                </Text>
              )}
            </View>
          );
          return seg.onPress ? (
            <Pressable key={seg.label} onPress={seg.onPress}>
              {inner}
            </Pressable>
          ) : (
            inner
          );
        })
      : null;

  // ── CRT collapsed — only the top border line, pressable ─────────────
  if (collapsed) {
    return (
      <Pressable
        onPress={rightSegments?.find((s) => s.onPress)?.onPress}
        style={[{ flexDirection: 'row', alignItems: 'center' }, style]}
      >
        {label && (
          <>
            <Text style={charStyle} selectable={false}>
              {B.labelL}
            </Text>
            <Text
              style={{
                color: labelColor,
                fontFamily: fonts.bodySemibold,
                fontSize: fontSize.base,
                letterSpacing: 1,
                paddingHorizontal: spacing.xs,
              }}
              selectable={false}
            >
              {label}
            </Text>
            <Text style={charStyle} selectable={false}>
              {B.labelR}
            </Text>
          </>
        )}
        <View
          style={{ flex: 1, overflow: 'hidden', height: terminal.charHeight }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(200)}
          </Text>
        </View>
        {rightFragment}
        <View
          style={{
            width: spacing.sm,
            overflow: 'hidden',
            height: terminal.charHeight,
          }}
        >
          <Text style={charStyle} selectable={false}>
            {B.h.repeat(10)}
          </Text>
        </View>
      </Pressable>
    );
  }

  // ── Helper: renders ┤ LABEL ├ fragment for border labels ────────────
  const labelFragment = (text: string, dimmed = false) => (
    <>
      <Text style={charStyle} selectable={false}>
        {B.labelL}
      </Text>
      <Text
        style={{
          color: dimmed ? borderColor : labelColor,
          fontFamily: fonts.bodySemibold,
          fontSize: fontSize.base,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          paddingHorizontal: spacing.xs,
        }}
        selectable={false}
      >
        {text}
      </Text>
      <Text style={charStyle} selectable={false}>
        {B.labelR}
      </Text>
    </>
  );

  // ── Top border ─────────────────────────────────────────────────────
  const topBorder = label ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={charStyle} selectable={false}>
        {B.tl}
        {B.h}
      </Text>
      {labelFragment(label)}
      <View style={{ flex: 1, overflow: 'hidden', height: 14 }}>
        <Text style={charStyle} selectable={false}>
          {B.h.repeat(200)}
        </Text>
      </View>
      {rightFragment}
      {rightLabel && labelFragment(rightLabel, rightLabelDimmed)}
      <Text style={charStyle} selectable={false}>
        {B.tr}
      </Text>
    </View>
  ) : (
    <View style={{ flexDirection: 'row' }}>
      <Text style={charStyle} selectable={false}>
        {B.tl}
      </Text>
      <View style={{ flex: 1, overflow: 'hidden', height: 14 }}>
        <Text style={charStyle} selectable={false}>
          {B.h.repeat(200)}
        </Text>
      </View>
      {rightFragment}
      {rightLabel && labelFragment(rightLabel, rightLabelDimmed)}
      <Text style={charStyle} selectable={false}>
        {B.tr}
      </Text>
    </View>
  );

  // ── Bottom border ──────────────────────────────────────────────────
  const hasBottomLabels = bottomLabel || bottomRightLabel;
  const bottomBorder = hasBottomLabels ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={charStyle} selectable={false}>
        {B.bl}
        {bottomLabel ? B.h : ''}
      </Text>
      {bottomLabel && labelFragment(bottomLabel)}
      <View style={{ flex: 1, overflow: 'hidden', height: 14 }}>
        <Text style={charStyle} selectable={false}>
          {B.h.repeat(200)}
        </Text>
      </View>
      {bottomRightLabel && labelFragment(bottomRightLabel)}
      <Text style={charStyle} selectable={false}>
        {B.br}
      </Text>
    </View>
  ) : (
    <View style={{ flexDirection: 'row' }}>
      <Text style={charStyle} selectable={false}>
        {B.bl}
      </Text>
      <View style={{ flex: 1, overflow: 'hidden', height: 14 }}>
        <Text style={charStyle} selectable={false}>
          {B.h.repeat(200)}
        </Text>
      </View>
      <Text style={charStyle} selectable={false}>
        {B.br}
      </Text>
    </View>
  );

  return (
    <View style={style}>
      {topBorder}
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <Text style={charStyle} selectable={false}>
          {B.v}
        </Text>
        <View style={{ flex: 1, padding }}>{children}</View>
        <Text style={charStyle} selectable={false}>
          {B.v}
        </Text>
      </View>
      {bottomBorder}
    </View>
  );
};
