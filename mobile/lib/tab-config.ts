/**
 * Tab routing configuration and active-tab detection.
 * Pure logic — no runtime Expo/RN imports so it can be unit-tested without mocks.
 * Icon names use a type-only import for compile-time validation.
 */

export type IoniconName =
  keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;

export type TabDef = {
  route: string;
  matchPrefixes: string[];
  icon: IoniconName;
  iconFocused: IoniconName;
  labelKey: string;
};

export const TABS: TabDef[] = [
  {
    route: '/(tabs)',
    matchPrefixes: ['/'],
    icon: 'home-outline',
    iconFocused: 'home',
    labelKey: 'tabs.home',
  },
  {
    route: '/(tabs)/recipes',
    matchPrefixes: ['/recipes', '/recipe/'],
    icon: 'book-outline',
    iconFocused: 'book',
    labelKey: 'tabs.recipes',
  },
  {
    route: '/(tabs)/meal-plan',
    matchPrefixes: ['/meal-plan'],
    icon: 'calendar-outline',
    iconFocused: 'calendar',
    labelKey: 'tabs.mealPlan',
  },
  {
    route: '/(tabs)/grocery',
    matchPrefixes: ['/grocery'],
    icon: 'cart-outline',
    iconFocused: 'cart',
    labelKey: 'tabs.grocery',
  },
];

export const HIDDEN_ON = ['/sign-in', '/no-access'];

const normalizePathname = (pathname: string): string => {
  const stripped = pathname.replace(/^\/\(tabs\)/, '');
  return stripped || '/';
};

export const isTabActive = (pathname: string, tab: TabDef): boolean => {
  const normalized = normalizePathname(pathname);
  return tab.matchPrefixes.some((prefix) => {
    if (prefix === '/') {
      return normalized === '/' || normalized === '/index';
    }
    return normalized.startsWith(prefix);
  });
};
