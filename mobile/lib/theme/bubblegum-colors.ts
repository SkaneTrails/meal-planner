/**
 * Bubblegum theme — bold '90s-inspired candy colors.
 *
 * Saturated bubblegum pink background, solid white cards with thick
 * black borders, dark content text. Directly inspired by the Bubblegum
 * Tumblr theme: playful grid layout with sharp outlines.
 */

import type { ColorTokens } from './colors';

// ── Base palette ───────────────────────────────────────────────────────
const HOT_PINK = '#FF4D8D';
const HOT_PINK_DARK = '#E63D7A';
const HOT_PINK_LIGHT = '#FF8AB5';

const ELECTRIC_BLUE = '#3DB8F5';
const ELECTRIC_BLUE_DARK = '#2A9AD6';
const ELECTRIC_BLUE_LIGHT = '#8ED4F8';

const LIME = '#7ED321';
const SUNNY = '#FFD642';
const SUNNY_LIGHT = '#FFF0C8';
const TANGERINE = '#FF8C42';
const GRAPE = '#9B59B6';
const TURQUOISE = '#2EC4B6';
const CORAL = '#FF6B6B';

// Thick black outline — the signature Bubblegum look
const BLACK = '#1A1A1A';
const BLACK_BORDER = '#2D2D2D';

// ── Helpers ────────────────────────────────────────────────────────────
const p = (r: number, g: number, b: number, a: number) =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

