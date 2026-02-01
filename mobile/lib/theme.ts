/**
 * Theme constants for consistent styling across the app.
 * Design system with standardized tokens for colors, spacing, and typography.
 */

import { Platform } from 'react-native';

// System font stack for consistent cross-platform typography
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: 'System',
});

// Typography scale - harmonious sizes for clean, modern look
export const fontSize = {
  xs: 11,      // Tiny labels
  sm: 12,      // Small labels, timestamps
  base: 13,    // Secondary text, captions
  md: 14,      // Body text small
  lg: 15,      // Body text
  xl: 16,      // Emphasized body
  '2xl': 18,   // Section titles
  '3xl': 20,   // Subheadings
  '4xl': 28,   // Page titles
  '5xl': 30,   // Hero stats
} as const;

// Font weights for typography hierarchy
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Letter spacing for typography refinement
export const letterSpacing = {
  tight: -0.5,    // Page titles
  normal: -0.3,   // Section titles
  wide: 0.5,      // Uppercase labels
} as const;

// Color palette - warm food delivery app inspired
export const colors = {
  // Primary browns
  primary: '#4A3728',
  primaryDark: '#3D2D1F',
  primaryLight: '#6B5344',

  // Background gradients
  bgLight: '#FDFBF7',
  bgMid: '#F5E6D3',
  bgDark: '#E8D5C4',
  bgWarm: '#F3E8E0',

  // Accent colors
  accent: '#8B7355',
  gold: '#D4A574',
  goldLight: '#FFD700',

  // Category colors (for consistent section icons)
  category: {
    recipes: { bg: '#E8D5C4', text: '#4A3728' },
    planned: { bg: '#E8F0E8', text: '#2D5A3D' },
    grocery: { bg: '#E5E7EB', text: '#374151' },
    add: { bg: '#E8D5C4', text: '#4A3728' },
  },

  // Diet label colors
  diet: {
    veggie: { bg: '#DCFCE7', text: '#166534' },
    fish: { bg: '#DBEAFE', text: '#1E40AF' },
    meat: { bg: '#FEE2E2', text: '#991B1B' },
  },

  // Neutrals - standardized gray scale
  white: '#FFFFFF',
  text: {
    primary: '#4A3728',      // Main text
    secondary: '#6B7280',    // Body text, descriptions
    muted: '#9CA3AF',        // Placeholder, disabled
    inverse: '#FFFFFF',      // Text on dark backgrounds
  },
  border: '#E5E7EB',         // Standard border color

  // Legacy gray scale (for compatibility)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
  },

  // Semantic
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  info: '#0369A1',
  infoBg: '#E0F2FE',
} as const;

// Spacing scale - consistent rhythm
export const spacing = {
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
  screenPaddingTop: 60,      // Consistent header padding
  screenPaddingHorizontal: 20,
  sectionGap: 24,            // Gap between sections
  cardGap: 8,                // Gap between cards
  tabBarHeight: 88,          // Tab bar + safe area
} as const;

// Border radius - standardized to 3 sizes
export const borderRadius = {
  sm: 12,      // Small elements, chips, badges
  md: 16,      // Cards, inputs, buttons
  lg: 20,      // Large cards, modals
  xl: 24,      // Extra large, floating elements
  full: 9999,  // Circles, pills
} as const;

// Icon sizes - standardized
export const iconSize = {
  xs: 14,      // Inline with small text
  sm: 16,      // Inline with body text
  md: 18,      // Standard icons
  lg: 20,      // Emphasized icons
  xl: 24,      // Large icons
  '2xl': 32,   // Section header icons
  '3xl': 40,   // Hero icons
} as const;

// Icon container sizes (circles around icons)
export const iconContainer = {
  sm: 32,      // Inline section headers
  md: 40,      // Standard icon circles
  lg: 48,      // Large icon circles
  xl: 56,      // Extra large (like meal images)
  '2xl': 80,   // Empty state illustrations
} as const;

// Shadow presets for consistent elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// Composable style helpers
export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  ...shadows.md,
} as const;

export const inputStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: fontSize.lg,
  color: colors.text.primary,
} as const;
