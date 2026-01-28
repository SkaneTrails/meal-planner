/**
 * Root layout for the Expo app.
 * Sets up providers and global configuration.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '@/lib/query-provider';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryProvider>
      <StatusBar style="auto" />
      <Stack>
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
      </Stack>
    </QueryProvider>
  );
}
