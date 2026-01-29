/**
 * Theme constants for consistent styling across the app.
 * Includes typography scale, colors, and spacing.
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
  xs: 12,      // Small labels, timestamps
  sm: 13,      // Secondary labels
  base: 15,    // Body text
  md: 16,      // Input text, regular content
  lg: 17,      // Emphasized body
  xl: 18,      // Subheadings
  '2xl': 20,   // Section titles
  '3xl': 22,   // Page titles
  '4xl': 26,   // Large headings
  '5xl': 32,   // Hero stats
} as const;

// Font weights for typography hierarchy
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Color palette - warm food delivery app inspired
export const colors = {
  // Primary browns
  primary: '#4A3728',
  primaryLight: '#6B5344',
  
  // Background gradients
  bgLight: '#FDFBF7',
  bgMid: '#F5E6D3',
  bgDark: '#E8D5C4',
  
  // Neutrals
  white: '#FFFFFF',
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
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
} as const;

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
