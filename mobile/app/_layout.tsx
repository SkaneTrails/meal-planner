/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

// IMPORTANT: This must be called before any other imports to properly handle
// OAuth popup callbacks on web. It closes the popup window when returning from
// the auth provider.
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// On web, check if this is an OAuth callback popup BEFORE React renders.
// If maybeCompleteAuthSession succeeds, the popup will close and we don't need to render.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const result = WebBrowser.maybeCompleteAuthSession();
  console.log('maybeCompleteAuthSession result:', result);
  console.log('Current URL:', window.location.href);
  console.log('Has opener:', !!window.opener);

  // If this is a successful OAuth callback, the popup should close.
  // If it doesn't close immediately, we might need to prevent the redirect.
  if (result.type === 'success' && window.opener) {
    // Popup handled - prevent further rendering
    console.log('OAuth callback handled, popup should close');
  }
}

import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider, restoreQueryCache, persistQueryCache } from '@/lib/query-provider';
import { EnhancedModeProvider } from '@/lib/enhanced-mode-context';
import { SettingsProvider } from '@/lib/settings-context';
import { AuthProvider } from '@/lib/hooks/use-auth';
import '../global.css';

export default function RootLayout() {
  // Restore cache on app startup
  useEffect(() => {
    restoreQueryCache();
  }, []);

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
