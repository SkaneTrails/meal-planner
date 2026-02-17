/**
 * Vitest setup — global mocks for Expo modules and other native dependencies.
 */

import { vi } from 'vitest';

// Suppress known React Native Web warnings that are harmless in jsdom.
// These fire because RN-specific props (onLongPress, numberOfLines, onPressIn)
// and nested Pressable→button DOM nesting don't apply outside a real browser.
const originalConsoleError = console.error;
const SUPPRESSED_PATTERNS = [
  'Unknown event handler property',
  'does not recognize the',
  'cannot be a descendant of',
  'cannot contain a nested',
  'will cause a hydration error',
];
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (SUPPRESSED_PATTERNS.some((p) => message.includes(p))) return;
  originalConsoleError(...args);
  throw new Error(`Unexpected console.error in test: ${message}`);
};

const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  originalConsoleWarn(...args);
  throw new Error(`Unexpected console.warn in test: ${message}`);
};

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

// Mock @/components/FullScreenLoading (must mock separately to prevent real module from loading GradientBackground)
// Shared mock factories — reused in both direct-path and barrel mocks to avoid drift
const FullScreenLoadingMock = ({ children, title, subtitle, icon }: any) => {
  const { createElement } = require('react');
  return createElement('div', { 'data-testid': 'fullscreen-loading' },
    icon && createElement('span', { 'data-testid': 'fullscreen-icon' }, icon),
    title && createElement('span', null, title),
    subtitle && createElement('span', null, subtitle),
    children,
  );
};

const PrimaryButtonMock = ({ label, onPress, disabled, isPending, icon, loadingLabel }: any) => {
  const { createElement } = require('react');
  const displayLabel = isPending && loadingLabel ? loadingLabel : label;
  return createElement('button', {
    onClick: onPress,
    disabled: disabled || isPending,
    'data-testid': 'primary-button',
  },
    icon && createElement('span', { 'data-testid': 'primary-button-icon' }, isPending ? 'hourglass-outline' : icon),
    displayLabel,
  );
};

vi.mock('@/components/FullScreenLoading', () => ({
  FullScreenLoading: FullScreenLoadingMock,
}));

vi.mock('@/components/PrimaryButton', () => ({
  PrimaryButton: PrimaryButtonMock,
}));

// Mock @/components (GradientBackground, etc.)
vi.mock('@/components', () => ({
  GradientBackground: ({ children }: any) => children,
  FullScreenLoading: FullScreenLoadingMock,
  PrimaryButton: PrimaryButtonMock,
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
  IconCircle: ({ children }: any) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': 'icon-circle' }, children);
  },
  RadioGroup: ({ value, onChange }: any) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': `radio-${value}` });
  },
  StepperControl: ({ value, onDecrement, onIncrement, decrementDisabled, incrementDisabled, subtitle }: any) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': 'stepper-control' },
      createElement('button', { onClick: onDecrement, disabled: decrementDisabled, 'aria-label': 'Decrease' }, '−'),
      createElement('span', null, value),
      createElement('button', { onClick: onIncrement, disabled: incrementDisabled, 'aria-label': 'Increase' }, '+'),
      subtitle ? createElement('span', null, subtitle) : null,
    );
  },
  ThemeToggle: ({ value, onValueChange, disabled }: any) => {
    const { createElement } = require('react');
    return createElement('button', {
      onClick: () => onValueChange(!value),
      disabled: disabled ?? false,
      'aria-checked': value,
      role: 'switch',
    }, value ? 'ON' : 'OFF');
  },
}));

// Mock @/lib/alert
vi.mock('@/lib/alert', () => ({
  showNotification: vi.fn(),
}));

