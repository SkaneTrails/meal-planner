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
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/theme';

// Custom tab bar background with subtle glass effect
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={40}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }}
      />
    );
  }
  // Fallback for Android/web - subtle semi-transparent
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(139, 115, 85, 0.08)',
      }}
    />
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
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

  // If API returns error (likely 403 - user not in any household), redirect to no-access
  // The no-access screen shows the user's email and a sign-out option
  if (isError) {
    return <Redirect href="/no-access" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5D4E40',
        tabBarInactiveTintColor: '#8B7355',
        tabBarShowLabel: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 32,
          right: 32,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 16,
          height: 44,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={20} color={focused ? '#5D4E40' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('tabs.recipes'),
          tabBarAccessibilityLabel: t('tabs.recipes'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: t('tabs.mealPlan'),
          tabBarAccessibilityLabel: t('tabs.mealPlan'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: t('tabs.grocery'),
          tabBarAccessibilityLabel: t('tabs.grocery'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          href: null, // Hide from tab bar - accessed via home screen gear icon
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('tabs.admin'),
          href: null, // Hide from tab bar - accessed via Settings page
        }}
      />
      {/* Hidden screens that still show tab bar */}
      <Tabs.Screen
        name="recipe/[id]"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.recipe'),
        }}
      />
      <Tabs.Screen
        name="add-recipe"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.addRecipe'),
        }}
      />
      <Tabs.Screen
        name="select-recipe"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.selectRecipe'),
        }}
      />
    </Tabs>
  );
}