// ── Palette ────────────────────────────────────────────────────────────
export const bubblegumColors: ColorTokens = {
  // Primary — hot pink
  primary: HOT_PINK,
  primaryDark: HOT_PINK_DARK,
  primaryLight: HOT_PINK_LIGHT,

  // Background — saturated bubblegum pink (matching the Tumblr theme)
  bgBase: '#F5A0C0',
  bgLight: '#F8B8D0',
  bgMid: '#F090B0',
  bgDark: '#E880A8',
  bgWarm: '#F5A0C0',

  // Accent — electric blue
  accent: ELECTRIC_BLUE,
  accentDark: ELECTRIC_BLUE_DARK,
  accentLight: ELECTRIC_BLUE_LIGHT,
  coral: CORAL,
  coralSoft: '#FF9E9E',
  gold: SUNNY,
  goldLight: '#FFE680',

  // Category colors — bold candy
  category: {
    recipes: { bg: '#FFE0EB', text: '#C0306A' },
    planned: { bg: '#D4FFD4', text: '#268026' },
    grocery: { bg: '#E0E8FF', text: '#4050B0' },
    add: { bg: '#FFF0D0', text: '#A06800' },
  },

  // Diet — saturated
  diet: {
    veggie: {
      bg: '#D4FFD4',
      text: '#268026',
      cardBg: p(126, 211, 33, 0.12),
      border: p(126, 211, 33, 0.6),
    },
    fish: {
      bg: '#D0ECFF',
      text: '#1A70C0',
      cardBg: p(61, 184, 245, 0.12),
      border: p(61, 184, 245, 0.6),
    },
    meat: {
      bg: '#FFD4D4',
      text: '#C03030',
      cardBg: p(255, 107, 107, 0.12),
      border: p(255, 107, 107, 0.6),
    },
  },

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#FFFFFF',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.9)',
    muted: 'rgba(255, 255, 255, 0.7)',
    light: 'rgba(255, 255, 255, 0.5)',
    inverse: BLACK,
    dark: '#333333',
  },
  border: 'rgba(0, 0, 0, 0.12)',
  borderLight: 'rgba(0, 0, 0, 0.25)',
  borderFaint: 'rgba(0, 0, 0, 0.1)',

  // Content — dark text on white cards (high contrast, readable)
  content: {
    heading: BLACK,
    headingMuted: 'rgba(0, 0, 0, 0.7)',
    headingWarm: '#333333',
    body: '#333333',
    secondary: '#666666',
    strong: 'rgba(0, 0, 0, 0.75)',
    tertiary: 'rgba(0, 0, 0, 0.6)',
    subtitle: 'rgba(0, 0, 0, 0.5)',
    icon: 'rgba(0, 0, 0, 0.45)',
    placeholder: 'rgba(0, 0, 0, 0.35)',
    placeholderHex: '#00000059',
  },

  // Interactive surface states
  surface: {
    overlay: 'rgba(0, 0, 0, 0.85)',
    overlayMedium: 'rgba(0, 0, 0, 0.7)',
    border: 'rgba(0, 0, 0, 0.12)',
    borderLight: 'rgba(0, 0, 0, 0.3)',
    divider: BLACK_BORDER,
    dividerSolid: BLACK_BORDER,
    modal: '#FFFFFF',
    pressed: 'rgba(0, 0, 0, 0.06)',
    active: 'rgba(0, 0, 0, 0.05)',
    subtle: 'rgba(0, 0, 0, 0.03)',
    hover: 'rgba(0, 0, 0, 0.02)',
    tint: 'rgba(0, 0, 0, 0.01)',
    sheetOverlay: 'rgba(255, 255, 255, 0.94)',
    iconBg: 'rgba(0, 0, 0, 0.06)',
  },

  // Button colors — warm yellow (matching Bubblegum Tumblr "Load more" button)
  button: {
    primary: SUNNY,
    primaryPressed: '#E6C038',
    primaryText: BLACK,
    disabled: '#FFE8B0',
    primarySubtle: p(255, 214, 66, 0.08),
    primarySurface: p(255, 214, 66, 0.1),
    primaryActive: p(255, 214, 66, 0.15),
    primaryHover: p(255, 214, 66, 0.2),
    primaryDivider: p(255, 214, 66, 0.25),
  },

  // Gray scale — neutral (not pink-tinted)
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic — bright and bold
  success: '#4ECB5C',
  successBg: '#D4FFD4',
  warning: '#FFA726',
  warningBg: '#FFF3D0',
  error: '#FF5252',
  errorBg: '#FFD4D4',
  info: '#42A5F5',
  infoBg: '#D0ECFF',
  danger: '#FF3B3B',

  // Overlay
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    backdropLight: 'rgba(0, 0, 0, 0.35)',
    strong: 'rgba(0, 0, 0, 0.6)',
    gradientHeavy: 'rgba(0, 0, 0, 0.65)',
    gradientSubtle: 'rgba(0, 0, 0, 0.12)',
  },

  // Meal plan — solid white with dark borders
  mealPlan: {
    slotBg: 'rgba(255, 255, 255, 0.95)',
    containerBg: '#FFFFFF',
    emptyBg: 'rgba(255, 255, 255, 0.8)',
    emptyStateBg: 'rgba(255, 255, 255, 0.6)',
  },

  // Ratings — bold
  rating: {
    positive: '#4ECB5C',
    negative: '#FF5252',
    positiveBg: p(78, 203, 92, 0.25),
    negativeBg: p(255, 82, 82, 0.25),
  },

  // Timeline — turquoise
  timeline: {
    badge: TURQUOISE,
    line: p(46, 196, 182, 0.2),
    completedText: '#1A8C7D',
  },

  // Chip/filter — yellow-beige like Bubblegum Tumblr date/social elements
  chip: {
    bg: SUNNY_LIGHT,
    border: BLACK_BORDER,
    divider: 'rgba(0, 0, 0, 0.2)',
    fishActive: ELECTRIC_BLUE,
    meatActive: CORAL,
    favoriteActive: HOT_PINK,
    toggleActiveBg: SUNNY,
    toggleInactiveBg: SUNNY_LIGHT,
    toggleActiveBorder: BLACK,
    toggleActiveText: BLACK,
    toggleInactiveText: '#333333',
  },

  // Shadow
  shadow: {
    text: 'rgba(0, 0, 0, 0.15)',
  },

  // Glass — solid white (no translucency — '90s web didn't do blur)
  glass: {
    light: '#FFFFFF',
    medium: '#FFFFFF',
    heavy: '#FFFFFF',
    solid: '#FFFFFF',
    bright: '#FFFFFF',
    dark: 'rgba(255, 255, 255, 0.85)',
    subtle: 'rgba(255, 255, 255, 0.75)',
    faint: 'rgba(255, 255, 255, 0.65)',
    card: '#FFFFFF',
    border: BLACK_BORDER,
    button: 'rgba(255, 255, 255, 0.5)',
    buttonPressed: 'rgba(255, 255, 255, 0.7)',
    buttonDefault: 'rgba(255, 255, 255, 0.6)',
    dim: 'rgba(255, 255, 255, 0.15)',
    pressed: 'rgba(255, 255, 255, 0.3)',
  },

  // Fixed screen header — matches page background, slightly transparent
  header: {
    bg: 'rgba(245, 160, 192, 0.85)',
    fadeEnd: 'rgba(245, 160, 192, 0)',
    shadow: '0px 1px 6px rgba(0, 0, 0, 0.06)',
    fadeWidth: 24,
  },

  // Tab bar — solid white with dark border
  tabBar: {
    bg: 'rgba(255, 255, 255, 0.95)',
    bgFallback: '#FFFFFF',
    bottomFill: '#FFFFFF',
    border: BLACK_BORDER,
    active: HOT_PINK_DARK,
    inactive: '#666666',
    focusBg: 'rgba(0, 0, 0, 0.04)',
  },

  // AI — lilac accent
  ai: {
    primary: '#9B72CF',
    primaryDark: '#7B52AF',
    bg: 'rgba(155, 114, 207, 0.08)',
    bgPressed: 'rgba(155, 114, 207, 0.18)',
    muted: 'rgba(155, 114, 207, 0.5)',
    iconBg: 'rgba(155, 114, 207, 0.12)',
    light: 'rgba(155, 114, 207, 0.15)',
    badge: 'rgba(155, 114, 207, 0.95)',
    selectedBg: 'rgba(155, 114, 207, 0.1)',
    border: 'rgba(155, 114, 207, 0.3)',
  },

  // Destructive — bold red
  destructive: {
    bg: 'rgba(255, 59, 59, 0.1)',
    icon: 'rgba(255, 59, 59, 0.8)',
    text: 'rgba(255, 59, 59, 0.9)',
  },

  // Gradient — neon candy orbs
  gradient: {
    orb1: HOT_PINK_LIGHT,
    orb2: ELECTRIC_BLUE_LIGHT,
    orb3: '#B8F0A0',
    orb4: '#FFE680',
    orb5: '#F5A0C0',
    orb6: '#A0D8F0',
    stop1: HOT_PINK_LIGHT,
    stop2: ELECTRIC_BLUE_LIGHT,
  },

  // Background overlays
  background: {
    mutedOverlay: 'rgba(0, 0, 0, 0.08)',
    defaultOverlay: 'rgba(255, 255, 255, 0.05)',
    structuredWash: 'rgba(245, 160, 192, 0.95)',
    structuredGradientStart: 'rgba(240, 144, 176, 0.2)',
    structuredGradientEnd: 'transparent',
    animatedOverlay: 'rgba(255, 255, 255, 0.05)',
  },

  // Tag dots — full '90s rainbow
  tagDot: [
    HOT_PINK,
    ELECTRIC_BLUE,
    LIME,
    SUNNY,
    TANGERINE,
    GRAPE,
    TURQUOISE,
    CORAL,
  ],

  // ── Semantic component tokens ────────────────────────────────────────

  card: {
    bg: '#FFFFFF',
    bgPressed: '#F5F5F5',
    textPrimary: BLACK,
    textSecondary: '#666666',
    borderColor: BLACK_BORDER,
  },

  searchBar: {
    bg: ELECTRIC_BLUE_LIGHT,
    border: BLACK_BORDER,
    icon: '#2A5080',
    text: BLACK,
    placeholder: '#4080A0',
    clearIcon: 'rgba(0, 0, 0, 0.5)',
    cancelText: HOT_PINK,
  },

  input: {
    bg: ELECTRIC_BLUE_LIGHT,
    bgSubtle: 'rgba(61, 184, 245, 0.08)',
    border: BLACK_BORDER,
    text: BLACK,
    placeholder: '#4080A0',
  },

  toggle: {
    trackBg: 'rgba(255, 255, 255, 0.7)',
    activeBg: '#FFFFFF',
    activeText: BLACK,
    inactiveText: '#666666',
    borderColor: BLACK_BORDER,
    switchTrackOff: 'rgba(0, 0, 0, 0.15)',
    switchTrackOn: HOT_PINK,
    switchThumbOff: '#CCCCCC',
    switchThumbOn: '#FFFFFF',
  },

  metaChip: {
    mealBg: SUNNY_LIGHT,
    mealText: BLACK,
    visibilityBg: SUNNY_LIGHT,
    visibilityText: BLACK,
  },

  checkbox: {
    checkedBg: TURQUOISE,
    checkedBorder: BLACK_BORDER,
  },

  listItem: {
    bg: '#FFFFFF',
    bgActive: '#F5F5F5',
    checkedText: 'rgba(0, 0, 0, 0.4)',
  },

  statsCard: {
    bg: '#FFFFFF',
    borderColor: BLACK_BORDER,
  },

  dayCard: {
    bg: '#FFFFFF',
    bgToday: '#FFFFFF',
  },

  segmentedControl: {
    trackBg: 'rgba(0, 0, 0, 0.04)',
    activeBg: '#FFFFFF',
    activeText: BLACK,
    inactiveText: '#666666',
  },

  tones: {
    default: { bg: SUNNY, fg: BLACK, pressed: '#E6C038' },
    alt: {
      bg: 'rgba(0, 0, 0, 0.06)',
      fg: '#333333',
      pressed: 'rgba(0, 0, 0, 0.12)',
    },
    cancel: {
      bg: 'rgba(0, 0, 0, 0.04)',
      fg: 'rgba(0, 0, 0, 0.5)',
      pressed: 'rgba(0, 0, 0, 0.1)',
    },
    warning: {
      bg: 'rgba(255, 59, 59, 0.12)',
      fg: '#FF3B3B',
      pressed: 'rgba(255, 59, 59, 0.22)',
    },
    ai: {
      bg: 'rgba(155, 114, 207, 0.1)',
      fg: '#9B72CF',
      pressed: 'rgba(155, 114, 207, 0.2)',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.5)',
      fg: '#FFFFFF',
      pressed: 'rgba(255, 255, 255, 0.7)',
    },
    glassSolid: {
      bg: '#FFFFFF',
      fg: BLACK,
      pressed: 'rgba(255, 255, 255, 0.85)',
    },
    glassAi: {
      bg: '#FFFFFF',
      fg: '#9B72CF',
      pressed: 'rgba(255, 255, 255, 0.85)',
    },
    glassSubtle: {
      bg: '#FFFFFF',
      fg: '#666666',
      pressed: 'rgba(255, 255, 255, 0.3)',
    },
    glassCoral: {
      bg: 'rgba(255, 255, 255, 0.5)',
      fg: CORAL,
      pressed: 'rgba(255, 255, 255, 0.7)',
    },
    primary: {
      bg: HOT_PINK,
      fg: '#FFFFFF',
      pressed: HOT_PINK_DARK,
    },
    subtle: {
      bg: 'rgba(0, 0, 0, 0.02)',
      fg: 'rgba(0, 0, 0, 0.45)',
      pressed: 'rgba(0, 0, 0, 0.06)',
    },
    danger: {
      bg: '#FF3B3B',
      fg: '#FFFFFF',
      pressed: '#E02020',
    },
  },
};
