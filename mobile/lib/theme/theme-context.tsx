/**
 * Theme context and provider.
 *
 * Provides the resolved theme tokens via React context so components can
 * access colors, fonts, radii, shadows, and other design tokens through
 * `useTheme()`. The `ThemeProvider` accepts a complete `ThemeDefinition`.
 */

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { ColorTokens } from './colors';
import {
  type BorderRadiusTokens,
  circleStyle as defaultCircleStyle,
  type ShadowTokens,
} from './layout';
import { createStyles, type ThemeStyles } from './styles';
import type { FontFamilyTokens, TypographyTokens } from './typography';
import { createTypography } from './typography';

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

/**
 * Style and layout overrides that vary between themes.
 *
 * These replace inline `crt ? X : Y` style ternaries so that themes
 * can declare their own values without consumers branching on theme identity.
 */
export interface StyleOverrides {
  /** Opacity for checked grocery items (0–1). */
  checkedOpacity: number;
  /** Border width for checkboxes. */
  checkboxBorderWidth: number;
  /** Border width for dashed container outlines (extras section). 0 = no border. */
  dashedBorderWidth: number;
  /** Day card border widths. */
  dayCardBorderWidth: number;
  dayCardBorderWidthToday: number;
  /** Segmented control track gap. */
  segmentedControlGap: number;
  /** Segmented control track padding. */
  segmentedControlPadding: number;
  /** How the active segmented tab is indicated. */
  segmentedControlActiveIndicator: 'shadow' | 'underline';
}

/** A complete set of design tokens that fully describes one visual theme. */
export interface ThemeDefinition {
  /** Unique registry key — used for storage and lookup. */
  id: string;
  /** Human-readable display name — shown in the theme picker. */
  name: string;
  colors: ColorTokens;
  fonts: FontFamilyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  buttonDisplay: ButtonDisplayConfig;
  overrides: StyleOverrides;
  /** Only CRT-style themes provide this. */
  crt?: CRTConfig;
  /** Static background image used by GradientBackground. Omit for solid-color backgrounds. */
  backgroundImage?: ImageSourcePropType;
  /**
   * Custom font assets this theme requires (name → asset source).
   * Collected at startup and passed to `useFonts`. Themes using only
   * system fonts (monospace, Comic Sans) leave this empty.
   */
  requiredFonts: Record<string, number>;
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
  overrides: StyleOverrides;
  /** CRT overlay config — undefined for themes without the effect. */
  crt?: CRTConfig;
  /** Static background image for screen backgrounds. Undefined = solid color. */
  backgroundImage?: ImageSourcePropType;
  /** Registry key of the active theme. */
  themeName: string;
  /** Switch to a different theme by registry key. */
  setThemeName: (name: string) => void;
  /** Whether the active theme has CRT visual effects. */
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

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Complete theme definition — required, no default. */
  theme: ThemeDefinition;
  /** Callback to switch theme by registry key. */
  setThemeName?: (name: string) => void;
}

const noop = () => {};

/** Wraps children with the resolved theme value. */
export const ThemeProvider = ({
  children,
  theme,
  setThemeName = noop as unknown as (name: string) => void,
}: ThemeProviderProps) => {
  const value = useMemo<ThemeValue>(() => {
    const {
      id,
      colors,
      fonts,
      borderRadius: radii,
      shadows: shadowTokens,
      buttonDisplay,
      overrides,
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
      overrides,
      crt,
      backgroundImage,
      themeName: id,
      setThemeName,
      isTerminal: !!crt,
    };
  }, [theme, setThemeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