// Mock @/lib/theme — values must match real theme exports
vi.mock('@/lib/theme', () => {
  const c = {
    primary: '#2D2D2D',
    primaryDark: '#1A1A1A',
    primaryLight: '#404040',
    bgBase: '#E8D8C8',
    bgLight: '#FDF6F0',
    bgMid: '#F5E1D0',
    bgDark: '#E8CDB5',
    bgWarm: '#FFEEE0',
    accent: '#E8A87C',
    accentDark: '#D4956A',
    accentLight: '#FFD4B8',
    coral: '#FF8A65',
    coralSoft: '#FFAB91',
    gold: '#C9A962',
    goldLight: '#E8D5A3',
    category: {
      recipes: { bg: '#FFF0E5', text: '#8B5A3C' },
      planned: { bg: '#E8F5E9', text: '#2E7D32' },
      grocery: { bg: '#F3E5F5', text: '#7B1FA2' },
      add: { bg: '#FFF3E0', text: '#E65100' },
    },
    diet: {
      veggie: { bg: '#E8F5E9', text: '#2E7D32', cardBg: 'rgba(78, 154, 89, 0.12)', border: 'rgba(76, 175, 80, 0.7)' },
      fish: { bg: '#E3F2FD', text: '#1565C0', cardBg: 'rgba(21, 101, 192, 0.12)', border: 'rgba(66, 165, 245, 0.7)' },
      meat: { bg: '#FFEBEE', text: '#C62828', cardBg: 'rgba(180, 80, 70, 0.12)', border: 'rgba(229, 115, 115, 0.7)' },
    },
    white: '#FFFFFF',
    offWhite: '#FAFAFA',
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      muted: 'rgba(255, 255, 255, 0.6)',
      light: 'rgba(255, 255, 255, 0.4)',
      inverse: '#2D2D2D',
      dark: '#5D4E40',
    },
    border: 'rgba(255, 255, 255, 0.2)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    content: {
      heading: '#3D3D3D',
      headingWarm: '#4A3728',
      body: '#5D4E40',
      secondary: '#8B7355',
      strong: 'rgba(93, 78, 64, 0.8)',
      tertiary: 'rgba(93, 78, 64, 0.7)',
      subtitle: 'rgba(93, 78, 64, 0.6)',
      icon: 'rgba(93, 78, 64, 0.5)',
      placeholder: 'rgba(93, 78, 64, 0.4)',
      placeholderHex: '#8B735580',
    },
    surface: {
      overlay: 'rgba(93, 78, 64, 0.85)',
      overlayMedium: 'rgba(93, 78, 64, 0.75)',
      border: 'rgba(93, 78, 64, 0.3)',
      borderLight: 'rgba(93, 78, 64, 0.25)',
      divider: 'rgba(93, 78, 64, 0.2)',
      dividerSolid: '#D4C5B5',
      modal: '#F5EDE5',
      pressed: 'rgba(93, 78, 64, 0.15)',
      active: 'rgba(93, 78, 64, 0.12)',
      subtle: 'rgba(93, 78, 64, 0.1)',
      hover: 'rgba(93, 78, 64, 0.08)',
      tint: 'rgba(93, 78, 64, 0.06)',
    },
    button: {
      primary: '#7A6858', primaryPressed: '#6B5B4B', disabled: '#C5B8A8',
      primarySubtle: 'rgba(122, 104, 88, 0.08)',
      primarySurface: 'rgba(122, 104, 88, 0.1)',
      primaryActive: 'rgba(122, 104, 88, 0.12)',
      primaryHover: 'rgba(122, 104, 88, 0.15)',
      primaryDivider: 'rgba(122, 104, 88, 0.2)',
    },
    gray: {
      50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD',
      500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121',
    },
    success: '#4CAF50',
    successBg: '#E8F5E9',
    warning: '#FF9800',
    warningBg: '#FFF3E0',
    error: '#EF5350',
    errorBg: '#FFEBEE',
    info: '#42A5F5',
    infoBg: '#E3F2FD',
    danger: '#DC2626',
    overlay: {
      backdrop: 'rgba(0, 0, 0, 0.5)', backdropLight: 'rgba(0, 0, 0, 0.4)',
      strong: 'rgba(0, 0, 0, 0.6)',
    },
    mealPlan: {
      slotBg: 'rgba(240, 235, 228, 0.85)',
      containerBg: 'rgba(245, 240, 235, 0.95)',
      emptyBg: 'rgba(245, 242, 238, 0.7)',
      emptyStateBg: 'rgba(240, 235, 228, 0.5)',
    },
    rating: {
      positive: '#4A8B5C',
      negative: '#B0645C',
      positiveBg: 'rgba(76, 175, 80, 0.3)',
      negativeBg: 'rgba(239, 83, 80, 0.3)',
    },
    timeline: { badge: '#2D6A5A', line: 'rgba(45, 106, 90, 0.15)', completedText: '#166534' },
    chip: {
      bg: 'rgba(232, 222, 212, 0.7)',
      border: 'rgba(139, 115, 85, 0.3)',
      divider: 'rgba(139, 115, 85, 0.15)',
      fishActive: '#2D7AB8',
      meatActive: '#B85C38',
      favoriteActive: '#C75050',
    },
    shadow: { text: 'rgba(0, 0, 0, 0.15)' },
    glass: {
      light: 'rgba(255, 255, 255, 0.88)',
      medium: 'rgba(255, 255, 255, 0.78)',
      heavy: 'rgba(255, 255, 255, 0.95)',
      solid: 'rgba(255, 255, 255, 0.92)',
      bright: 'rgba(255, 255, 255, 0.9)',
      dark: 'rgba(255, 255, 255, 0.65)',
      subtle: 'rgba(255, 255, 255, 0.6)',
      faint: 'rgba(255, 255, 255, 0.5)',
      card: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(0, 0, 0, 0.04)',
      button: 'rgba(255, 255, 255, 0.3)',
      buttonPressed: 'rgba(255, 255, 255, 0.45)',
      buttonDefault: 'rgba(255, 255, 255, 0.35)',
      dim: 'rgba(255, 255, 255, 0.08)',
    },
    tabBar: {
      bg: 'rgba(235, 228, 219, 0.5)',
      bgFallback: 'rgba(235, 228, 219, 0.85)',
      bottomFill: '#EBE4DB',
      border: 'rgba(93, 78, 64, 0.1)',
      active: '#5D4E40',
      inactive: '#8B7355',
      focusBg: 'rgba(93, 78, 64, 0.12)',
    },
    ai: {
      primary: '#6B8E6B',
      primaryDark: '#5A7A5A',
      bg: 'rgba(107, 142, 107, 0.08)',
      bgPressed: 'rgba(107, 142, 107, 0.18)',
      muted: 'rgba(107, 142, 107, 0.5)',
      iconBg: 'rgba(107, 142, 107, 0.12)',
      light: 'rgba(107, 142, 107, 0.15)',
      badge: 'rgba(107, 142, 107, 0.95)',
      selectedBg: 'rgba(107, 142, 107, 0.1)',
      border: 'rgba(107, 142, 107, 0.3)',
    },
    destructive: {
      bg: 'rgba(180, 80, 70, 0.1)',
      icon: 'rgba(180, 80, 70, 0.8)',
      text: 'rgba(180, 80, 70, 0.9)',
    },
    gradient: {
      orb1: '#E8D0C0', orb2: '#D4A080', orb3: '#E0B090', orb4: '#C88060',
      stop1: '#D8B8A0', stop2: '#D0A080',
    },
    background: {
      mutedOverlay: 'rgba(0, 0, 0, 0.15)',
      defaultOverlay: 'rgba(255, 255, 255, 0.08)',
      structuredWash: 'rgba(235, 228, 219, 0.96)',
      structuredGradientStart: 'rgba(210, 200, 190, 0.15)',
      structuredGradientEnd: 'transparent',
      animatedOverlay: 'rgba(255, 255, 255, 0.08)',
    },
    tagDot: ['#7A9BBD', '#8B9D77', '#C47D5A', '#9B7BB8', '#5BA3A3', '#D4A574', '#B07070', '#6B8FA3'],
  };

  const mockStyles = {
    inputStyle: {},
    settingsTitleStyle: { fontSize: 14, fontWeight: '600', color: '#5D4E40' },
    settingsSubtitleStyle: { fontSize: 13, color: 'rgba(93, 78, 64, 0.6)' },
    accentUnderlineStyle: { width: 40, height: 3, borderRadius: 2, backgroundColor: '#6B8E6B' },
  };

  const mockFonts = {
    display: 'DMSans_600SemiBold',
    displayRegular: 'DMSans_400Regular',
    displayMedium: 'DMSans_500Medium',
    displayBold: 'DMSans_700Bold',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodySemibold: 'DMSans_600SemiBold',
    bodyBold: 'DMSans_700Bold',
    accent: 'DMSans_500Medium',
  };

  return {
  colors: c,
  lightColors: undefined, // re-exported but unused in tests
  spacing: { '2xs': 2, xs: 4, 'xs-sm': 6, sm: 8, 'sm-md': 10, md: 12, 'md-lg': 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40 },
  layout: {
    contentMaxWidth: 720,
    contentContainer: { maxWidth: 720, alignSelf: 'center', width: '100%' },
    screenPaddingTop: 44,
    screenPaddingHorizontal: 20,
    sectionGap: 24,
    cardGap: 8,
    tabBarHeight: 88,
    tabBar: {
      height: 44,
      bottomOffset: 16,
      horizontalMargin: 20,
      borderRadius: 16,
      contentBottomPadding: 76,
      overlayBottomOffset: 60,
    },
  },
  borderRadius: { '3xs': 3, '2xs': 4, 'xs-sm': 6, xs: 8, 'sm-md': 10, sm: 12, 'md-lg': 14, md: 16, lg: 20, 'lg-xl': 22, xl: 24, full: 9999 },
  iconSize: { xs: 14, sm: 16, md: 18, lg: 20, xl: 24, '2xl': 32, '3xl': 40 },
  iconContainer: { xs: 36, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 80 },
  shadows: {
    none: { boxShadow: '0px 0px 0px 0px transparent' },
    xs: { boxShadow: '1px 1px 2px 0px rgba(0, 0, 0, 0.03)' },
    sm: { boxShadow: '1px 2px 6px 0px rgba(0, 0, 0, 0.04)' },
    card: { boxShadow: '1px 2px 6px 0px rgba(0, 0, 0, 0.06)' },
    md: { boxShadow: '2px 4px 12px 0px rgba(0, 0, 0, 0.06)' },
    lg: { boxShadow: '2px 8px 20px 0px rgba(0, 0, 0, 0.08)' },
    xl: { boxShadow: '3px 12px 28px 0px rgba(0, 0, 0, 0.12)' },
    glow: { boxShadow: '1px 4px 16px 0px rgba(232, 168, 124, 0.25)' },
    glowSoft: { boxShadow: '1px 2px 10px 0px rgba(232, 168, 124, 0.15)' },
    cardRaised: { boxShadow: '2px 6px 16px 0px rgba(0, 0, 0, 0.1)' },
    float: { boxShadow: '1px 2px 8px 0px rgba(0, 0, 0, 0.15)' },
  },
  animation: { fast: 150, normal: 250, slow: 350, spring: { damping: 15, stiffness: 100 } },
  fontSize: { xs: 10, sm: 11, base: 12, md: 13, lg: 14, xl: 15, 'lg-xl': 16, '2xl': 17, 'xl-2xl': 18, '3xl': 20, '4xl': 26, '3xl-4xl': 28, '5xl': 32, '6xl': 40 },
  fontWeight: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' },
  fontFamily: {
    display: '"DM Sans", sans-serif',
    displayRegular: '"DM Sans", sans-serif',
    displayMedium: '"DM Sans", sans-serif',
    displayBold: '"DM Sans", sans-serif',
    body: '"DM Sans", sans-serif',
    bodyMedium: '"DM Sans", sans-serif',
    bodySemibold: '"DM Sans", sans-serif',
    bodyBold: '"DM Sans", sans-serif',
    accent: '"DM Sans", sans-serif',
  },
  fontFamilyWeight: {
    display: '600', displayRegular: '400', displayMedium: '500', displayBold: '700',
    body: '400', bodyMedium: '500', bodySemibold: '600', bodyBold: '700', accent: '500',
  },
  letterSpacing: { tighter: -0.8, tight: -0.5, snug: -0.3, normal: -0.2, wide: 0.8, wider: 1.2 },
  typography: {
    displayLarge: {}, displayMedium: {}, displaySmall: {},
    headingLarge: {}, headingMedium: {}, headingSmall: {},
    bodyLarge: {}, bodyMedium: {}, bodySmall: {},
    labelLarge: {}, labelMedium: {}, labelSmall: {},
    caption: {}, captionSmall: {},
    overline: {},
  },
  inputStyle: {},
  settingsTitleStyle: { fontSize: 14, fontWeight: '600', color: '#5D4E40' },
  settingsSubtitleStyle: { fontSize: 13, color: 'rgba(93, 78, 64, 0.6)' },
  accentUnderlineStyle: { width: 40, height: 3, borderRadius: 2, backgroundColor: '#6B8E6B' },
  createStyles: () => mockStyles,
  circleStyle: (size: number) => ({ width: size, height: size, borderRadius: size / 2 }),
  dotSize: { md: 10 },
  lineHeight: { sm: 18, md: 20, lg: 22, xl: 24, '2xl': 26 },
  defaultFontFamily: mockFonts,
  terminalFontFamily: {
    display: 'Courier',
    displayRegular: 'Courier',
    displayMedium: 'Courier',
    displayBold: 'Courier',
    body: 'Courier',
    bodyMedium: 'Courier',
    bodySemibold: 'Courier',
    bodyBold: 'Courier',
    accent: 'Courier',
  },
  useTheme: () => ({
    colors: c,
    fonts: mockFonts,
    styles: mockStyles,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock @/lib/settings-context
vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      language: 'en',
      itemsAtHome: [],
      favoriteRecipes: [],
      noteSuggestions: [],
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
    needsLanguagePrompt: false,
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
