/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

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
