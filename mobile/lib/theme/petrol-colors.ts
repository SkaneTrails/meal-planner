/**
 * Petrol theme — modern minimalist palette built around a deep
 * petrol-blue accent.
 *
 * Cool off-white surfaces, generous neutrals, ink-dark text, and a
 * single confident accent color (`#0E5C6F`) used sparingly for primary
 * actions, focus, and brand moments. Designed to feel calm, editorial,
 * and contemporary — the antithesis of the warm "Elegant" palette.
 */

import type { ColorTokens } from './colors';

// ── Base palette ───────────────────────────────────────────────────────

/** Signature petrol — deep blue-green, the only saturated color. */
const PETROL = '#0E5C6F';
const PETROL_DARK = '#0A4654';
const _PETROL_DEEP = '#073744';
const PETROL_LIGHT = '#3A8A9C';
const PETROL_SOFT = '#7FB5BF';
const PETROL_TINT = '#D4E6EA';
const PETROL_WASH = '#EAF2F4';

/** Cool, paper-like neutrals. */
const PAPER = '#F7F8F8';
const PAPER_LIGHT = '#FCFCFC';
const PAPER_MID = '#F1F2F3';
const PAPER_DEEP = '#E7E9EA';

/** Ink — near-black with a faint cool cast for headings/body. */
const INK = '#11181C';
const INK_BODY = '#1F2A2E';
const INK_MUTED = '#5A6A6E';
const INK_SOFT = '#8A969A';
const INK_FAINT = '#B7BFC2';

// ── Helpers ────────────────────────────────────────────────────────────

const rgba = (r: number, g: number, b: number, a: number): string =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

/** Petrol at varying alpha — used for subtle surfaces, hovers, focus. */
const petrolA = (a: number): string => rgba(14, 92, 111, a);
/** Ink at varying alpha — used for borders, dividers, secondary text. */
const inkA = (a: number): string => rgba(17, 24, 28, a);

// ── Palette ────────────────────────────────────────────────────────────

