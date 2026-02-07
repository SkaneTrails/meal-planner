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
    text: { inverse: '#fff', dark: '#000', secondary: '#888', muted: '#aaa' },
    border: '#e0e0e0',
    white: '#fff',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 },
  fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, '2xl': 24 },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  fontFamily: { body: 'System', heading: 'System' },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16 },
  shadows: { sm: {}, md: {}, lg: {} },
}));

// Mock @/lib/settings-context
vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      language: 'en',
      alwaysAtHome: [],
      itemsAtHome: [],
    },
    setLanguage: vi.fn(),
    addItemAtHome: vi.fn(),
    removeItemAtHome: vi.fn(),
  })),
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'sv', name: 'Svenska' },
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
