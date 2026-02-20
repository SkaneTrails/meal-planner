/**
 * Color palette - luxurious design system with elegant warm tones.
 */

/** Recursively widen color literal types to `string` for structural contracts. */
type WidenColors<T> = T extends readonly string[]
  ? readonly string[]
  : T extends string
    ? string
    : { readonly [K in keyof T]: WidenColors<T[K]> };

export const lightColors = {
  // Primary - Elegant dark charcoal
  primary: '#2D2D2D',
  primaryDark: '#1A1A1A',
  primaryLight: '#404040',

  // Background gradients - warm peach/brown tones
  bgBase: '#E8D8C8',
  bgLight: '#FDF6F0',
  bgMid: '#F5E1D0',
  bgDark: '#E8CDB5',
  bgWarm: '#FFEEE0',

  // Accent colors - Coral/Peach for luxury feel
  accent: '#E8A87C',
  accentDark: '#D4956A',
  accentLight: '#FFD4B8',
  coral: '#FF8A65',
  coralSoft: '#FFAB91',
  gold: '#C9A962',
  goldLight: '#E8D5A3',

  // Category colors (luxurious pastels)
  category: {
    recipes: { bg: '#FFF0E5', text: '#8B5A3C' },
    planned: { bg: '#E8F5E9', text: '#2E7D32' },
    grocery: { bg: '#F3E5F5', text: '#7B1FA2' },
    add: { bg: '#FFF3E0', text: '#E65100' },
  },

  // Diet label colors (refined pastels)
  diet: {
    veggie: {
      bg: '#E8F5E9',
      text: '#2E7D32',
      cardBg: 'rgba(78, 154, 89, 0.12)',
      border: 'rgba(76, 175, 80, 0.7)',
    },
    fish: {
      bg: '#E3F2FD',
      text: '#1565C0',
      cardBg: 'rgba(21, 101, 192, 0.12)',
      border: 'rgba(66, 165, 245, 0.7)',
    },
    meat: {
      bg: '#FFEBEE',
      text: '#C62828',
      cardBg: 'rgba(180, 80, 70, 0.12)',
      border: 'rgba(229, 115, 115, 0.7)',
    },
  },

  // Neutrals - refined gray scale with warmth
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    muted: 'rgba(255, 255, 255, 0.6)',
    light: 'rgba(255, 255, 255, 0.4)',
    inverse: '#2D2D2D',
    dark: '#5D4E40',
  },
  border: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderFaint: 'rgba(255, 255, 255, 0.04)',

  // Content colors — dark text/icons on light backgrounds (warm brown family)
  content: {
    heading: '#3D3D3D',
    headingMuted: 'rgba(45, 45, 45, 0.75)',
    headingWarm: '#4A3728',
    body: '#5D4E40',
    secondary: '#8B7355',
    strong: 'rgba(93, 78, 64, 0.8)',
    tertiary: 'rgba(93, 78, 64, 0.7)',
    subtitle: 'rgba(93, 78, 64, 0.6)',
    icon: 'rgba(93, 78, 64, 0.5)',
    placeholder: 'rgba(93, 78, 64, 0.4)',
    placeholderHex: '#8B735580',
  },

  // Interactive surface states — warm brown at various opacities
  surface: {
    overlay: 'rgba(93, 78, 64, 0.85)',
    overlayMedium: 'rgba(93, 78, 64, 0.75)',
    border: 'rgba(93, 78, 64, 0.3)',
    borderLight: 'rgba(93, 78, 64, 0.25)',
    divider: 'rgba(93, 78, 64, 0.2)',
    dividerSolid: '#D4C5B5',
    modal: '#F5EDE5',
    pressed: 'rgba(93, 78, 64, 0.15)',
    active: 'rgba(93, 78, 64, 0.12)',
    subtle: 'rgba(93, 78, 64, 0.1)',
    hover: 'rgba(93, 78, 64, 0.08)',
    tint: 'rgba(93, 78, 64, 0.06)',
  },

  // Button colors
  button: {
    primary: '#7A6858',
    primaryPressed: '#6B5B4B',
    primaryText: '#FFFFFF',
    disabled: '#C5B8A8',
    primarySubtle: 'rgba(122, 104, 88, 0.08)',
    primarySurface: 'rgba(122, 104, 88, 0.1)',
    primaryActive: 'rgba(122, 104, 88, 0.12)',
    primaryHover: 'rgba(122, 104, 88, 0.15)',
    primaryDivider: 'rgba(122, 104, 88, 0.2)',
  },

  // Refined gray scale
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

  // Semantic (refined)
  success: '#4CAF50',
  successBg: '#E8F5E9',
  warning: '#FF9800',
  warningBg: '#FFF3E0',
  error: '#EF5350',
  errorBg: '#FFEBEE',
  info: '#42A5F5',
  infoBg: '#E3F2FD',
  danger: '#DC2626',

  // Overlay / backdrop
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    backdropLight: 'rgba(0, 0, 0, 0.4)',
    strong: 'rgba(0, 0, 0, 0.6)',
  },

  // Meal plan surfaces — warm beige at various opacities
  mealPlan: {
    slotBg: 'rgba(240, 235, 228, 0.85)',
    containerBg: 'rgba(245, 240, 235, 0.95)',
    emptyBg: 'rgba(245, 242, 238, 0.7)',
    emptyStateBg: 'rgba(240, 235, 228, 0.5)',
  },

  // Recipe rating — thumb up/down
  rating: {
    positive: '#4A8B5C',
    negative: '#B0645C',
    positiveBg: 'rgba(76, 175, 80, 0.3)',
    negativeBg: 'rgba(239, 83, 80, 0.3)',
  },

  // Instruction timeline — recipe detail
  timeline: {
    badge: '#2D6A5A',
    line: 'rgba(45, 106, 90, 0.15)',
    completedText: '#166534',
  },

  // Chip/filter pill colors
  chip: {
    bg: 'rgba(232, 222, 212, 0.7)',
    border: 'rgba(139, 115, 85, 0.3)',
    divider: 'rgba(139, 115, 85, 0.15)',
    fishActive: '#2D7AB8',
    meatActive: '#B85C38',
    favoriteActive: '#C75050',
    toggleActiveBg: 'rgba(93, 78, 64, 0.12)',
    toggleInactiveBg: '#FFFFFF',
    toggleActiveBorder: '#4A3728',
    toggleActiveText: '#4A3728',
    toggleInactiveText: '#4A3728',
  },

  // Shadow colors — baked-in alpha for textShadow (no separate opacity prop)
  shadow: {
    text: 'rgba(0, 0, 0, 0.15)',
  },

  // Glass/Blur effects - near-solid surfaces for app-like feel
  glass: {
    light: 'rgba(255, 255, 255, 0.88)',
    medium: 'rgba(255, 255, 255, 0.78)',
    heavy: 'rgba(255, 255, 255, 0.95)',
    solid: 'rgba(255, 255, 255, 0.92)',
    bright: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(255, 255, 255, 0.65)',
    subtle: 'rgba(255, 255, 255, 0.6)',
    faint: 'rgba(255, 255, 255, 0.5)',
    card: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(0, 0, 0, 0.04)',
    button: 'rgba(255, 255, 255, 0.3)',
    buttonPressed: 'rgba(255, 255, 255, 0.45)',
    buttonDefault: 'rgba(255, 255, 255, 0.35)',
    dim: 'rgba(255, 255, 255, 0.08)',
  },

  // Tab bar — acrylic floating nav
  tabBar: {
    bg: 'rgba(235, 228, 219, 0.5)',
    bgFallback: 'rgba(235, 228, 219, 0.85)',
    bottomFill: '#EBE4DB',
    border: 'rgba(93, 78, 64, 0.1)',
    active: '#5D4E40',
    inactive: '#8B7355',
    focusBg: 'rgba(93, 78, 64, 0.12)',
  },

  // AI enhancement theming — unified sage green palette
  ai: {
    primary: '#6B8E6B',
    primaryDark: '#5A7A5A',
    bg: 'rgba(107, 142, 107, 0.08)',
    bgPressed: 'rgba(107, 142, 107, 0.18)',
    muted: 'rgba(107, 142, 107, 0.5)',
    iconBg: 'rgba(107, 142, 107, 0.12)',
    light: 'rgba(107, 142, 107, 0.15)',
    badge: 'rgba(107, 142, 107, 0.95)',
    selectedBg: 'rgba(107, 142, 107, 0.1)',
    border: 'rgba(107, 142, 107, 0.3)',
  },

  // Destructive action — warm red for delete/clear actions
  destructive: {
    bg: 'rgba(180, 80, 70, 0.1)',
    icon: 'rgba(180, 80, 70, 0.8)',
    text: 'rgba(180, 80, 70, 0.9)',
  },

  // Gradient decorative — animated background orbs and gradient stops
  gradient: {
    orb1: '#E8D0C0',
    orb2: '#D4A080',
    orb3: '#E0B090',
    orb4: '#C88060',
    stop1: '#D8B8A0',
    stop2: '#D0A080',
  },

  // Background overlays — used by GradientBackground to tint/cover the base image
  background: {
    mutedOverlay: 'rgba(0, 0, 0, 0.15)',
    defaultOverlay: 'rgba(255, 255, 255, 0.08)',
    structuredWash: 'rgba(235, 228, 219, 0.96)',
    structuredGradientStart: 'rgba(210, 200, 190, 0.15)',
    structuredGradientEnd: 'transparent',
    animatedOverlay: 'rgba(255, 255, 255, 0.08)',
  },

  // Tag dot colors — muted palette for note/suggestion tags
  tagDot: [
    '#7A9BBD', // steel blue
    '#8B9D77', // sage green
    '#C47D5A', // terracotta
    '#9B7BB8', // lavender
    '#5BA3A3', // teal
    '#D4A574', // amber
    '#B07070', // dusty rose
    '#6B8FA3', // slate blue
  ] as readonly string[],

  // ── Semantic component tokens ────────────────────────────────────────
  // Eliminate per-component CRT overrides — each theme sets correct values.

  // Card / container surfaces
  card: {
    bg: 'rgba(255, 255, 255, 0.85)',
    bgPressed: 'rgba(255, 255, 255, 0.78)',
    textPrimary: '#2D2D2D',
    textSecondary: '#757575',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },

  // Search bar (RecipeFilters)
  searchBar: {
    bg: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(0, 0, 0, 0.04)',
    icon: '#8B7355',
    text: '#5D4E40',
    placeholder: '#8B7355',
    clearIcon: 'rgba(255, 255, 255, 0.6)',
    cancelText: '#7A6858',
  },

  // Text input fields
  input: {
    bg: 'rgba(255, 255, 255, 0.88)',
    bgSubtle: 'rgba(93, 78, 64, 0.06)',
    border: 'transparent',
    text: '#2D2D2D',
    placeholder: '#9E9E9E',
  },

  // Original/Enhanced toggle (recipe detail)
  toggle: {
    trackBg: 'rgba(255, 255, 255, 0.4)',
    activeBg: 'rgba(255, 255, 255, 0.85)',
    activeText: '#5D4E40',
    inactiveText: 'rgba(93, 78, 64, 0.5)',
    borderColor: 'transparent',
  },

  // Recipe detail meta chips (meal type, visibility)
  metaChip: {
    mealBg: '#E8CDB5',
    mealText: '#2D2D2D',
    visibilityBg: 'rgba(255, 255, 255, 0.92)',
    visibilityText: '#2D2D2D',
  },

  // Checkbox (grocery list)
  checkbox: {
    checkedBg: '#6B8E6B',
    checkedBorder: '#6B8E6B',
  },

  // List item rows (grocery)
  listItem: {
    bg: 'rgba(255, 255, 255, 0.92)',
    bgActive: '#FFFFFF',
    checkedText: 'rgba(93, 78, 64, 0.6)',
  },

  // Stats cards (home screen)
  statsCard: {
    bg: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },

  // Meal plan day card container
  dayCard: {
    bg: 'rgba(255, 255, 255, 0.92)',
    bgToday: 'rgba(255, 255, 255, 0.95)',
  },

  // Segmented tab control (select-recipe)
  segmentedControl: {
    trackBg: 'rgba(93, 78, 64, 0.06)',
    activeBg: '#FFFFFF',
    activeText: '#3D3D3D',
    inactiveText: 'rgba(93, 78, 64, 0.6)',
  },
} as const;

/** Structural contract that every color palette must satisfy. */
export type ColorTokens = WidenColors<typeof lightColors>;

// Export colors (light theme only)
export const colors = lightColors;