export const petrolColors: ColorTokens = {
  // Primary — deep ink, used for high-emphasis text and structural anchors.
  primary: INK,
  primaryDark: '#000000',
  primaryLight: INK_BODY,

  // Backgrounds — cool paper neutrals.
  bgBase: PAPER,
  bgLight: PAPER_LIGHT,
  bgMid: PAPER_MID,
  bgDark: PAPER_DEEP,
  bgWarm: PAPER,

  // Accent — petrol, the single saturated brand color.
  accent: PETROL,
  accentDark: PETROL_DARK,
  accentLight: PETROL_SOFT,
  coral: PETROL_LIGHT,
  coralSoft: PETROL_TINT,
  gold: '#B89968',
  goldLight: '#E5D9C2',

  // Category colors — desaturated, on cool washes.
  category: {
    recipes: { bg: PETROL_WASH, text: PETROL_DARK },
    planned: { bg: PAPER_MID, text: INK_BODY },
    grocery: { bg: '#EFEFF1', text: INK_BODY },
    add: { bg: PETROL_TINT, text: PETROL_DARK },
  },

  // Diet — muted, modern.
  diet: {
    veggie: {
      bg: '#E6EFE6',
      text: '#3F6B45',
      cardBg: rgba(63, 107, 69, 0.1),
      border: rgba(63, 107, 69, 0.55),
    },
    fish: {
      bg: PETROL_WASH,
      text: PETROL_DARK,
      cardBg: petrolA(0.1),
      border: petrolA(0.55),
    },
    meat: {
      bg: '#F1E2E0',
      text: '#8C3F39',
      cardBg: rgba(140, 63, 57, 0.1),
      border: rgba(140, 63, 57, 0.55),
    },
  },

  // Neutrals
  white: '#FFFFFF',
  offWhite: PAPER_LIGHT,
  text: {
    primary: INK,
    secondary: INK_MUTED,
    muted: INK_SOFT,
    light: INK_FAINT,
    inverse: INK,
    dark: INK,
  },
  border: inkA(0.1),
  borderLight: inkA(0.06),
  borderFaint: inkA(0.03),

  // Content — ink hierarchy.
  content: {
    heading: INK,
    headingMuted: inkA(0.7),
    headingWarm: INK_BODY,
    body: INK_BODY,
    secondary: INK_MUTED,
    strong: inkA(0.85),
    tertiary: inkA(0.65),
    subtitle: inkA(0.55),
    icon: inkA(0.5),
    placeholder: inkA(0.4),
    placeholderHex: '#11181C66',
  },

  // Interactive surfaces — nearly invisible washes.
  surface: {
    overlay: inkA(0.85),
    overlayMedium: inkA(0.7),
    border: inkA(0.1),
    borderLight: inkA(0.07),
    divider: inkA(0.08),
    dividerSolid: PAPER_DEEP,
    modal: '#FFFFFF',
    pressed: inkA(0.06),
    active: inkA(0.04),
    subtle: inkA(0.03),
    hover: inkA(0.02),
    tint: inkA(0.015),
    sheetOverlay: 'rgba(247, 248, 248, 0.96)',
    iconBg: petrolA(0.08),
  },

  // Buttons — petrol primary.
  button: {
    primary: PETROL,
    primaryPressed: PETROL_DARK,
    primaryText: '#FFFFFF',
    disabled: '#C5CDCF',
    primarySubtle: petrolA(0.06),
    primarySurface: petrolA(0.08),
    primaryActive: petrolA(0.12),
    primaryHover: petrolA(0.16),
    primaryDivider: petrolA(0.22),
  },

  // Neutral gray scale.
  gray: {
    50: '#FAFAFA',
    100: '#F4F5F5',
    200: '#E8EAEA',
    300: '#D4D7D8',
    400: '#A8ADAF',
    500: '#7C8285',
    600: '#5C6266',
    700: '#42484B',
    800: '#2A2F32',
    900: '#15191B',
  },

  // Semantic — restrained, modern hues.
  success: '#3F8C5C',
  successBg: '#E5F1EA',
  warning: '#C58A2C',
  warningBg: '#F7EFDD',
  error: '#C24A45',
  errorBg: '#F4E1E0',
  info: PETROL,
  infoBg: PETROL_WASH,
  danger: '#B23A35',

  // Overlays — neutral darks.
  overlay: {
    backdrop: 'rgba(17, 24, 28, 0.5)',
    backdropLight: 'rgba(17, 24, 28, 0.35)',
    strong: 'rgba(17, 24, 28, 0.65)',
    gradientHeavy: 'rgba(17, 24, 28, 0.7)',
    gradientSubtle: 'rgba(17, 24, 28, 0.12)',
  },

  // Meal plan surfaces — clean white tinted with petrol wash.
  mealPlan: {
    slotBg: 'rgba(255, 255, 255, 0.92)',
    containerBg: 'rgba(255, 255, 255, 0.98)',
    emptyBg: 'rgba(247, 248, 248, 0.7)',
    emptyStateBg: 'rgba(234, 242, 244, 0.5)',
  },

  // Ratings — calm green / muted red.
  rating: {
    positive: '#5A8A6B',
    negative: '#B25A55',
    positiveBg: 'rgba(90, 138, 107, 0.22)',
    negativeBg: 'rgba(178, 90, 85, 0.22)',
  },

  // Timeline — petrol spine.
  timeline: {
    badge: PETROL,
    line: petrolA(0.18),
    completedText: PETROL_DARK,
  },

  // Chips / filters — unified soft wash (DE-style minimalism).
  chip: {
    bg: inkA(0.04),
    border: 'transparent',
    divider: inkA(0.06),
    fishActive: PETROL,
    meatActive: '#8C3F39',
    favoriteActive: '#B23A35',
    mealTypeActive: PETROL_DARK,
    toggleActiveBg: petrolA(0.1),
    toggleInactiveBg: inkA(0.04),
    toggleActiveBorder: 'transparent',
    toggleActiveText: PETROL_DARK,
    toggleInactiveText: INK_BODY,
  },

  // Text shadow.
  shadow: {
    text: 'rgba(0, 0, 0, 0.12)',
  },

  // Glass — crisp, near-opaque whites.
  glass: {
    light: 'rgba(255, 255, 255, 0.94)',
    medium: 'rgba(255, 255, 255, 0.82)',
    heavy: 'rgba(255, 255, 255, 0.97)',
    solid: '#FFFFFF',
    bright: 'rgba(255, 255, 255, 0.94)',
    dark: 'rgba(255, 255, 255, 0.65)',
    subtle: 'rgba(255, 255, 255, 0.6)',
    faint: 'rgba(255, 255, 255, 0.5)',
    card: 'rgba(255, 255, 255, 0.95)',
    border: inkA(0.05),
    button: 'rgba(255, 255, 255, 0.35)',
    buttonPressed: 'rgba(255, 255, 255, 0.5)',
    buttonDefault: 'rgba(255, 255, 255, 0.4)',
    dim: 'rgba(255, 255, 255, 0.1)',
    pressed: 'rgba(255, 255, 255, 0.18)',
  },

  // Fixed header — page bg with slight transparency.
  header: {
    bg: 'rgba(247, 248, 248, 0.88)',
    fadeEnd: 'rgba(247, 248, 248, 0)',
    shadow: '0px 1px 8px rgba(17, 24, 28, 0.06)',
    fadeWidth: 24,
  },

  // Tab bar — minimal floating bar (matches Elegant chrome).
  tabBar: {
    bg: 'rgba(255, 255, 255, 0.7)',
    bgFallback: 'rgba(255, 255, 255, 0.92)',
    bottomFill: PAPER,
    border: inkA(0.06),
    active: PETROL,
    inactive: INK_MUTED,
    focusBg: petrolA(0.08),
  },

  // AI accent — leans on petrol family for cohesion.
  ai: {
    primary: PETROL,
    primaryDark: PETROL_DARK,
    bg: petrolA(0.07),
    bgPressed: petrolA(0.16),
    muted: petrolA(0.5),
    iconBg: petrolA(0.1),
    light: petrolA(0.13),
    badge: petrolA(0.95),
    selectedBg: petrolA(0.1),
    border: petrolA(0.28),
  },

  // Destructive — modern muted red.
  destructive: {
    bg: 'rgba(178, 58, 53, 0.1)',
    icon: 'rgba(178, 58, 53, 0.85)',
    text: 'rgba(178, 58, 53, 0.92)',
  },

  // Decorative gradient — cool mist with petrol depth.
  gradient: {
    orb1: '#EAF2F4',
    orb2: '#D4E6EA',
    orb3: '#E7E9EA',
    orb4: PETROL_SOFT,
    orb5: '#F1F4F5',
    orb6: PETROL_LIGHT,
    stop1: '#D4E6EA',
    stop2: '#EAF2F4',
  },

  // Background overlays for GradientBackground.
  background: {
    mutedOverlay: 'rgba(17, 24, 28, 0.08)',
    defaultOverlay: 'rgba(255, 255, 255, 0.06)',
    structuredWash: 'rgba(247, 248, 248, 0.96)',
    structuredGradientStart: 'rgba(212, 230, 234, 0.18)',
    structuredGradientEnd: 'transparent',
    animatedOverlay: 'rgba(255, 255, 255, 0.06)',
  },

  // Tag dots — restrained palette built around petrol family.
  tagDot: [
    PETROL, // petrol
    '#5A8A9A', // dusty teal
    '#7C9A8A', // sage
    '#B89968', // warm tan
    '#8C3F39', // brick
    '#5A6A8A', // slate blue
    '#9A7C8A', // mauve
    '#3F6B45', // forest
  ] as readonly string[],

  // ── Semantic component tokens ────────────────────────────────────────

  card: {
    bg: 'rgba(255, 255, 255, 0.95)',
    bgPressed: 'rgba(255, 255, 255, 0.88)',
    textPrimary: INK,
    textSecondary: INK_MUTED,
    borderColor: inkA(0.05),
  },

  searchBar: {
    bg: 'rgba(255, 255, 255, 0.95)',
    border: inkA(0.06),
    icon: INK_MUTED,
    text: INK,
    placeholder: INK_SOFT,
    clearIcon: 'rgba(255, 255, 255, 0.6)',
    cancelText: PETROL,
  },

  input: {
    bg: 'rgba(255, 255, 255, 0.95)',
    bgSubtle: inkA(0.03),
    border: 'transparent',
    text: INK,
    placeholder: INK_SOFT,
  },

  toggle: {
    trackBg: 'rgba(255, 255, 255, 0.4)',
    activeBg: 'rgba(255, 255, 255, 0.9)',
    activeText: INK,
    inactiveText: INK_MUTED,
    borderColor: 'transparent',
    switchTrackOff: inkA(0.18),
    switchTrackOn: PETROL,
    switchThumbOff: '#D4D7D8',
    switchThumbOn: '#FFFFFF',
  },

  metaChip: {
    mealBg: inkA(0.04),
    mealText: INK_BODY,
    visibilityBg: inkA(0.04),
    visibilityText: INK_BODY,
  },

  checkbox: {
    checkedBg: PETROL,
    checkedBorder: PETROL,
  },

  listItem: {
    bg: 'rgba(255, 255, 255, 0.96)',
    bgActive: '#FFFFFF',
    checkedText: INK_SOFT,
  },

  // Stats cards (home screen) — borderless, soft shadow only.
  statsCard: {
    bg: '#FFFFFF',
    borderColor: 'transparent',
  },

  dayCard: {
    bg: 'rgba(255, 255, 255, 0.96)',
    bgToday: petrolA(0.08),
  },

  segmentedControl: {
    trackBg: inkA(0.04),
    activeBg: '#FFFFFF',
    activeText: INK,
    inactiveText: INK_MUTED,
  },

  tones: {
    default: { bg: PETROL, fg: '#FFFFFF', pressed: PETROL_DARK },
    alt: {
      bg: inkA(0.06),
      fg: INK,
      pressed: inkA(0.12),
    },
    cancel: {
      bg: inkA(0.05),
      fg: INK_MUTED,
      pressed: inkA(0.1),
    },
    warning: {
      bg: 'rgba(178, 58, 53, 0.1)',
      fg: '#B23A35',
      pressed: 'rgba(178, 58, 53, 0.2)',
    },
    ai: {
      bg: petrolA(0.08),
      fg: PETROL,
      pressed: petrolA(0.18),
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.6)',
      fg: PETROL_DARK,
      pressed: 'rgba(255, 255, 255, 0.8)',
    },
    glassSolid: {
      // Soft petrol-tinted wash so icon buttons read as actual buttons
      // against the white card surface (instead of bare floating icons).
      bg: petrolA(0.07),
      fg: PETROL_DARK,
      pressed: petrolA(0.13),
    },
    glassAi: {
      bg: petrolA(0.07),
      fg: PETROL,
      pressed: petrolA(0.13),
    },
    glassSubtle: {
      bg: inkA(0.04),
      fg: INK_MUTED,
      pressed: inkA(0.08),
    },
    glassCoral: {
      bg: 'rgba(255, 255, 255, 0.35)',
      fg: PETROL_LIGHT,
      pressed: 'rgba(255, 255, 255, 0.5)',
    },
    subtle: {
      bg: inkA(0.04),
      fg: INK_MUTED,
      pressed: inkA(0.1),
    },
    danger: {
      bg: '#B23A35',
      fg: '#FFFFFF',
      pressed: '#8E2C28',
    },
  },
};
