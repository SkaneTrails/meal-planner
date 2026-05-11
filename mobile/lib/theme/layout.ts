/**
 * Spacing, layout, border radius, icon sizes, shadows, and animation constants.
 */

// Spacing scale — tightened for a more compact, harmonious rhythm.
// Values follow a 2-based ramp at the small end (2/4/6/8/10/12/14/16) and
// step up in larger increments above 16 (20/28/36/44). Half-step keys
// (`xs-sm`, `sm-md`, `md-lg`) are preserved to avoid touching the ~100
// consumer call sites and now sit between their neighbours (6/10/14) for a
// finer, less spongy spacing rhythm across all themes.
export const spacing = {
  '2xs': 2,
  xs: 4,
  'xs-sm': 6,
  sm: 8,
  'sm-md': 10,
  md: 12,
  'md-lg': 14,
  lg: 16,
  xl: 20,
  '2xl': 28,
  '3xl': 36,
  '4xl': 44,
} as const;

// Layout constants
export const layout = {
  contentMaxWidth: 720,
  /** Shared style preset: maxWidth + center + full width. Spread into View style or contentContainerStyle. */
  contentContainer: {
    maxWidth: 720,
    alignSelf: 'center' as const,
    width: '100%' as const,
  },
  screenPaddingTop: 32,
  screenPaddingHorizontal: 20,
  /** Vertical breathing room between sibling sections on a screen.
   *  Single source of truth — replaces ad-hoc `spacing.lg`/`xl`/`2xl` between blocks. */
  sectionGap: 24,
  cardGap: 6,
  /** @deprecated Use layout.tabBar instead */
  tabBarHeight: 88,
  tabBar: {
    height: 44,
    bottomOffset: 16,
    horizontalMargin: 20,
    /** Padding for scrollable content so it clears the floating bar */
    contentBottomPadding: 76, // height + bottomOffset + safety
    /** Bottom offset for fixed overlay controls (save buttons, footers) */
    overlayBottomOffset: 60, // height + bottomOffset
  },
} as const;

// Border radius — modernized in Phase 2.
// Half-step keys collapse to the canonical 4-step ramp (4/8/12/16/20/24).
// Themes (e.g. Petrol) override this map with their own personality —
// Petrol uses a softer, pill-friendly variant; Bubblegum stays rounder;
// Terminal forces sharp.
export const borderRadius = {
  '3xs': 4,
  '2xs': 4,
  'xs-sm': 8,
  xs: 8,
  'sm-md': 12,
  sm: 12,
  'md-lg': 16,
  md: 16,
  lg: 20,
  'lg-xl': 24,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

/** Structural contract for border radius scales. */
export interface BorderRadiusTokens {
  readonly '3xs': number;
  readonly '2xs': number;
  readonly 'xs-sm': number;
  readonly xs: number;
  readonly 'sm-md': number;
  readonly sm: number;
  readonly 'md-lg': number;
  readonly md: number;
  readonly lg: number;
  readonly 'lg-xl': number;
  readonly xl: number;
  readonly '2xl': number;
  readonly full: number;
}

// Icon sizes - standardized
export const iconSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
} as const;

// Dot indicator sizes (colored dots in chips/tags)
export const dotSize = {
  md: 10,
} as const;

// Icon container sizes (circles around icons)
export const iconContainer = {
  xs: 30,
  sm: 28,
  md: 36,
  lg: 42,
  xl: 48,
  '2xl': 68,
} as const;

export type IconContainerSize = keyof typeof iconContainer;

// Helper: generates width, height, borderRadius for a circular container
export const circleStyle = (size: number) =>
  ({ width: size, height: size, borderRadius: size / 2 }) as const;

// Shadow presets — boxShadow shorthand (RN 0.76+)
// Format: 'offsetX offsetY blurRadius spreadRadius color'
// NOTE: No shared concrete values. Each theme defines its own ShadowTokens.

/** Structural contract for shadow presets. */
export interface ShadowTokens {
  readonly none: { readonly boxShadow: string };
  readonly xs: { readonly boxShadow: string };
  readonly sm: { readonly boxShadow: string };
  readonly card: { readonly boxShadow: string };
  readonly md: { readonly boxShadow: string };
  readonly lg: { readonly boxShadow: string };
  readonly xl: { readonly boxShadow: string };
  readonly glow: { readonly boxShadow: string };
  readonly glowSoft: { readonly boxShadow: string };
  readonly cardRaised: { readonly boxShadow: string };
  readonly float: { readonly boxShadow: string };
}

// Opacity presets
export const opacity = {
  disabled: 0.5,
  pressed: 0.9,
} as const;

// Animation durations — Phase 7. Tightened toward modern minimalism:
// fast/normal under 250ms, springs less bouncy. Calm editorial UIs use
// short ease-out timing instead of springy overshoots.
export const animation = {
  fast: 120,
  normal: 200,
  slow: 320,
  spring: {
    damping: 22,
    stiffness: 180,
  },
} as const;

// Terminal box-drawing layout constants
export const terminal = {
  /** Line height for single/double-line box-drawing chars (TerminalFrame, TerminalDivider). */
  charHeight: 14,
  /** Line height for FAB bar box-drawing chars (slightly taller for touch targets). */
  fabCharHeight: 16,
} as const;
