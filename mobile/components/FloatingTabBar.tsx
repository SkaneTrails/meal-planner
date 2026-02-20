/**
 * Floating tab bar rendered at the root layout level.
 * Always visible (except on auth screens) with themed transparency.
 * Platform-aware: BlurView on iOS, backdrop-filter on web, opaque fallback on Android.
 * Shape, border, and blur are controlled by TabBarTokens from the active theme.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { HIDDEN_ON, isTabActive, TABS } from '@/lib/tab-config';
import type { TabBarTokens } from '@/lib/theme';
import { layout, spacing, useTheme } from '@/lib/theme';

const TabBarBackground = ({ tokens }: { tokens: TabBarTokens }) => {
  const { colors } = useTheme();
  const {
    borderRadius: barRadius,
    borderWidth,
    blur,
    blurIntensity,
    blurTint,
  } = tokens;

  if (Platform.OS === 'ios') {
    return blur ? (
      <BlurView
        intensity={blurIntensity}
        tint={blurTint}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: barRadius,
            overflow: 'hidden',
            backgroundColor: colors.tabBar.bg,
            borderWidth,
            borderColor: colors.tabBar.border,
          },
        ]}
      />
    ) : (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: barRadius,
            backgroundColor: colors.tabBar.bgFallback,
            borderWidth,
            borderColor: colors.tabBar.border,
          },
        ]}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: barRadius,
            borderWidth,
            backgroundColor: blur ? colors.tabBar.bg : colors.tabBar.bgFallback,
            borderColor: colors.tabBar.border,
          },
          blur &&
            ({
              backdropFilter: `blur(${blurIntensity / 2}px)`,
              WebkitBackdropFilter: `blur(${blurIntensity / 2}px)`,
            } as Record<string, string>),
        ]}
      />
    );
  }

  // Android fallback — no blur support, use opaque background
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: barRadius,
          borderWidth,
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
  const { colors, borderRadius, shadows, tabBar } = useTheme();

  // Hide on auth screens or when not logged in
  if (!user || HIDDEN_ON.includes(pathname)) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.barOuter}>
        <View
          style={[
            styles.bar,
            shadows.md,
            { borderRadius: tabBar.borderRadius },
          ]}
        >
          <TabBarBackground tokens={tabBar} />
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
                    { borderRadius: borderRadius.sm },
                    active && {
                      backgroundColor: colors.tabBar.focusBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      (active
                        ? tab.iconFocused
                        : tab.icon) as keyof typeof Ionicons.glyphMap
                    }
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
    paddingHorizontal: 12,
    paddingVertical: spacing['xs-sm'],
  },
});
