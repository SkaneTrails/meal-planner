/**
 * Theme constants for consistent styling across the app.
 * Luxurious design system with elegant typography, soft colors, and premium feel.
 */

// Font families - DM Sans for everything (unified font)
export const fontFamily = {
  // Display/Headings - DM Sans Bold for consistency
  display: 'DMSans_600SemiBold',
  displayRegular: 'DMSans_400Regular',
  displayMedium: 'DMSans_500Medium',
  displayBold: 'DMSans_700Bold',
  // Body text - modern sans-serif (DM Sans)
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemibold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  // Accent text - for labels (DM Sans medium)
  accent: 'DMSans_500Medium',
};

// Typography scale - refined for luxury feel
export const fontSize = {
  xs: 10,      // Tiny labels
  sm: 11,      // Small labels, timestamps
  base: 12,    // Secondary text, captions
  md: 13,      // Body text small
  lg: 14,      // Body text
  xl: 15,      // Emphasized body
  '2xl': 17,   // Section titles
  '3xl': 20,   // Subheadings
  '4xl': 26,   // Page titles
  '5xl': 32,   // Hero stats
  '6xl': 40,   // Display text
} as const;

// Font weights for typography hierarchy
export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Letter spacing for typography refinement
export const letterSpacing = {
  tighter: -0.8,  // Large display text
  tight: -0.5,    // Page titles
  normal: -0.2,   // Section titles
  wide: 0.8,      // Uppercase labels
  wider: 1.2,     // Small caps
} as const;

// ============================================
// LUXURIOUS COLOR PALETTE
// Inspired by premium apps: soft creams, warm corals, elegant neutrals
// ============================================

export const lightColors = {
  // Primary - Elegant dark charcoal
  primary: '#2D2D2D',
  primaryDark: '#1A1A1A',
  primaryLight: '#404040',

  // Background gradients - warm peach/brown tones
  bgLight: '#FDF6F0',      // Soft peach white
  bgMid: '#F5E1D0',        // Warm peach
  bgDark: '#E8CDB5',       // Soft brown/tan
  bgWarm: '#FFEEE0',       // Light peach

  // Accent colors - Coral/Peach for luxury feel
  accent: '#E8A87C',       // Soft coral
  accentDark: '#D4956A',   // Deeper coral
  accentLight: '#FFD4B8',  // Light peach
  coral: '#FF8A65',        // Vibrant coral
  coralSoft: '#FFAB91',    // Soft coral
  gold: '#C9A962',         // Elegant gold
  goldLight: '#E8D5A3',    // Light gold

  // Category colors (luxurious pastels)
  category: {
    recipes: { bg: '#FFF0E5', text: '#8B5A3C' },
    planned: { bg: '#E8F5E9', text: '#2E7D32' },
    grocery: { bg: '#F3E5F5', text: '#7B1FA2' },
    add: { bg: '#FFF3E0', text: '#E65100' },
  },

  // Diet label colors (refined pastels)
  diet: {
    veggie: { bg: '#E8F5E9', text: '#2E7D32' },
    fish: { bg: '#E3F2FD', text: '#1565C0' },
    meat: { bg: '#FFEBEE', text: '#C62828' },
  },

  // Neutrals - refined gray scale with warmth
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  text: {
    primary: '#FFFFFF',          // White for main text (on dark bg)
    secondary: 'rgba(255, 255, 255, 0.8)',  // Light for body text
    muted: 'rgba(255, 255, 255, 0.6)',      // Soft white for hints
    light: 'rgba(255, 255, 255, 0.4)',      // Very soft white
    inverse: '#2D2D2D',          // Dark text for light backgrounds (modals)
    dark: '#2D2D2D',             // Dark text alias
  },
  border: 'rgba(255, 255, 255, 0.2)',   // Subtle light border
  borderLight: 'rgba(255, 255, 255, 0.1)', // Very subtle border

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

  // Glass/Blur effects - for transparent cards on warm background
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(255, 255, 255, 0.55)',
    dark: 'rgba(255, 255, 255, 0.4)',
    card: 'rgba(255, 255, 255, 0.6)',
    border: 'transparent',
  },
} as const;

// Export colors (light theme only)
export const colors = lightColors;

// Spacing scale - consistent rhythm
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// Layout constants
export const layout = {
  screenPaddingTop: 60,      // Consistent header padding
  screenPaddingHorizontal: 20,
  sectionGap: 24,            // Gap between sections
  cardGap: 8,                // Gap between cards
  tabBarHeight: 88,          // Tab bar + safe area
} as const;

// Border radius - standardized to 3 sizes
export const borderRadius = {
  sm: 12,      // Small elements, chips, badges
  md: 16,      // Cards, inputs, buttons
  lg: 20,      // Large cards, modals
  xl: 24,      // Extra large, floating elements
  full: 9999,  // Circles, pills
} as const;

// Icon sizes - standardized
export const iconSize = {
  xs: 14,      // Inline with small text
  sm: 16,      // Inline with body text
  md: 18,      // Standard icons
  lg: 20,      // Emphasized icons
  xl: 24,      // Large icons
  '2xl': 32,   // Section header icons
  '3xl': 40,   // Hero icons
} as const;

// Icon container sizes (circles around icons)
export const iconContainer = {
  sm: 32,      // Inline section headers
  md: 40,      // Standard icon circles
  lg: 48,      // Large icon circles
  xl: 56,      // Extra large (like meal images)
  '2xl': 80,   // Empty state illustrations
} as const;

// Shadow presets - refined for luxurious feel
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  // Special glow shadows for accent elements
  glow: {
    shadowColor: '#E8A87C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glowSoft: {
    shadowColor: '#E8A87C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

// Animation durations - smooth, premium feel
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 100,
  },
} as const;

// Composable style helpers
export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  ...shadows.md,
} as const;

export const glassCardStyle = {
  backgroundColor: colors.glass.light,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
  ...shadows.sm,
} as const;

export const inputStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: fontSize.lg,
  color: colors.text.primary,
} as const;

// ============================================
// TYPOGRAPHY PRESETS
// Use these for consistent font rendering across platforms
// On iOS/Android, fontWeight alone doesn't work - must use specific font family
// ============================================

export const typography = {
  // Display/Headers - DM Sans
  displayLarge: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['6xl'],
    letterSpacing: letterSpacing.tighter,
  },
  displayMedium: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['4xl'],
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['3xl'],
    letterSpacing: letterSpacing.normal,
  },

  // Headings - DM Sans Bold/Semibold
  headingLarge: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize['3xl'],
    letterSpacing: letterSpacing.normal,
  },
  headingMedium: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize['2xl'],
    letterSpacing: letterSpacing.normal,
  },
  headingSmall: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.xl,
    letterSpacing: letterSpacing.normal,
  },

  // Body text - DM Sans
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
  },
  bodyMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
  },

  // Labels/Buttons - DM Sans Semibold/Medium
  labelLarge: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.lg,
  },
  labelMedium: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.md,
  },
  labelSmall: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.sm,
  },

  // Captions - DM Sans Medium
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
  },
  captionSmall: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
  },

  // Uppercase labels
  overline: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;
