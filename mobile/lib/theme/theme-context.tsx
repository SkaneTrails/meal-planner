/**
 * Theme context and provider.
 *
 * Provides the resolved color palette and derived style presets via React
 * context so components can opt into theme-aware rendering incrementally.
 *
 * Pass a custom `palette` to `ThemeProvider` to override the default light
 * colors. When no palette is supplied, the built-in light palette is used.
 */

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { ColorTokens } from './colors';
import { colors as defaultPalette } from './colors';
import {
  type BorderRadiusTokens,
  borderRadius as defaultBorderRadius,
  circleStyle as defaultCircleStyle,
  shadows as defaultShadows,
  type ShadowTokens,
} from './layout';
import { createStyles, type ThemeStyles } from './styles';
import type { FontFamilyTokens, TypographyTokens } from './typography';
import { createTypography, defaultFontFamily } from './typography';

/** Return type of the circleStyle helper (width/height/borderRadius). */
export type CircleStyleFn = (size: number) => {
  readonly width: number;
  readonly height: number;
  readonly borderRadius: number;
};

export interface ThemeValue {
  colors: ColorTokens;
  fonts: FontFamilyTokens;
  typography: TypographyTokens;
  styles: ThemeStyles;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  circleStyle: CircleStyleFn;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Read the current theme. Must be called within a `ThemeProvider`. */
export const useTheme = (): ThemeValue => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional color palette override. Defaults to the built-in light palette. */
  palette?: ColorTokens;
  /** Optional font family override. Defaults to DM Sans. */
  fonts?: FontFamilyTokens;
  /** Optional border radius override. Defaults to the standard scale. */
  radii?: BorderRadiusTokens;
  /** Optional shadow presets override. Defaults to the standard depth shadows. */
  shadowTokens?: ShadowTokens;
}

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({
  children,
  palette = defaultPalette,
  fonts = defaultFontFamily,
  radii = defaultBorderRadius,
  shadowTokens = defaultShadows,
}: ThemeProviderProps) => {
  const value = useMemo<ThemeValue>(() => {
    const isFlat = radii.full === 0;
    const themedCircleStyle: CircleStyleFn = isFlat
      ? (size) => ({ width: size, height: size, borderRadius: 0 }) as const
      : defaultCircleStyle;

    return {
      colors: palette,
      fonts,
      typography: createTypography(fonts),
      styles: createStyles(palette, radii),
      borderRadius: radii,
      shadows: shadowTokens,
      circleStyle: themedCircleStyle,
    };
  }, [palette, fonts, radii, shadowTokens]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
