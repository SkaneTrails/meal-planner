/**
 * Pastel / bubbly theme — candy-soft pastels on a light airy base.
 *
 * Uses pastel blue, green, pink, purple, and yellow — no warm brown tones.
 * Text colors use deeper versions of the same hues for readable contrast.
 * Paired with Comic Sans (or system rounded fallback) for maximum bubbly energy.
 */

import type { ColorTokens } from './colors';

// ── Base palette ───────────────────────────────────────────────────────
const PINK = '#E891B2';
const PINK_DARK = '#D47A9E';
const PINK_LIGHT = '#F5C6D8';

const LAVENDER = '#C3A6E0';
const LAVENDER_DARK = '#A882CC';
const LAVENDER_LIGHT = '#E8D6F7';

const MINT = '#8ED1B5';
const SKY = '#8EC5E8';
const BABY_BLUE = '#A8D8F0';
const LEMON = '#F7E57A';
const ROSE = '#F0A0C0';

// ── Helpers ────────────────────────────────────────────────────────────
const p = (r: number, g: number, b: number, a: number) =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

// ── Palette ────────────────────────────────────────────────────────────
export const pastelColors: ColorTokens = {
  // Primary — soft lavender
  primary: LAVENDER,
  primaryDark: LAVENDER_DARK,
  primaryLight: LAVENDER_LIGHT,

  // Background — warm cream with pink undertones
  bgBase: '#FFF0F5',
  bgLight: '#FFF8FA',
  bgMid: '#FFE8F0',
  bgDark: '#FFD6E4',
  bgWarm: '#FFF0F5',

  // Accent — candy pink
  accent: PINK,
  accentDark: PINK_DARK,
  accentLight: PINK_LIGHT,
  coral: ROSE,
  coralSoft: '#F5B8D0',
  gold: LEMON,
  goldLight: '#FBF0B0',

  // Category colors — candy pastels
  category: {
    recipes: { bg: '#FFF0F5', text: '#B05680' },
    planned: { bg: '#E8FFE8', text: '#3D8B3D' },
    grocery: { bg: '#F0E8FF', text: '#7B4FB0' },
    add: { bg: '#E0F0FF', text: '#4070B0' },
  },

  // Diet — soft versions
  diet: {
    veggie: {
      bg: '#E8FFE8',
      text: '#3D8B3D',
      cardBg: p(61, 180, 61, 0.1),
      border: p(61, 180, 61, 0.5),
    },
    fish: {
      bg: '#E0F0FF',
      text: '#3070B0',
      cardBg: p(48, 112, 176, 0.1),
      border: p(48, 112, 176, 0.5),
    },
    meat: {
      bg: '#FFE8E8',
      text: '#B05050',
      cardBg: p(176, 80, 80, 0.1),
      border: p(176, 80, 80, 0.5),
    },
  },

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#FFFBFD',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.85)',
    muted: 'rgba(255, 255, 255, 0.65)',
    light: 'rgba(255, 255, 255, 0.45)',
    inverse: '#4A3050',
    dark: '#6B5070',
  },
  border: 'rgba(200, 160, 200, 0.3)',
  borderLight: 'rgba(200, 160, 200, 0.15)',
  borderFaint: 'rgba(200, 160, 200, 0.06)',

  // Content — purple-pink tones on light backgrounds
  content: {
    heading: '#4A3050',
    headingMuted: 'rgba(74, 48, 80, 0.75)',
    headingWarm: '#6B3860',
    body: '#6B5070',
    secondary: '#9070A0',
    strong: 'rgba(107, 80, 112, 0.8)',
    tertiary: 'rgba(107, 80, 112, 0.65)',
    subtitle: 'rgba(107, 80, 112, 0.55)',
    icon: 'rgba(107, 80, 112, 0.5)',
    placeholder: 'rgba(107, 80, 112, 0.4)',
    placeholderHex: '#9070A066',
  },

  // Interactive surface states
  surface: {
    overlay: 'rgba(107, 80, 112, 0.85)',
    overlayMedium: 'rgba(107, 80, 112, 0.75)',
    border: 'rgba(107, 80, 112, 0.25)',
    borderLight: 'rgba(107, 80, 112, 0.18)',
    divider: 'rgba(107, 80, 112, 0.15)',
    dividerSolid: '#E8D0E8',
    modal: '#FFF5FA',
    pressed: 'rgba(107, 80, 112, 0.12)',
    active: 'rgba(107, 80, 112, 0.1)',
    subtle: 'rgba(107, 80, 112, 0.07)',
    hover: 'rgba(107, 80, 112, 0.05)',
    tint: 'rgba(107, 80, 112, 0.03)',
  },

  // Button colors — soft lavender
  button: {
    primary: LAVENDER_DARK,
    primaryPressed: '#9670B8',
    disabled: '#D8C0E8',
    primarySubtle: p(168, 130, 204, 0.08),
    primarySurface: p(168, 130, 204, 0.1),
    primaryActive: p(168, 130, 204, 0.14),
    primaryHover: p(168, 130, 204, 0.18),
    primaryDivider: p(168, 130, 204, 0.22),
  },

  // Gray scale — rose-tinted
  gray: {
    50: '#FFF8FA',
    100: '#FFF0F5',
    200: '#FFE8F0',
    300: '#FFDCE8',
    400: '#E0C0D0',
    500: '#C0A0B0',
    600: '#A08090',
    700: '#807080',
    800: '#605060',
    900: '#403040',
  },

  // Semantic
  success: '#66BB6A',
  successBg: '#E8FFE8',
  warning: '#FFB74D',
  warningBg: '#FFF8E0',
  error: '#EF7070',
  errorBg: '#FFE8E8',
  info: '#64B5F6',
  infoBg: '#E0F0FF',
  danger: '#E05050',

  // Overlay
  overlay: {
    backdrop: 'rgba(80, 40, 80, 0.4)',
    backdropLight: 'rgba(80, 40, 80, 0.3)',
    strong: 'rgba(80, 40, 80, 0.5)',
  },

  // Meal plan — lavender-tinted
  mealPlan: {
    slotBg: 'rgba(230, 210, 240, 0.7)',
    containerBg: 'rgba(240, 225, 250, 0.9)',
    emptyBg: 'rgba(230, 210, 240, 0.5)',
    emptyStateBg: 'rgba(230, 210, 240, 0.35)',
  },

  // Ratings
  rating: {
    positive: '#55AA66',
    negative: '#CC6666',
    positiveBg: p(85, 170, 102, 0.25),
    negativeBg: p(204, 102, 102, 0.25),
  },

  // Timeline
  timeline: {
    badge: MINT,
    line: p(142, 209, 181, 0.2),
    completedText: '#3D8B3D',
  },

  // Chip/filter
  chip: {
    bg: 'rgba(230, 210, 240, 0.5)',
    border: 'rgba(168, 130, 204, 0.3)',
    divider: 'rgba(168, 130, 204, 0.15)',
    fishActive: SKY,
    meatActive: ROSE,
    favoriteActive: PINK,
  },

  // Shadow
  shadow: {
    text: 'rgba(80, 40, 80, 0.1)',
  },

  // Glass — bubbly translucent
  glass: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(255, 255, 255, 0.8)',
    heavy: 'rgba(255, 255, 255, 0.95)',
    solid: 'rgba(255, 255, 255, 0.92)',
    bright: 'rgba(255, 240, 250, 0.9)',
    dark: 'rgba(255, 240, 250, 0.65)',
    subtle: 'rgba(255, 240, 250, 0.6)',
    faint: 'rgba(255, 240, 250, 0.5)',
    card: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(200, 160, 200, 0.08)',
    button: 'rgba(255, 255, 255, 0.35)',
    buttonPressed: 'rgba(255, 255, 255, 0.5)',
    buttonDefault: 'rgba(255, 255, 255, 0.4)',
    dim: 'rgba(255, 240, 250, 0.1)',
  },

  // Tab bar
  tabBar: {
    bg: 'rgba(240, 220, 240, 0.5)',
    bgFallback: 'rgba(240, 220, 240, 0.85)',
    bottomFill: '#F0DCF0',
    border: 'rgba(168, 130, 204, 0.12)',
    active: '#6B3860',
    inactive: '#9070A0',
    focusBg: 'rgba(168, 130, 204, 0.1)',
  },

  // AI — minty fresh
  ai: {
    primary: MINT,
    primaryDark: '#70B89A',
    bg: p(142, 209, 181, 0.08),
    bgPressed: p(142, 209, 181, 0.18),
    muted: p(142, 209, 181, 0.5),
    iconBg: p(142, 209, 181, 0.12),
    light: p(142, 209, 181, 0.15),
    badge: p(142, 209, 181, 0.95),
    selectedBg: p(142, 209, 181, 0.1),
    border: p(142, 209, 181, 0.3),
  },

  // Destructive — soft red
  destructive: {
    bg: 'rgba(224, 80, 80, 0.08)',
    icon: 'rgba(224, 80, 80, 0.7)',
    text: 'rgba(224, 80, 80, 0.85)',
  },

  // Gradient — pastel blobs
  gradient: {
    orb1: PINK_LIGHT,
    orb2: LAVENDER_LIGHT,
    orb3: '#B8E8D0',
    orb4: '#D0E8F8',
    stop1: PINK_LIGHT,
    stop2: LAVENDER_LIGHT,
  },

  // Background overlays
  background: {
    mutedOverlay: 'rgba(80, 40, 80, 0.08)',
    defaultOverlay: 'rgba(255, 240, 250, 0.1)',
    structuredWash: 'rgba(240, 220, 240, 0.9)',
    structuredGradientStart: 'rgba(230, 200, 240, 0.2)',
    structuredGradientEnd: 'transparent',
    animatedOverlay: 'rgba(255, 240, 250, 0.1)',
  },

  // Tag dots — candy rainbow
  tagDot: [PINK, LAVENDER, MINT, SKY, BABY_BLUE, LEMON, ROSE, '#B8A0D8'],
};
