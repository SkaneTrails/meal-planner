/**
 * Vitest setup — global mocks for Expo modules and other native dependencies.
 */

import { vi } from 'vitest';

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  Stack: {
    Screen: ({ options }: any) => null,
  },
  Link: ({ children }: any) => children,
}));

// Mock @expo/vector-icons
vi.mock('@expo/vector-icons', () => ({
  Ionicons: (props: any) => null,
}));

// Mock expo-image
vi.mock('expo-image', () => ({
  Image: (props: any) => null,
}));

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Mock expo-linear-gradient
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

// Mock @/components (GradientBackground, etc.)
vi.mock('@/components', () => ({
  GradientBackground: ({ children }: any) => children,
  AnimatedPressable: ({ children, onPress, ...props }: any) => {
    const { createElement } = require('react');
    return createElement('button', { onClick: onPress, ...props }, children);
  },
  FilterChip: ({ label, selected, onPress }: any) => {
    const { createElement } = require('react');
    return createElement('button', {
      onClick: onPress,
      'aria-pressed': selected,
      'data-testid': `chip-${label}`,
    }, label);
  },
  SectionHeader: ({ title }: any) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': `section-${title}` }, title);
  },
  RadioGroup: ({ value, onChange }: any) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': `radio-${value}` });
  },
}));

// Mock @/lib/alert
vi.mock('@/lib/alert', () => ({
  showNotification: vi.fn(),
}));

// Mock @/lib/theme with minimal values
vi.mock('@/lib/theme', () => ({
  colors: {
    primary: '#6366f1',
    bgDark: '#1e1e1e',
    bgLight: '#f0f0f0',
    glass: { card: '#ffffff20' },
    text: { inverse: '#fff', dark: '#000', secondary: '#888', muted: '#aaa', primary: '#333' },
    border: '#e0e0e0',
    white: '#fff',
    success: '#22c55e',
    error: '#ef4444',
    gray: { 50: '#fafafa', 100: '#f5f5f5', 200: '#eee', 300: '#e0e0e0', 400: '#bdbdbd', 500: '#9e9e9e', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
    diet: {
      veggie: { text: '#16a34a', bg: '#dcfce7' },
      fish: { text: '#0284c7', bg: '#e0f2fe' },
      meat: { text: '#dc2626', bg: '#fee2e2' },
    },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48 },
  fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 28 },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  fontFamily: { body: 'System', bodySemibold: 'System', heading: 'System', displayBold: 'System' },
  letterSpacing: { tighter: -0.8, tight: -0.5, normal: -0.2, wide: 0.8, wider: 1.2 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: { sm: {}, md: {}, lg: {} },
  iconContainer: { sm: 32, md: 40, lg: 48, xl: 56, '2xl': 80 },
}));

// Mock @/lib/settings-context
vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      language: 'en',
      itemsAtHome: [],
      favoriteRecipes: [],
      showHiddenRecipes: false,
    },
    setLanguage: vi.fn(),
    addItemAtHome: vi.fn(),
    removeItemAtHome: vi.fn(),
    isItemAtHome: vi.fn(() => false),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
    toggleShowHiddenRecipes: vi.fn(),
    isLoading: false,
  })),
  LANGUAGES: [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ],
}));

// Mock @/lib/hooks/use-auth
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com', displayName: 'Test User', photoURL: null },
    signOut: vi.fn(),
    loading: false,
  })),
}));

// Mock firebase
vi.mock('@/lib/firebase', () => ({
  auth: {},
  isFirebaseConfigured: false,
}));
