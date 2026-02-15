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

// Shadow presets - consistent bottom-right direction
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: '#E8A87C',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glowSoft: {
    shadowColor: '#E8A87C',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
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
