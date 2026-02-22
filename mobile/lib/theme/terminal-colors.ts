/**
 * Terminal / CRT theme — phosphor green on black.
 *
 * Color palette and CRT visual effect config for the terminal theme.
 * Font families, border radius, and shadows are defined in the theme file.
 */

import type { ColorTokens } from './colors';
import type { CRTConfig } from './theme-context';

// ── Base palette ───────────────────────────────────────────────────────
const BLACK = '#0A0A0A';
const BLACK_LIGHT = '#0D110D';
const BLACK_MID = '#101A10';
const BLACK_CARD = '#0F1A0F';

const GREEN = '#33FF33'; // phosphor green — primary
const GREEN_DIM = '#22CC22'; // medium brightness
const GREEN_DARK = '#1A9A1A'; // muted / tertiary
const GREEN_SUBTLE = '#115511'; // borders, faint accents

// No cyan — terminal is monochrome green

const RED = '#33FF33'; // monochrome — errors/destructive use bright green
const AMBER = '#22CC22'; // monochrome — warnings use dim green
const BLUE = '#33FF33'; // monochrome — info uses bright green

// ── Helpers ────────────────────────────────────────────────────────────
const g = (opacity: number) => `rgba(51, 255, 51, ${opacity})`; // green at opacity
const bk = (opacity: number) => `rgba(10, 10, 10, ${opacity})`; // black at opacity

