/**
 * Tab layout for main navigation.
 * Luxurious floating glass tab bar design.
 * Requires authentication - redirects to sign-in if not authenticated.
 */

import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/lib/hooks/use-auth';
import { colors, shadows } from '@/lib/theme';

// Custom tab bar background with blur effect
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 28,
          overflow: 'hidden',
        }}
      />
    );
  }
  // Fallback for Android/web - solid white with transparency
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 28,
      }}
    />
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgLight }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarShowLabel: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 28,
          height: 64,
          paddingBottom: 0,
          paddingTop: 0,
          ...shadows.lg,
        },
        tabBarItemStyle: {
          paddingVertical: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? colors.bgWarm : 'transparent',
            }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarAccessibilityLabel: 'Recipes',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? colors.bgWarm : 'transparent',
            }}>
              <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarAccessibilityLabel: 'Meal Plan',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? colors.bgWarm : 'transparent',
            }}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarAccessibilityLabel: 'Grocery List',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? colors.bgWarm : 'transparent',
            }}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
