/**
 * Typography scale, font families, weights, letter spacing, and presets.
 */

import { Platform } from 'react-native';

/** Structural contract for font family mappings. */
export type FontFamilyTokens = {
  readonly display: string;
  readonly displayRegular: string;
  readonly displayMedium: string;
  readonly displayBold: string;
  readonly body: string;
  readonly bodyMedium: string;
  readonly bodySemibold: string;
  readonly bodyBold: string;
  readonly accent: string;
};

// Font families - DM Sans for everything (unified font)
// Web uses CSS font names with weights, native uses Expo font names (which embed weight)
const isWeb = Platform.OS === 'web';

// Monospace font family for the terminal CRT theme
const MONO = isWeb
  ? '"Courier New", "Courier", monospace'
  : Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    });

/** Playfair Display for display headings, DM Sans for body text. */
export const defaultFontFamily: FontFamilyTokens = {
  display: isWeb ? '"Playfair Display", serif' : 'PlayfairDisplay_600SemiBold',
  displayRegular: isWeb
    ? '"Playfair Display", serif'
    : 'PlayfairDisplay_400Regular',
  displayMedium: isWeb
    ? '"Playfair Display", serif'
    : 'PlayfairDisplay_500Medium',
  displayBold: isWeb ? '"Playfair Display", serif' : 'PlayfairDisplay_700Bold',
  body: isWeb ? '"DM Sans", sans-serif' : 'DMSans_400Regular',
  bodyMedium: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
  bodySemibold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_600SemiBold',
  bodyBold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_700Bold',
  accent: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
};

/** Monospace — terminal CRT theme font family. */
export const terminalFontFamily: FontFamilyTokens = {
  display: MONO,
  displayRegular: MONO,
  displayMedium: MONO,
  displayBold: MONO,
  body: MONO,
  bodyMedium: MONO,
  bodySemibold: MONO,
  bodyBold: MONO,
  accent: MONO,
};

// Rounded/comic system font for the pastel "bubbly" theme.
// No custom font loading needed — relies on platform system fonts.
const COMIC = isWeb
  ? '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive'
  : Platform.select({
      ios: 'Chalkboard SE',
      android: 'casual',
      default: 'sans-serif',
    });

/** Comic Sans / Chalkboard — pastel bubbly theme font family. */
export const pastelFontFamily: FontFamilyTokens = {
  display: COMIC,
  displayRegular: COMIC,
  displayMedium: COMIC,
  displayBold: COMIC,
  body: COMIC,
  bodyMedium: COMIC,
  bodySemibold: COMIC,
  bodyBold: COMIC,
  accent: COMIC,
};

// Static font family mapping used by the typography presets below. Dynamic,
// theme-aware font access should go through `useTheme().fonts` where available.
// The presets are intentionally static — migrating them to a factory that takes
// `fonts` is planned as a follow-up when runtime theme switching lands.
/** @deprecated Use `useTheme().fonts` for theme-aware font access. */
export const fontFamily = defaultFontFamily;

// Font weights - used in addition to fontFamily for web
// On native, fontFamily already includes weight, so these are redundant but harmless
export const fontFamilyWeight = {
  display: '600' as const,
  displayRegular: '400' as const,
  displayMedium: '500' as const,
  displayBold: '700' as const,
  body: '400' as const,
  bodyMedium: '500' as const,
  bodySemibold: '600' as const,
  bodyBold: '700' as const,
  accent: '500' as const,
};

// Typography scale - refined for luxury feel
export const fontSize = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 15,
  'lg-xl': 16,
  '2xl': 17,
  'xl-2xl': 18,
  '3xl': 20,
  '3xl-4xl': 28,
  '4xl': 26,
  '5xl': 32,
  '6xl': 40,
} as const;

export const lineHeight = {
  sm: 18,
  md: 20,
  lg: 22,
  xl: 24,
  '2xl': 26,
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
  tighter: -0.8,
  tight: -0.5,
  snug: -0.3,
  normal: -0.2,
  wide: 0.8,
  wider: 1.2,
} as const;

/** Build typography presets from the given font family tokens. */
export const createTypography = (fonts: FontFamilyTokens) =>
  ({
    displayLarge: {
      fontFamily: fonts.displayBold,
      fontSize: fontSize['6xl'],
      letterSpacing: letterSpacing.tighter,
    },
    displayMedium: {
      fontFamily: fonts.display,
      fontSize: fontSize['4xl'],
      letterSpacing: letterSpacing.tight,
    },
    displaySmall: {
      fontFamily: fonts.display,
      fontSize: fontSize['3xl'],
      letterSpacing: letterSpacing.normal,
    },

    headingLarge: {
      fontFamily: fonts.bodyBold,
      fontSize: fontSize['3xl'],
      letterSpacing: letterSpacing.normal,
    },
    headingMedium: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize['2xl'],
      letterSpacing: letterSpacing.normal,
    },
    headingSmall: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.xl,
      letterSpacing: letterSpacing.normal,
    },

    bodyLarge: { fontFamily: fonts.body, fontSize: fontSize.lg },
    bodyMedium: { fontFamily: fonts.body, fontSize: fontSize.md },
    bodySmall: { fontFamily: fonts.body, fontSize: fontSize.base },

    labelLarge: { fontFamily: fonts.bodySemibold, fontSize: fontSize.lg },
    labelMedium: { fontFamily: fonts.bodySemibold, fontSize: fontSize.md },
    labelSmall: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm },

    caption: { fontFamily: fonts.bodyMedium, fontSize: fontSize.base },
    captionSmall: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm },

    overline: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase' as const,
    },
  }) as const;

/** Resolved typography presets (return type of `createTypography`). */
export type TypographyTokens = ReturnType<typeof createTypography>;

// Static default presets for backward-compat and non-hook contexts.
/** @deprecated Use `useTheme().typography` for theme-aware access. */
export const typography = createTypography(fontFamily);
