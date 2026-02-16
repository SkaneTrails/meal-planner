/**
 * Spacing, layout, border radius, icon sizes, shadows, and animation constants.
 */

// Spacing scale - consistent rhythm
export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// Layout constants
export const layout = {
  screenPaddingTop: 60,
  screenPaddingHorizontal: 20,
  sectionGap: 24,
  cardGap: 8,
  /** @deprecated Use layout.tabBar instead */
  tabBarHeight: 88,
  tabBar: {
    height: 44,
    bottomOffset: 16,
    horizontalMargin: 20,
    borderRadius: 16,
    /** Padding for scrollable content so it clears the floating bar */
    contentBottomPadding: 76, // height + bottomOffset + safety
    /** Bottom offset for fixed overlay controls (save buttons, footers) */
    overlayBottomOffset: 60, // height + bottomOffset
  },
} as const;

// Border radius - standardized to 3 sizes
export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

// Icon sizes - standardized
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

// Icon container sizes (circles around icons)
export const iconContainer = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 80,
} as const;

// Shadow presets — boxShadow shorthand (RN 0.76+)
// Format: 'offsetX offsetY blurRadius spreadRadius color'
export const shadows = {
  none: { boxShadow: '0px 0px 0px 0px transparent' },
  xs: { boxShadow: '1px 1px 2px 0px rgba(0, 0, 0, 0.03)' },
  sm: { boxShadow: '1px 2px 6px 0px rgba(0, 0, 0, 0.04)' },
  card: { boxShadow: '1px 2px 6px 0px rgba(0, 0, 0, 0.06)' },
  md: { boxShadow: '2px 4px 12px 0px rgba(0, 0, 0, 0.06)' },
  lg: { boxShadow: '2px 8px 20px 0px rgba(0, 0, 0, 0.08)' },
  xl: { boxShadow: '3px 12px 28px 0px rgba(0, 0, 0, 0.12)' },
  glow: { boxShadow: '1px 4px 16px 0px rgba(232, 168, 124, 0.25)' },
  glowSoft: { boxShadow: '1px 2px 10px 0px rgba(232, 168, 124, 0.15)' },
} as const;

// Animation durations - smooth, premium feel
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 100,
  },
} as const;
