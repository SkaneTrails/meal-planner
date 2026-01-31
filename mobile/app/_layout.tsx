/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

// NOTE: For web, we use Firebase's native signInWithPopup which handles popup
// communication correctly. The expo-web-browser maybeCompleteAuthSession is only
// needed for native platforms using expo-auth-session.

import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { QueryProvider, restoreQueryCache, persistQueryCache } from '@/lib/query-provider';
import { EnhancedModeProvider } from '@/lib/enhanced-mode-context';
import { SettingsProvider } from '@/lib/settings-context';
import { AuthProvider } from '@/lib/hooks/use-auth';
import '../global.css';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load Ionicons font for web compatibility
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
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

    const subscription = AppState.addEventListener('change', handleAppStateChange);
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
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen
                name="sign-in"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="recipe/[id]"
                options={{
                  title: 'Recipe',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="add-recipe"
                options={{
                  title: 'Add Recipe',
                  presentation: 'modal',
                  headerBackTitle: 'Cancel',
                }}
              />
              <Stack.Screen
                name="select-recipe"
                options={{
                  title: 'Select Recipe',
                  presentation: 'modal',
                  headerBackTitle: 'Cancel',
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  title: 'Settings',
                  presentation: 'card',
                  headerShown: false,
                }}
              />
            </Stack>
          </SettingsProvider>
        </EnhancedModeProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
