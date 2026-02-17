/**
 * Theme context and provider.
 *
 * Provides the resolved color palette and derived style presets via React
 * context so components can opt into theme-aware rendering incrementally.
 *
 * Currently hardcoded to the light palette — no switching UI yet.
 */

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { ColorTokens } from './colors';
import { colors } from './colors';
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

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo<ThemeValue>(
    () => ({
      colors,
      styles: createStyles(colors),
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
