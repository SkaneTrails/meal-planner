/**
 * Typography scale, font families, weights, letter spacing, and presets.
 */

import { Platform } from 'react-native';

// Font families - DM Sans for everything (unified font)
// Web uses CSS font names with weights, native uses Expo font names (which embed weight)
const isWeb = Platform.OS === 'web';

// For web: fontFamily is just the font name, weight comes from fontWeight
// For native: fontFamily includes the weight (e.g., DMSans_600SemiBold)
export const fontFamily = {
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
  '2xl': 17,
  '3xl': 20,
  '4xl': 26,
  '5xl': 32,
  '6xl': 40,
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
  normal: -0.2,
  wide: 0.8,
  wider: 1.2,
} as const;

// Typography presets — use specific font families for cross-platform rendering
export const typography = {
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

  bodyLarge: { fontFamily: fontFamily.body, fontSize: fontSize.lg },
  bodyMedium: { fontFamily: fontFamily.body, fontSize: fontSize.md },
  bodySmall: { fontFamily: fontFamily.body, fontSize: fontSize.base },

  labelLarge: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.lg },
  labelMedium: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.md },
  labelSmall: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.sm },

  caption: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base },
  captionSmall: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm },

  overline: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;
