/**
 * Persistent floating tab bar rendered at the root layout level.
 * Whitish glassy acrylic background, visible on all screens.
 * Hidden on sign-in and no-access screens.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';

interface TabItem {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}

const TAB_ITEMS: TabItem[] = [
  {
    name: 'home',
    path: '/',
    icon: 'home-outline',
    activeIcon: 'home',
    labelKey: 'tabs.home',
  },
  {
    name: 'recipes',
    path: '/recipes',
    icon: 'book-outline',
    activeIcon: 'book',
    labelKey: 'tabs.recipes',
  },
  {
    name: 'meal-plan',
    path: '/meal-plan',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    labelKey: 'tabs.mealPlan',
  },
  {
    name: 'grocery',
    path: '/grocery',
    icon: 'cart-outline',
    activeIcon: 'cart',
    labelKey: 'tabs.grocery',
  },
];

const HIDDEN_PATHS = ['/sign-in', '/no-access'];

const getActiveTab = (pathname: string): string | null => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/recipes')) return 'recipes';
  if (pathname.startsWith('/meal-plan')) return 'meal-plan';
  if (pathname.startsWith('/grocery')) return 'grocery';
  return null;
};

const TabBarBackground = () => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={50}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
        }}
      />
    );
  }
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
      }}
    />
  );
};

export const FloatingTabBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const activeTab = getActiveTab(pathname);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 32,
        right: 32,
        height: 44,
        zIndex: 999,
      }}
    >
      <TabBarBackground />
      <View
        style={{
          flexDirection: 'row',
          height: '100%',
        }}
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <Pressable
              key={tab.name}
              onPress={() => router.navigate(tab.path as never)}
              accessibilityLabel={t(tab.labelKey)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: isActive
                    ? 'rgba(93, 78, 64, 0.12)'
                    : 'transparent',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={20}
                  color={isActive ? '#5D4E40' : '#6B5B4B'}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