// ── Palette ────────────────────────────────────────────────────────────
export const terminalColors: ColorTokens = {
  primary: GREEN,
  primaryDark: GREEN_DIM,
  primaryLight: GREEN,

  bgBase: BLACK,
  bgLight: BLACK_LIGHT,
  bgMid: BLACK_MID,
  bgDark: BLACK_CARD,
  bgWarm: BLACK_LIGHT,

  accent: GREEN_DIM,
  accentDark: GREEN_DARK,
  accentLight: GREEN,
  coral: GREEN,
  coralSoft: GREEN_DIM,
  gold: GREEN_DIM,
  goldLight: GREEN_DARK,

  category: {
    recipes: { bg: g(0.1), text: GREEN },
    planned: { bg: g(0.1), text: GREEN },
    grocery: { bg: g(0.1), text: GREEN },
    add: { bg: g(0.1), text: GREEN },
  },

  diet: {
    veggie: {
      bg: 'rgba(17, 85, 17, 0.3)',
      text: GREEN,
      cardBg: g(0.06),
      border: g(0.4),
    },
    fish: {
      bg: 'rgba(17, 85, 17, 0.3)',
      text: GREEN_DIM,
      cardBg: g(0.06),
      border: g(0.4),
    },
    meat: {
      bg: 'rgba(17, 85, 17, 0.3)',
      text: GREEN,
      cardBg: g(0.06),
      border: g(0.4),
    },
  },

  white: GREEN, // "white" in terminal world = bright green
  offWhite: GREEN_DIM,
  text: {
    primary: GREEN,
    secondary: g(0.7),
    muted: g(0.5),
    light: g(0.3),
    inverse: BLACK,
    dark: GREEN_DIM,
  },
  border: g(0.25),
  borderLight: g(0.12),
  borderFaint: g(0.05),

  content: {
    heading: GREEN,
    headingMuted: g(0.75),
    headingWarm: GREEN,
    body: GREEN_DIM,
    secondary: GREEN_DARK,
    strong: g(0.8),
    tertiary: g(0.65),
    subtitle: g(0.55),
    icon: g(0.5),
    placeholder: g(0.35),
    placeholderHex: '#33FF3359',
  },

  surface: {
    overlay: bk(0.92),
    overlayMedium: bk(0.85),
    border: g(0.25),
    borderLight: g(0.15),
    divider: g(0.12),
    dividerSolid: GREEN_SUBTLE,
    modal: BLACK_LIGHT,
    pressed: g(0.12),
    active: g(0.1),
    subtle: g(0.07),
    hover: g(0.05),
    tint: g(0.03),
    sheetOverlay: bk(0.95),
    iconBg: g(0.08),
  },

  button: {
    primary: GREEN_DARK,
    primaryPressed: GREEN_DIM,
    primaryText: GREEN,
    disabled: GREEN_SUBTLE,
    primarySubtle: g(0.06),
    primarySurface: g(0.08),
    primaryActive: g(0.12),
    primaryHover: g(0.15),
    primaryDivider: g(0.2),
  },

  gray: {
    50: '#0D1A0D',
    100: '#112211',
    200: '#142814',
    300: '#183318',
    400: '#1E3E1E',
    500: '#265526',
    600: '#2E6E2E',
    700: '#338833',
    800: '#44AA44',
    900: '#66CC66',
  },

  success: '#33FF33',
  successBg: g(0.1),
  warning: AMBER,
  warningBg: g(0.1),
  error: RED,
  errorBg: g(0.1),
  info: BLUE,
  infoBg: g(0.1),
  danger: RED,

  overlay: {
    backdrop: bk(0.7),
    backdropLight: bk(0.6),
    strong: bk(0.85),
    gradientHeavy: bk(0.8),
    gradientSubtle: bk(0.3),
  },

  mealPlan: {
    slotBg: 'rgba(17, 85, 17, 0.3)',
    containerBg: bk(0.92),
    emptyBg: 'rgba(17, 85, 17, 0.2)',
    emptyStateBg: 'rgba(17, 85, 17, 0.15)',
  },

  rating: {
    positive: GREEN,
    negative: GREEN_DIM,
    positiveBg: g(0.15),
    negativeBg: g(0.1),
  },

  timeline: {
    badge: GREEN_DIM,
    line: g(0.15),
    completedText: GREEN,
  },

  chip: {
    bg: g(0.08),
    border: g(0.25),
    divider: g(0.12),
    fishActive: GREEN_DIM,
    meatActive: GREEN,
    favoriteActive: GREEN,
    toggleActiveBg: GREEN,
    toggleInactiveBg: BLACK,
    toggleActiveBorder: GREEN,
    toggleActiveText: BLACK,
    toggleInactiveText: GREEN,
  },

  shadow: {
    text: g(0.2),
  },

  glass: {
    light: bk(0.88),
    medium: bk(0.82),
    heavy: bk(0.95),
    solid: bk(0.92),
    bright: g(0.9),
    dark: g(0.5),
    subtle: g(0.4),
    faint: g(0.3),
    card: bk(0.88),
    border: g(0.08),
    button: g(0.15),
    buttonPressed: g(0.25),
    buttonDefault: g(0.2),
    dim: g(0.05),
    pressed: g(0.12),
  },

  header: {
    bg: 'rgba(0, 0, 0, 0.85)',
    fadeEnd: 'rgba(0, 0, 0, 0)',
    shadow: `0px 1px 4px ${g(0.15)}`,
    fadeWidth: 24,
  },

  tabBar: {
    bg: bk(1),
    bgFallback: bk(1),
    bottomFill: BLACK,
    border: g(0.15),
    active: GREEN,
    inactive: GREEN_DARK,
    focusBg: g(0.1),
  },

  ai: {
    primary: GREEN_DIM,
    primaryDark: GREEN_DARK,
    bg: g(0.06),
    bgPressed: g(0.15),
    muted: g(0.4),
    iconBg: g(0.1),
    light: g(0.12),
    badge: g(0.9),
    selectedBg: g(0.08),
    border: g(0.25),
  },

  destructive: {
    bg: g(0.08),
    icon: g(0.8),
    text: g(0.9),
  },

  gradient: {
    orb1: BLACK,
    orb2: BLACK,
    orb3: BLACK,
    orb4: BLACK,
    orb5: BLACK,
    orb6: BLACK,
    stop1: BLACK,
    stop2: BLACK,
  },

  background: {
    mutedOverlay: bk(1), // fully opaque black — hides image
    defaultOverlay: bk(1),
    structuredWash: bk(1),
    structuredGradientStart: 'transparent',
    structuredGradientEnd: 'transparent',
    animatedOverlay: bk(1),
  },

  tagDot: [
    GREEN,
    GREEN_DIM,
    GREEN_DARK,
    GREEN_SUBTLE,
    GREEN_DIM,
    GREEN,
    GREEN_DARK,
    g(0.6),
  ],

  // ── Semantic component tokens ────────────────────────────────────────

  card: {
    bg: 'rgba(17, 85, 17, 0.3)',
    bgPressed: g(0.12),
    textPrimary: GREEN,
    textSecondary: g(0.65),
    borderColor: 'transparent',
  },

  searchBar: {
    bg: 'rgba(17, 85, 17, 0.3)',
    border: g(0.25),
    icon: g(0.25),
    text: GREEN,
    placeholder: g(0.35),
    clearIcon: g(0.35),
    cancelText: GREEN,
  },

  input: {
    bg: BLACK,
    bgSubtle: BLACK,
    border: g(0.25),
    text: GREEN,
    placeholder: g(0.35),
  },

  toggle: {
    trackBg: 'rgba(17, 85, 17, 0.3)',
    activeBg: BLACK,
    activeText: GREEN,
    inactiveText: GREEN_DARK,
    borderColor: g(0.25),
    switchTrackOff: g(0.15),
    switchTrackOn: GREEN_DARK,
    switchThumbOff: GREEN_SUBTLE,
    switchThumbOn: GREEN,
  },

  metaChip: {
    mealBg: 'rgba(17, 85, 17, 0.3)',
    mealText: GREEN,
    visibilityBg: 'rgba(17, 85, 17, 0.3)',
    visibilityText: GREEN,
  },

  checkbox: {
    checkedBg: GREEN,
    checkedBorder: GREEN,
  },

  listItem: {
    bg: 'rgba(17, 85, 17, 0.3)',
    bgActive: 'rgba(17, 85, 17, 0.3)',
    checkedText: g(0.35),
  },

  statsCard: {
    bg: 'transparent',
    borderColor: 'transparent',
  },

  dayCard: {
    bg: BLACK,
    bgToday: BLACK,
  },

  segmentedControl: {
    trackBg: 'transparent',
    activeBg: 'rgba(17, 85, 17, 0.3)',
    activeText: GREEN,
    inactiveText: g(0.25),
  },

  tones: {
    default: { bg: GREEN_DARK, fg: GREEN, pressed: GREEN_DIM },
    alt: { bg: g(0.08), fg: GREEN, pressed: g(0.15) },
    cancel: { bg: g(0.05), fg: GREEN_DIM, pressed: g(0.1) },
    warning: { bg: g(0.08), fg: GREEN, pressed: g(0.15) },
    ai: { bg: g(0.06), fg: GREEN_DIM, pressed: g(0.12) },
    glass: { bg: g(0.15), fg: GREEN, pressed: g(0.25) },
    glassSolid: { bg: g(0.15), fg: GREEN, pressed: g(0.25) },
    primary: { bg: GREEN_DARK, fg: GREEN, pressed: GREEN_DIM },
  },
};

// ── CRT visual effects — scanlines, glow, flicker ─────────────────────
export const terminalCRT: CRTConfig = {
  scanlineOpacity: 0.08,
  flickerMin: 0.97,
  flickerMs: 4000,
  glowColor: g(0.07),
  glowSpread: 60,
  glowSize: 20,
};
