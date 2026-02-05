/**
 * Tab layout for main navigation.
 * Luxurious floating glass tab bar design.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 */

import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { colors, shadows } from '@/lib/theme';

// Custom tab bar background with solid cream/peach background
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
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: 'rgba(253, 246, 240, 0.95)',
        }}
      />
    );
  }
  // Fallback for Android/web - solid cream background
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FDF6F0',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(139, 115, 85, 0.15)',
      }}
    />
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const {
    data: currentUser,
    isLoading: userLoading,
    isError,
  } = useCurrentUser({ enabled: !loading && !!user });

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

  // Show loading while fetching user info
  if (userLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}
      >
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // If API returns error (likely 403 - user not in any household), redirect to sign-in
  // Users without household access will be manually added to households
  if (isError) {
    return <Redirect href="/sign-in" />;
  }

  // Check if user is superuser (show admin tab)
  const isSuperuser = currentUser?.role === 'superuser';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5D4E40',
        tabBarInactiveTintColor: '#8B7355',
        tabBarShowLabel: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 24,
          height: 56,
          paddingBottom: 0,
          paddingTop: 0,
          ...shadows.md,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
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
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
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
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "book" : "book-outline"} size={20} color={color} />
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
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={20} color={color} />
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
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "settings" : "settings-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarAccessibilityLabel: 'Admin',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 6,
              borderRadius: 12,
              backgroundColor: focused ? 'rgba(139, 115, 85, 0.15)' : 'transparent',
            }}>
              <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={20} color={color} />
            </View>
          ),
          // Only show admin tab for superusers
          href: isSuperuser ? '/admin' : null,
        }}
      />
      {/* Hidden screens that still show tab bar */}
      <Tabs.Screen
        name="recipe/[id]"
        options={{
          href: null, // Hide from tab bar
          title: 'Recipe',
        }}
      />
      <Tabs.Screen
        name="add-recipe"
        options={{
          href: null, // Hide from tab bar
          title: 'Add Recipe',
        }}
      />
      <Tabs.Screen
        name="select-recipe"
        options={{
          href: null, // Hide from tab bar
          title: 'Select Recipe',
        }}
      />
    </Tabs>
  );
}
