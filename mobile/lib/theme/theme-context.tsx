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
import type { ImageSourcePropType } from 'react-native';
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

/** CRT visual-effect parameters — provided only by themes that want the effect. */
export interface CRTConfig {
  /** Opacity of the dark scanline bands (0–1). */
  scanlineOpacity: number;
  /** Minimum opacity during flicker dip. */
  flickerMin: number;
  /** Duration of one flicker half-cycle in ms. */
  flickerMs: number;
  /** CSS color for the inner glow vignette. */
  glowColor: string;
  /** Blur radius of the inner glow in px. */
  glowSpread: number;
  /** Spread radius of the inner glow in px. */
  glowSize: number;
}

/** Return type of the circleStyle helper (width/height/borderRadius). */
export type CircleStyleFn = (size: number) => {
  readonly width: number;
  readonly height: number;
  readonly borderRadius: number;
};

/**
 * Button display configuration — drives how `<Button>` renders.
 *
 * Components read these tokens instead of branching on theme name.
 * Light theme: animated pressable with icon/text.
 * Terminal theme: box-drawing segment `╡ LABEL ╞`.
 */
export interface ButtonDisplayConfig {
  /** What content to render inside the button. */
  display: 'icon' | 'text' | 'both';
  /** Wrapper component: animated scale vs box-drawing segment. */
  wrapper: 'animated' | 'segment';
  /** Icon-only button shape (ignored when wrapper is segment). */
  shape: 'circle' | 'rounded' | 'none';
  /** Interaction style: scale animation or background color highlight. */
  interaction: 'scale' | 'highlight';
}

/** Defaults for the light (standard) theme. */
export const defaultButtonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
};

/** Terminal theme: everything rendered as box-drawing segments. */
export const terminalButtonDisplay: ButtonDisplayConfig = {
  display: 'text',
  wrapper: 'segment',
  shape: 'none',
  interaction: 'highlight',
};

/** A complete set of design tokens that fully describes one visual theme. */
export interface ThemeDefinition {
  /** Human-readable display name — shown in the theme picker. */
  name: string;
  colors: ColorTokens;
  fonts: FontFamilyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  buttonDisplay: ButtonDisplayConfig;
  /** Only CRT-style themes provide this. */
  crt?: CRTConfig;
  /** Static background image used by GradientBackground. Omit for solid-color backgrounds. */
  backgroundImage?: ImageSourcePropType;
}

export interface ThemeValue {
  colors: ColorTokens;
  fonts: FontFamilyTokens;
  typography: TypographyTokens;
  styles: ThemeStyles;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  circleStyle: CircleStyleFn;
  buttonDisplay: ButtonDisplayConfig;
  /** CRT overlay config — undefined for themes without the effect. */
  crt?: CRTConfig;
  /** Static background image for screen backgrounds. Undefined = solid color. */
  backgroundImage?: ImageSourcePropType;
  /** Registry key of the active theme. */
  themeName: string;
  /** Switch to a different theme by registry key. */
  setThemeName: (name: string) => void;
  /** Whether the terminal theme is active (convenience shortcut). */
  isTerminal: boolean;
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

/** Default (light) theme assembled from module-level tokens. */
const defaultTheme: ThemeDefinition = {
  name: 'Elegant',
  colors: defaultPalette,
  fonts: defaultFontFamily,
  borderRadius: defaultBorderRadius,
  shadows: defaultShadows,
  buttonDisplay: defaultButtonDisplay,
};

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Complete theme definition. Defaults to the light theme. */
  theme?: ThemeDefinition;
  /** Registry key of the active theme. */
  themeName?: string;
  /** Callback to switch theme by registry key. */
  setThemeName?: (name: string) => void;
}

const noop = () => {};

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({
  children,
  theme = defaultTheme,
  themeName = 'light',
  setThemeName = noop as unknown as (name: string) => void,
}: ThemeProviderProps) => {
  const value = useMemo<ThemeValue>(() => {
    const {
      colors,
      fonts,
      borderRadius: radii,
      shadows: shadowTokens,
      buttonDisplay,
      crt,
      backgroundImage,
    } = theme;
    const isFlat = radii.full === 0;
    const themedCircleStyle: CircleStyleFn = isFlat
      ? (size) => ({ width: size, height: size, borderRadius: 0 }) as const
      : defaultCircleStyle;

    return {
      colors,
      fonts,
      typography: createTypography(fonts),
      styles: createStyles(colors, radii),
      borderRadius: radii,
      shadows: shadowTokens,
      circleStyle: themedCircleStyle,
      buttonDisplay,
      crt,
      backgroundImage,
      themeName,
      setThemeName,
      isTerminal: themeName === 'terminal',
    };
  }, [theme, themeName, setThemeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
