/**
 * Theme-aware icon component.
 *
 * In `chrome === 'full'` themes: renders an Ionicons vector icon.
 * In `chrome === 'flat'` themes: renders a monochrome NotoEmoji glyph or
 * Unicode symbol, inheriting color from the theme's phosphor palette.
 *
 * Usage:
 *   <ThemeIcon name="home" size={20} color={colors.content.icon} />
 *
 * The terminal icon map covers all Ionicons used in the app. Unmapped
 * names fall back to a generic placeholder (`▪`).
 */

import { Ionicons } from '@expo/vector-icons';
import { type StyleProp, Text, type TextStyle } from 'react-native';
import type { IoniconName } from '@/lib/tab-config';
import { useTheme } from '@/lib/theme';

interface ThemeIconProps {
  name: IoniconName;
  size: number;
  color: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

// ── Terminal glyph mapping ─────────────────────────────────────────────
//
// Each entry maps an Ionicons name to a terminal glyph.
// `char` is the Unicode character to render.
// `emoji: true` means the char is best rendered with the NotoEmoji font
// for consistent monochrome display. Without it, the char uses the
// theme's monospace body font (good for ASCII/math symbols).

type TerminalGlyph = {
  readonly char: string;
  readonly emoji?: true;
};

const TERMINAL_ICONS: Partial<Record<IoniconName, TerminalGlyph>> = {
  // ── Navigation ─────────────────────────────────────────────────────
  home: { char: '\u{1F3E0}', emoji: true }, // 🏠
  'home-outline': { char: '\u{1F3E0}', emoji: true },
  book: { char: '\u{1F4D6}', emoji: true }, // 📖
  'book-outline': { char: '\u{1F4D6}', emoji: true },
  calendar: { char: '\u{1F4C5}', emoji: true }, // 📅
  'calendar-outline': { char: '\u{1F4C5}', emoji: true },
  cart: { char: '\u{1F6D2}', emoji: true }, // 🛒
  'cart-outline': { char: '\u{1F6D2}', emoji: true },
  'chevron-forward': { char: '\u203A' }, // ›
  'chevron-back': { char: '\u2039' }, // ‹
  'chevron-down': { char: '\u25BC' }, // ▼
  'chevron-up': { char: '\u25B2' }, // ▲

  // ── Actions ────────────────────────────────────────────────────────
  add: { char: '+' },
  'add-circle-outline': { char: '\u2295' }, // ⊕
  remove: { char: '\u2212' }, // −
  close: { char: '\u00D7' }, // ×
  'close-circle': { char: '\u2298' }, // ⊘
  create: { char: '\u270E', emoji: true }, // ✎
  'create-outline': { char: '\u270E', emoji: true },
  'trash-outline': { char: '\u{1F5D1}', emoji: true }, // 🗑
  copy: { char: '\u{1F4CB}', emoji: true }, // 📋
  'copy-outline': { char: '\u{1F4CB}', emoji: true },
  search: { char: '\u{1F50D}', emoji: true }, // 🔍
  link: { char: '\u{1F517}', emoji: true }, // 🔗
  'link-outline': { char: '\u{1F517}', emoji: true },
  'download-outline': { char: '\u2B07', emoji: true }, // ⬇
  'log-out-outline': { char: '\u23CF', emoji: true }, // ⏏
  camera: { char: '\u{1F4F7}', emoji: true }, // 📷
  shuffle: { char: '\u{1F500}', emoji: true }, // 🔀
  'reorder-three': { char: '\u2261' }, // ≡

  // ── Status & indicators ────────────────────────────────────────────
  checkmark: { char: '\u2713' }, // ✓
  'checkmark-circle': { char: '\u2705', emoji: true }, // ✅
  'alert-circle-outline': { char: '\u26A0', emoji: true }, // ⚠
  'information-circle': { char: '\u2139', emoji: true }, // ℹ
  'help-circle-outline': { char: '?' },
  'lock-closed': { char: '\u{1F512}', emoji: true }, // 🔒
  'lock-closed-outline': { char: '\u{1F512}', emoji: true },
  'globe-outline': { char: '\u{1F310}', emoji: true }, // 🌐
  'person-circle': { char: '\u{1F464}', emoji: true }, // 👤
  'settings-outline': { char: '\u2699', emoji: true }, // ⚙
  settings: { char: '\u2699', emoji: true },

  // ── Favorites & rating ─────────────────────────────────────────────
  heart: { char: '\u2665' }, // ♥
  'heart-outline': { char: '\u2661' }, // ♡
  'thumbs-up': { char: '\u{1F44D}', emoji: true }, // 👍
  'thumbs-up-outline': { char: '\u{1F44D}', emoji: true },
  'thumbs-down': { char: '\u{1F44E}', emoji: true }, // 👎
  'thumbs-down-outline': { char: '\u{1F44E}', emoji: true },

  // ── AI / enhancement ───────────────────────────────────────────────
  sparkles: { char: '\u2728', emoji: true }, // ✨
  'sparkles-outline': { char: '\u2728', emoji: true },
  'bulb-outline': { char: '\u{1F4A1}', emoji: true }, // 💡

  // ── Meal types ─────────────────────────────────────────────────────
  sunny: { char: '\u2600', emoji: true }, // ☀
  'sunny-outline': { char: '\u2600', emoji: true }, // ☀
  'restaurant-outline': { char: '\u{1F37D}', emoji: true }, // 🍽
  'moon-outline': { char: '\u{1F319}', emoji: true }, // 🌙
  'cafe-outline': { char: '\u2615', emoji: true }, // ☕
  'flame-outline': { char: '\u{1F525}', emoji: true }, // 🔥
  flame: { char: '\u{1F525}', emoji: true },
  'leaf-outline': { char: '\u{1F33F}', emoji: true }, // 🌿
  'ice-cream-outline': { char: '\u{1F368}', emoji: true }, // 🍨
  'wine-outline': { char: '\u{1F377}', emoji: true }, // 🍷
  'water-outline': { char: '\u{1F4A7}', emoji: true }, // 💧
  'flask-outline': { char: '\u{1F9EA}', emoji: true }, // 🧪
  'bonfire-outline': { char: '\u{1F525}', emoji: true }, // 🔥
  'basket-outline': { char: '\u{1F9FA}', emoji: true }, // 🧺

  // ── Time & metadata ────────────────────────────────────────────────
  'time-outline': { char: '\u{23F1}', emoji: true }, // ⏱
  time: { char: '\u{23F1}', emoji: true },
  timer: { char: '\u{23F2}', emoji: true }, // ⏲
  'people-outline': { char: '\u{1F465}', emoji: true }, // 👥
  people: { char: '\u{1F465}', emoji: true },
  pricetag: { char: '\u{1F3F7}', emoji: true }, // 🏷
  'pricetag-outline': { char: '\u{1F3F7}', emoji: true },
  'funnel-outline': { char: '\u25BD' }, // ▽
  'bookmark-outline': { char: '\u{1F516}', emoji: true }, // 🔖
  'nutrition-outline': { char: '\u{1F34E}', emoji: true }, // 🍎
  'today-outline': { char: '\u{1F4C6}', emoji: true }, // 📆

  // ── Misc / decoration ──────────────────────────────────────────────
  dice: { char: '\u{1F3B2}', emoji: true }, // 🎲
  'dice-outline': { char: '\u{1F3B2}', emoji: true },
  'document-text-outline': { char: '\u{1F4C4}', emoji: true }, // 📄
  list: { char: '\u2630' }, // ☰
  'chatbubble-ellipses-outline': { char: '\u{1F4AC}', emoji: true }, // 💬
  'ellipsis-horizontal-circle': { char: '\u22EF' }, // ⋯
};

const FALLBACK_GLYPH: TerminalGlyph = { char: '\u25AA' }; // ▪

export const ThemeIcon = ({
  name,
  size,
  color,
  style,
  accessibilityLabel,
}: ThemeIconProps) => {
  const { chrome, fonts } = useTheme();

  if (chrome !== 'flat') {
    return (
      <Ionicons
        name={name}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  const glyph = TERMINAL_ICONS[name] ?? FALLBACK_GLYPH;

  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.2,
          color,
          fontFamily: glyph.emoji ? (fonts.emoji ?? fonts.body) : fonts.body,
          textAlign: 'center',
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {glyph.char}
    </Text>
  );
};

export { TERMINAL_ICONS };
export type { IoniconName };
