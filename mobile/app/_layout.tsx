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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GroceryProvider } from '@/lib/grocery-context';
import { AuthProvider } from '@/lib/hooks/use-auth';
import {
  persistQueryCache,
  QueryProvider,
  restoreQueryCache,
} from '@/lib/query-provider';
import { SettingsProvider } from '@/lib/settings-context';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Silently ignore on web where splash screen may not be available
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Ionicons: require('../public/fonts/Ionicons.ttf'),
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryProvider>
          <SettingsProvider>
            <GroceryProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  animation: 'slide_from_right',
                  contentStyle: { backgroundColor: '#E8D8C8' }, // Match background.png base color
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
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="select-recipe"
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="add-recipe"
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
              </Stack>
            </GroceryProvider>
          </SettingsProvider>
        </QueryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
