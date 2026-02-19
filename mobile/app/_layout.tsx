/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

// NOTE: For web, we use Firebase's native signInWithPopup which handles popup
// communication correctly. The expo-web-browser maybeCompleteAuthSession is only
// needed for native platforms using expo-auth-session.

import { NotoEmoji_400Regular } from '@expo-google-fonts/noto-emoji';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { LanguagePromptModal } from '@/components/LanguagePromptModal';
import { showNotification } from '@/lib/alert';
import { GroceryProvider } from '@/lib/grocery-context';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import {
  persistQueryCache,
  QueryProvider,
  restoreQueryCache,
} from '@/lib/query-provider';
import {
  type AppLanguage,
  SettingsProvider,
  useSettings,
} from '@/lib/settings-context';
import {
  allRequiredFonts,
  defaultThemeId,
  isThemeId,
  ThemeProvider,
  themes,
  useTheme,
} from '@/lib/theme';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Silently ignore on web where splash screen may not be available
});

const AppContent = () => {
  const { colors } = useTheme();
  const { needsLanguagePrompt, setLanguage } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const { t } = useTranslation();

  const handleLanguageConfirm = useCallback(
    async (language: AppLanguage) => {
      setIsSaving(true);
      try {
        await setLanguage(language);
      } catch {
        showNotification(
          t('common.error'),
          t('settings.failedToChangeLanguage'),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [setLanguage, t],
  );

  return (
    <>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.bgBase },
          }}
        >
          <Stack.Screen
            name="sign-in"
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen
            name="recipe/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="select-recipe"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="add-recipe"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <FloatingTabBar />
        <CRTOverlay />
      </View>
      <LanguagePromptModal
        visible={needsLanguagePrompt}
        onConfirm={handleLanguageConfirm}
        isSaving={isSaving}
      />
    </>
  );
};

const THEME_STORAGE_KEY = '@meal_planner_theme';

interface ThemeRootProps {
  children: React.ReactNode;
  envTheme: string;
  fontsReady: boolean;
}

const ThemeRoot = ({ children, envTheme }: ThemeRootProps) => {
  const [themeId, setThemeIdState] = useState(envTheme);

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored !== null && isThemeId(stored)) {
          setThemeIdState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeName = useCallback((name: string) => {
    if (!isThemeId(name)) return;
    setThemeIdState(name);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, name).catch(() => {});
  }, []);

  const theme = themes[themeId] ?? themes[defaultThemeId];

  return (
    <ThemeProvider theme={theme} setThemeName={setThemeName}>
      {children}
    </ThemeProvider>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Ionicons: require('../public/fonts/Ionicons.ttf'),
    NotoEmoji_400Regular,
    // Theme-specific fonts are collected from the registry at build time
    ...allRequiredFonts,
  });

  useEffect(() => {
    restoreQueryCache();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        persistQueryCache();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const envOverride = process.env.EXPO_PUBLIC_THEME;
  const envTheme =
    envOverride && isThemeId(envOverride) ? envOverride : defaultThemeId;

  return (
    <ErrorBoundary>
      <ThemeRoot envTheme={envTheme} fontsReady>
        <AuthProvider>
          <QueryProvider>
            <SettingsProvider>
              <GroceryProvider>
                <AppContent />
              </GroceryProvider>
            </SettingsProvider>
          </QueryProvider>
        </AuthProvider>
      </ThemeRoot>
    </ErrorBoundary>
  );
}
