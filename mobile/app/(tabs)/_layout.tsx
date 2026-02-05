/**
 * Tab layout for main navigation.
 * Luxurious floating glass tab bar design.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 */

import React from 'react';
import { View, ActivityIndicator, Platform, Pressable, Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { colors, shadows } from '@/lib/theme';

// Custom tab bar background with blur effect
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={60}
        tint="dark"
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
  // Fallback for Android/web - glass effect
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
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
    refetch,
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

  // Show error state if there was an API error (don't redirect, could be temporary)
  if (isError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: 24,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Connection Error
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Could not load your account info
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            marginTop: 24,
            backgroundColor: '#10b981',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Redirect to no-access if user doesn't have a household (unless superuser)
  if (
    currentUser &&
    !currentUser.household_id &&
    currentUser.role !== 'superuser'
  ) {
    return <Redirect href="/no-access" />;
  }

  // Check if user is superuser (show admin tab)
  const isSuperuser = currentUser?.role === 'superuser';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
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
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "book" : "book-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            }}>
              <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={focused ? '#5D4E40' : color} />
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
