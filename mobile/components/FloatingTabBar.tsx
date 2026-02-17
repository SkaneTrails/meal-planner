/**
 * Floating tab bar rendered at the root layout level.
 * Always visible (except on auth screens) with acrylic transparency.
 * Platform-aware: BlurView on iOS, backdrop-filter on web, opaque fallback on Android.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, layout, shadows, spacing, useTheme } from '@/lib/theme';

type TabDef = {
  route: string;
  matchPrefixes: string[];
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

const TABS: TabDef[] = [
  {
    route: '/(tabs)',
    matchPrefixes: ['/(tabs)', '/index'],
    icon: 'home-outline',
    iconFocused: 'home',
    labelKey: 'tabs.home',
  },
  {
    route: '/(tabs)/recipes',
    matchPrefixes: ['/(tabs)/recipes', '/recipe/'],
    icon: 'book-outline',
    iconFocused: 'book',
    labelKey: 'tabs.recipes',
  },
  {
    route: '/(tabs)/meal-plan',
    matchPrefixes: ['/(tabs)/meal-plan', '/select-recipe'],
    icon: 'calendar-outline',
    iconFocused: 'calendar',
    labelKey: 'tabs.mealPlan',
  },
  {
    route: '/(tabs)/grocery',
    matchPrefixes: ['/(tabs)/grocery'],
    icon: 'cart-outline',
    iconFocused: 'cart',
    labelKey: 'tabs.grocery',
  },
];

const HIDDEN_ON = ['/sign-in', '/no-access'];

const isTabActive = (pathname: string, tab: TabDef): boolean =>
  tab.matchPrefixes.some((prefix) => {
    if (prefix === '/(tabs)' || prefix === '/index') {
      return (
        pathname === '/' || pathname === '/(tabs)' || pathname === '/index'
      );
    }
    return pathname.startsWith(prefix);
  });

const TabBarBackground = () => {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={40}
        tint="light"
        style={[
          StyleSheet.absoluteFill,
          styles.blurFill,
          { backgroundColor: colors.tabBar.bg },
        ]}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.webFill,
          {
            backgroundColor: colors.tabBar.bg,
            borderColor: colors.tabBar.border,
          },
          // @ts-expect-error — RN web supports backdropFilter
          { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
        ]}
      />
    );
  }

  // Android fallback — near-opaque warm beige
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.androidFill,
        {
          backgroundColor: colors.tabBar.bgFallback,
          borderColor: colors.tabBar.border,
        },
      ]}
    />
  );
};

export const FloatingTabBar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Hide on auth screens or when not logged in
  if (!user || HIDDEN_ON.includes(pathname)) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.barOuter}>
        <View style={styles.bar}>
          <TabBarBackground />
          {TABS.map((tab) => {
            const active = isTabActive(pathname, tab);
            return (
              <Pressable
                key={tab.route}
                accessibilityRole="tab"
                accessibilityLabel={t(tab.labelKey)}
                accessibilityState={{ selected: active }}
                onPress={() => router.push(tab.route as never)}
                style={styles.tabButton}
              >
                <View
                  style={[
                    styles.iconWrap,
                    active && {
                      backgroundColor: colors.tabBar.focusBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={active ? tab.iconFocused : tab.icon}
                    size={20}
                    color={
                      active ? colors.tabBar.active : colors.tabBar.inactive
                    }
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View
        style={[
          styles.bottomFill,
          { backgroundColor: colors.tabBar.bottomFill },
        ]}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barOuter: {
    paddingHorizontal: layout.tabBar.horizontalMargin,
    alignItems: 'center' as const,
  },
  bar: {
    flexDirection: 'row',
    height: layout.tabBar.height,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    borderRadius: layout.tabBar.borderRadius,
    ...shadows.md,
  },
  bottomFill: {
    height: layout.tabBar.bottomOffset,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: spacing['xs-sm'],
  },
  blurFill: {
    borderRadius: layout.tabBar.borderRadius,
    overflow: 'hidden',
  },
  webFill: {
    borderRadius: layout.tabBar.borderRadius,
    borderWidth: 0.5,
  },
  androidFill: {
    borderRadius: layout.tabBar.borderRadius,
    borderWidth: 0.5,
  },
});
