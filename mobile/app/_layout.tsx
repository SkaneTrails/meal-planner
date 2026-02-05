/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

// NOTE: For web, we use Firebase's native signInWithPopup which handles popup
// communication correctly. The expo-web-browser maybeCompleteAuthSession is only
// needed for native platforms using expo-auth-session.

import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { EnhancedModeProvider } from '@/lib/enhanced-mode-context';
import { GroceryProvider } from '@/lib/grocery-context';
import { AuthProvider } from '@/lib/hooks/use-auth';
import {
  persistQueryCache,
  QueryProvider,
  restoreQueryCache,
} from '@/lib/query-provider';
import { SettingsProvider } from '@/lib/settings-context';
import '../global.css';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load fonts: DM Sans for body, Playfair Display for headings, Ionicons for icons
  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Ionicons: require('../public/fonts/Ionicons.ttf'),
    // DM Sans - modern, clean body text
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    // Playfair Display - elegant serif for headings
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  // Restore cache on app startup
  useEffect(() => {
    restoreQueryCache();
  }, []);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Persist cache when app goes to background
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

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <QueryProvider>
        <EnhancedModeProvider>
          <SettingsProvider>
            <GroceryProvider>
              <StatusBar style="auto" />
              <Stack screenOptions={{ animation: 'slide_from_right' }}>
                <Stack.Screen
                  name="sign-in"
                  options={{ headerShown: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name="no-access"
                  options={{ headerShown: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{ headerShown: false, animation: 'fade' }}
                />
              </Stack>
            </GroceryProvider>
          </SettingsProvider>
        </EnhancedModeProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
