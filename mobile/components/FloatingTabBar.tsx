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
import { borderRadius, colors, layout, shadows } from '@/lib/theme';

type TabDef = {
  route: string;
  matchPrefixes: string[];
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  {
    route: '/(tabs)',
    matchPrefixes: ['/(tabs)', '/index'],
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    route: '/(tabs)/recipes',
    matchPrefixes: ['/(tabs)/recipes', '/recipe/'],
    icon: 'book-outline',
    iconFocused: 'book',
  },
  {
    route: '/(tabs)/meal-plan',
    matchPrefixes: ['/(tabs)/meal-plan', '/select-recipe'],
    icon: 'calendar-outline',
    iconFocused: 'calendar',
  },
  {
    route: '/(tabs)/grocery',
    matchPrefixes: ['/(tabs)/grocery'],
    icon: 'cart-outline',
    iconFocused: 'cart',
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
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={40}
        tint="light"
        style={[StyleSheet.absoluteFill, styles.blurFill]}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.webFill,
          // @ts-expect-error — RN web supports backdropFilter
          { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
        ]}
      />
    );
  }

  // Android fallback — near-opaque warm beige
  return <View style={[StyleSheet.absoluteFill, styles.androidFill]} />;
};

export const FloatingTabBar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Hide on auth screens or when not logged in
  if (!user || HIDDEN_ON.includes(pathname)) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        <TabBarBackground />
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab);
          return (
            <Pressable
              key={tab.route}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.push(tab.route as never)}
              style={styles.tabButton}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={active ? tab.iconFocused : tab.icon}
                  size={20}
                  color={active ? colors.tabBar.active : colors.tabBar.inactive}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.bottomFill} />
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
  bar: {
    flexDirection: 'row',
    height: layout.tabBar.height,
    marginHorizontal: layout.tabBar.horizontalMargin,
    borderRadius: layout.tabBar.borderRadius,
    ...shadows.md,
  },
  bottomFill: {
    height: layout.tabBar.bottomOffset,
    backgroundColor: colors.tabBar.bottomFill,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconWrapActive: {
    backgroundColor: colors.tabBar.focusBg,
  },
  blurFill: {
    borderRadius: layout.tabBar.borderRadius,
    overflow: 'hidden',
    backgroundColor: colors.tabBar.bg,
  },
  webFill: {
    borderRadius: layout.tabBar.borderRadius,
    backgroundColor: colors.tabBar.bg,
    borderWidth: 0.5,
    borderColor: colors.tabBar.border,
  },
  androidFill: {
    borderRadius: layout.tabBar.borderRadius,
    backgroundColor: colors.tabBar.bgFallback,
    borderWidth: 0.5,
    borderColor: colors.tabBar.border,
  },
});
