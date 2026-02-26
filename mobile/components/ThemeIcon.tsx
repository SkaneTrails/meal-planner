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
 * ## Glyph resolution (flat chrome)
 *
 * 1. Check `GLYPH_OVERRIDES[name]` — for icon names that need a
 *    variant-specific glyph (e.g. `heart-outline` → ♡ vs `heart` → ♥).
 * 2. Strip Ionicons suffixes (`-outline`, `-circle`, `-sharp`) and look
 *    up `BASE_GLYPHS[stem]`.  Adding one base entry auto-covers every
 *    variant of that icon.
 * 3. Fall back to `FALLBACK_GLYPH` (▪).
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

// ── Terminal glyph types ───────────────────────────────────────────────

type TerminalGlyph = {
  readonly char: string;
  readonly emoji?: true;
};

// ── Base glyphs (keyed by stem — covers all suffix variants) ───────────
//
// Ionicons names follow the pattern `concept-suffix` where suffix is one
// of `outline`, `circle`, `sharp`.  Stripping those gives a stem that
// maps to a single glyph, so adding `flame` here auto-covers
// `flame-outline`, `flame-circle`, and `flame-sharp`.

const BASE_GLYPHS: Record<string, TerminalGlyph> = {
  // Navigation
  home: { char: '\u{1F3E0}', emoji: true }, // 🏠
  book: { char: '\u{1F4D6}', emoji: true }, // 📖
  calendar: { char: '\u{1F4C5}', emoji: true }, // 📅
  cart: { char: '\u{1F6D2}', emoji: true }, // 🛒

  // Chevrons
  'chevron-forward': { char: '\u203A' }, // ›
  'chevron-back': { char: '\u2039' }, // ‹
  'chevron-down': { char: '\u25BC' }, // ▼
  'chevron-up': { char: '\u25B2' }, // ▲

  // Actions
  add: { char: '+' },
  'add-circle': { char: '\u2295' }, // ⊕
  remove: { char: '\u2212' }, // −
  close: { char: '\u00D7' }, // ×
  'close-circle': { char: '\u2298' }, // ⊘
  create: { char: '\u270E', emoji: true }, // ✎
  trash: { char: '\u{1F5D1}', emoji: true }, // 🗑
  copy: { char: '\u{1F4CB}', emoji: true }, // 📋
  search: { char: '\u{1F50D}', emoji: true }, // 🔍
  link: { char: '\u{1F517}', emoji: true }, // 🔗
  download: { char: '\u2B07', emoji: true }, // ⬇
  'log-out': { char: '\u23CF', emoji: true }, // ⏏
  camera: { char: '\u{1F4F7}', emoji: true }, // 📷
  shuffle: { char: '\u{1F500}', emoji: true }, // 🔀
  'reorder-three': { char: '\u2261' }, // ≡
  'swap-vertical': { char: '\u2195', emoji: true }, // ↕

  // Status & indicators
  checkmark: { char: '\u2713' }, // ✓
  'checkmark-circle': { char: '\u2705', emoji: true }, // ✅
  'alert-circle': { char: '\u26A0', emoji: true }, // ⚠
  'information-circle': { char: '\u2139', emoji: true }, // ℹ
  'help-circle': { char: '?' },
  'lock-closed': { char: '\u{1F512}', emoji: true }, // 🔒
  globe: { char: '\u{1F310}', emoji: true }, // 🌐
  'person-circle': { char: '\u{1F464}', emoji: true }, // 👤
  settings: { char: '\u2699', emoji: true }, // ⚙
  cog: { char: '\u2699', emoji: true }, // ⚙
  language: { char: '\u{1F310}', emoji: true }, // 🌐
  'shield-checkmark': { char: '\u{1F6E1}', emoji: true }, // 🛡
  terminal: { char: '>' }, // >_

  // Favorites & rating
  heart: { char: '\u2665' }, // ♥
  'thumbs-up': { char: '\u{1F44D}', emoji: true }, // 👍
  'thumbs-down': { char: '\u{1F44E}', emoji: true }, // 👎

  // AI / enhancement
  sparkles: { char: '\u2728', emoji: true }, // ✨
  bulb: { char: '\u{1F4A1}', emoji: true }, // 💡

  // Meal types
  sunny: { char: '\u2600', emoji: true }, // ☀
  restaurant: { char: '\u{1F37D}', emoji: true }, // 🍽
  moon: { char: '\u{1F319}', emoji: true }, // 🌙
  cafe: { char: '\u2615', emoji: true }, // ☕
  flame: { char: '\u{1F525}', emoji: true }, // 🔥
  leaf: { char: '\u{1F33F}', emoji: true }, // 🌿
  'ice-cream': { char: '\u{1F368}', emoji: true }, // 🍨
  wine: { char: '\u{1F377}', emoji: true }, // 🍷
  water: { char: '\u{1F4A7}', emoji: true }, // 💧
  flask: { char: '\u{1F9EA}', emoji: true }, // 🧪
  bonfire: { char: '\u{1F525}', emoji: true }, // 🔥
  basket: { char: '\u{1F9FA}', emoji: true }, // 🧺

  // Time & metadata
  time: { char: '\u{23F1}', emoji: true }, // ⏱
  timer: { char: '\u{23F2}', emoji: true }, // ⏲
  people: { char: '\u{1F465}', emoji: true }, // 👥
  pricetag: { char: '\u{1F3F7}', emoji: true }, // 🏷
  funnel: { char: '\u25BD' }, // ▽
  bookmark: { char: '\u{1F516}', emoji: true }, // 🔖
  nutrition: { char: '\u{1F34E}', emoji: true }, // 🍎
  today: { char: '\u{1F4C6}', emoji: true }, // 📆

  // Misc
  dice: { char: '\u{1F3B2}', emoji: true }, // 🎲
  'document-text': { char: '\u{1F4C4}', emoji: true }, // 📄
  list: { char: '\u2630' }, // ☰
  'chatbubble-ellipses': { char: '\u{1F4AC}', emoji: true }, // 💬
  'ellipsis-horizontal': { char: '\u22EF' }, // ⋯
};

// ── Overrides (variant-specific glyphs that differ from the base) ──────
//
// Use this for icon names where the suffix variant should render a
// *different* glyph than the stem's base entry.

const GLYPH_OVERRIDES: Partial<Record<IoniconName, TerminalGlyph>> = {
  'heart-outline': { char: '\u2661' }, // ♡ (hollow — base `heart` is ♥)
};

// ── Resolution ─────────────────────────────────────────────────────────

const FALLBACK_GLYPH: TerminalGlyph = { char: '\u25AA' }; // ▪

const IONICON_SUFFIXES = /-(outline|sharp)$/;

/**
 * Resolve an Ionicons name to a terminal glyph.
 *
 * Priority: exact override → stem lookup → fallback.
 */
const resolveGlyph = (name: IoniconName): TerminalGlyph => {
  const override = GLYPH_OVERRIDES[name];
  if (override) return override;

  const stem = name.replace(IONICON_SUFFIXES, '');
  return BASE_GLYPHS[stem] ?? FALLBACK_GLYPH;
};

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

  const glyph = resolveGlyph(name);

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

export { BASE_GLYPHS, GLYPH_OVERRIDES, resolveGlyph };
export type { IoniconName, TerminalGlyph };
