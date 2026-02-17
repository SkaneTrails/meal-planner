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
import { createStyles, type ThemeStyles } from './styles';
import type { FontFamilyTokens } from './typography';
import { defaultFontFamily } from './typography';

export interface ThemeValue {
  colors: ColorTokens;
  fonts: FontFamilyTokens;
  styles: ThemeStyles;
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
}

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({
  children,
  palette = defaultPalette,
  fonts = defaultFontFamily,
}: ThemeProviderProps) => {
  const value = useMemo<ThemeValue>(
    () => ({
      colors: palette,
      fonts,
      styles: createStyles(palette),
    }),
    [palette, fonts],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
