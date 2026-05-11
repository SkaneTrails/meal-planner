/**
 * Typography scale, font families, weights, letter spacing, and presets.
 *
 * Shared constants (fontSize, fontWeight, etc.) and the default (light theme)
 * font family live here. Per-theme font families are defined in each theme's
 * own file under `themes/`.
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
  readonly emoji?: string;
};

// Web uses CSS font names with weights, native uses Expo font names (which embed weight)
const isWeb = Platform.OS === 'web';

/** DM Sans for all text (display, body, accent). */
export const defaultFontFamily: FontFamilyTokens = {
  display: isWeb ? '"DM Sans", sans-serif' : 'DMSans_600SemiBold',
  displayRegular: isWeb ? '"DM Sans", sans-serif' : 'DMSans_400Regular',
  displayMedium: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
  displayBold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_700Bold',
  body: isWeb ? '"DM Sans", sans-serif' : 'DMSans_400Regular',
  bodyMedium: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
  bodySemibold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_600SemiBold',
  bodyBold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_700Bold',
  accent: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
};

// Static font family mapping used by ErrorBoundary (class component, can't use hooks).
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

// Typography scale — modernized in Phase 1 of the design-system refresh.
// Token keys are preserved (large blast radius) but values are bumped to a
// contemporary ramp (body 14–16, headings 18–28, display 30–44).
// Rule of thumb: micro/eyebrow sizes start at 12; default body sits at 14–15;
// reading body at 16; section headings at 18–22; screen titles at 24–32.
export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  'lg-xl': 17,
  '2xl': 18,
  'xl-2xl': 19,
  '3xl': 21,
  '3xl-4xl': 24,
  '4xl': 24,
  '5xl': 30,
  '6xl': 36,
} as const;

// Line-height ramp aligned to the new font sizes (~1.4× body, ~1.2 headings).
export const lineHeight = {
  sm: 16,
  md: 18,
  lg: 22,
  xl: 24,
  '2xl': 28,
} as const;

// Font weights for typography hierarchy
export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Letter spacing — soft, neutral defaults. Modern minimalism uses ~0 tracking
// at body sizes; only large display text gets mild negative tracking.
export const letterSpacing = {
  tighter: -0.4,
  tight: -0.25,
  snug: -0.1,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
} as const;

/** Build typography presets from the given font family tokens. */
export const createTypography = (fonts: FontFamilyTokens) =>
  ({
    displayLarge: {
      fontFamily: fonts.displayBold,
      fontSize: fontSize['6xl'],
      lineHeight: 40,
      letterSpacing: letterSpacing.tighter,
    },
    displayMedium: {
      fontFamily: fonts.display,
      fontSize: fontSize['4xl'],
      lineHeight: 30,
      letterSpacing: letterSpacing.tight,
    },
    displaySmall: {
      fontFamily: fonts.display,
      fontSize: fontSize['3xl'],
      lineHeight: 26,
      letterSpacing: letterSpacing.snug,
    },

    headingLarge: {
      fontFamily: fonts.bodyBold,
      fontSize: fontSize['3xl'],
      lineHeight: 26,
      letterSpacing: letterSpacing.snug,
    },
    headingMedium: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize['2xl'],
      lineHeight: 22,
      letterSpacing: letterSpacing.normal,
    },
    headingSmall: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.xl,
      lineHeight: 20,
      letterSpacing: letterSpacing.normal,
    },

    bodyLarge: {
      fontFamily: fonts.body,
      fontSize: fontSize.lg,
      lineHeight: 22,
    },
    bodyMedium: {
      fontFamily: fonts.body,
      fontSize: fontSize.md,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: fontSize.base,
      lineHeight: 18,
    },

    labelLarge: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.lg,
      lineHeight: 18,
    },
    labelMedium: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.md,
      lineHeight: 18,
    },
    labelSmall: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.sm,
      lineHeight: 16,
    },

    caption: {
      fontFamily: fonts.bodyMedium,
      fontSize: fontSize.base,
      lineHeight: 18,
    },
    captionSmall: {
      fontFamily: fonts.bodyMedium,
      fontSize: fontSize.sm,
      lineHeight: 16,
    },

    overline: {
      fontFamily: fonts.bodySemibold,
      fontSize: fontSize.xs,
      lineHeight: 14,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase' as const,
    },
  }) as const;

/** Resolved typography presets (return type of `createTypography`). */
export type TypographyTokens = ReturnType<typeof createTypography>;

// Static default presets for backward-compat and non-hook contexts.
/** @deprecated Use `useTheme().typography` for theme-aware access. */
export const typography = createTypography(fontFamily);
