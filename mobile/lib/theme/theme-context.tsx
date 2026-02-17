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

interface ThemeValue {
  colors: ColorTokens;
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
}

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({
  children,
  palette = defaultPalette,
}: ThemeProviderProps) => {
  const value = useMemo<ThemeValue>(
    () => ({
      colors: palette,
      styles: createStyles(palette),
    }),
    [palette],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
