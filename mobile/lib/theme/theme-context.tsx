/**
 * Theme context and provider.
 *
 * Provides the resolved theme tokens via React context so components can
 * access colors, fonts, radii, shadows, and other design tokens through
 * `useTheme()`. The `ThemeProvider` accepts a complete `ThemeDefinition`.
 */

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
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
  /** Inner gap for toggle-variant chips. */
  chipToggleGap: number;
}

/**
 * Element visibility flags that vary between themes.
 *
 * These replace inline `!crt && (...)` conditionals so that themes
 * can independently control which decorative elements are shown.
 */
export interface VisibilityTokens {
  /** Show the native navigation header on recipe detail screen. */
  showStackHeader: boolean;
  /** Green dot "today" indicator on next meal card. */
  showTodayDot: boolean;
  /** "Today" pill badge on day headers + today label in header text. */
  showTodayBadge: boolean;
  /** Note tags and add-note pressable on day headers. */
  showDayNotes: boolean;
  /** Forward/collapse chevron icons. */
  showChevrons: boolean;
  /** Ionicons on stat cards. */
  showStatIcons: boolean;
  /** Progress bar on grocery stats card. */
  showProgressBar: boolean;
  /** "Add item" label text on grocery add card. */
  showAddItemLabel: boolean;
  /** Empty-state icon circle on grocery list. */
  showEmptyStateIcon: boolean;
  /** Gradient + title overlay on recipe hero image. */
  showHeroOverlay: boolean;
  /** Action buttons row on recipe detail (hidden when using FAB bar). */
  showRecipeActionButtons: boolean;
  /** Visibility chip on recipe meta labels. */
  showVisibilityChip: boolean;
  /** Tags section on recipe detail. */
  showRecipeTags: boolean;
  /** TerminalFrame label text in section headers (e.g. "EXTRAS"). */
  showFrameLabels: boolean;
  /** Whether toggle chips show the colored dot indicator. */
  showChipToggleDot: boolean;
  /** Vertical dividers between stat cards (CRT groups cards into a single frame). */
  showStatDividers: boolean;
  /** Icon circle + accent underline in section/tab headers. */
  showSectionHeaderIcon: boolean;
  /** Ionicons checkmark indicator for pickers (false = text-based [X]/[ ] indicator). */
  showCheckmarkIndicator: boolean;
}

/**
 * Tab bar appearance tokens — shape, border, and blur/transparency.
 *
 * Colors are already in `ColorTokens.tabBar`. These control the
 * structural appearance so each theme can define its own bar shape.
 */
export interface TabBarTokens {
  /** Border radius of the floating bar. */
  borderRadius: number;
  /** Border width around the bar (web/Android). */
  borderWidth: number;
  /** Whether the bar uses backdrop blur (iOS BlurView / web backdrop-filter). */
  blur: boolean;
  /** iOS BlurView intensity (0–100). Ignored when blur=false. */
  blurIntensity: number;
  /** iOS BlurView tint. Ignored when blur=false. */
  blurTint: 'light' | 'dark' | 'default';
}

/**
 * Layout chrome — controls whether components use box-drawing frames
 * (flat) or card containers with rounded corners and shadows (full).
 *
 * Themes declare this once; consumers branch on it instead of checking
 * for a specific theme identity.
 */
export type LayoutChrome = 'flat' | 'full';

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
  visibility: VisibilityTokens;
  /** Tab bar shape, border, and blur configuration. */
  tabBar: TabBarTokens;
  /**
   * Layout chrome: 'flat' uses box-drawing frames and minimal decoration,
   * 'full' uses cards with rounded corners and shadows.
   */
  chrome: LayoutChrome;
  /** CRT visual overlay config (scanlines, flicker, glow). Omit for themes without the effect. */
  crt?: CRTConfig;
  /** Whether this theme supports animated gradient backgrounds. Defaults to true when omitted. */
  animatedBackground?: boolean;
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
  visibility: VisibilityTokens;
  /** Tab bar shape, border, and blur configuration. */
  tabBar: TabBarTokens;
  /** Layout chrome: 'flat' (box-drawing frames) or 'full' (cards/shadows). */
  chrome: LayoutChrome;
  /** CRT visual overlay config (scanlines, flicker, glow). Undefined = no overlay. */
  crt?: CRTConfig;
  /** Whether this theme supports animated gradient backgrounds. False = always plain bgBase. */
  animatedBackground: boolean;
  /** Registry key of the active theme. */
  themeName: string;
  /** Switch to a different theme by registry key. */
  setThemeName: (name: string) => void;
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
      visibility,
      tabBar,
      chrome,
      crt,
      animatedBackground,
    } = theme;
    const themedCircleStyle: CircleStyleFn =
      chrome === 'flat'
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
      visibility,
      tabBar,
      chrome,
      crt,
      animatedBackground: animatedBackground !== false,
      themeName: id,
      setThemeName,
    };
  }, [theme, setThemeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
