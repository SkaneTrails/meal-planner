/**
 * Tab layout for main navigation.
 * Luxurious floating glass tab bar design.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLanguageSync } from '@/lib/hooks/use-language-sync';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/theme';

const TabBarBackground = () => {
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
          backgroundColor: 'rgba(235, 228, 219, 0.85)',
        }}
      />
    );
  }
  // Fallback for Android/web - warm beige with subtle shadow
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(235, 228, 219, 0.95)',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(93, 78, 64, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
    />
  );
};

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const {
    data: currentUser,
    isLoading: userLoading,
    isError,
  } = useCurrentUser({ enabled: !loading && !!user });

  useLanguageSync(currentUser?.household_id);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bgLight,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

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
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(93, 78, 64, 0.12)'
                  : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? '#5D4E40' : '#6B5B4B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('tabs.recipes'),
          tabBarAccessibilityLabel: t('tabs.recipes'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(93, 78, 64, 0.12)'
                  : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={20}
                color={focused ? '#5D4E40' : '#6B5B4B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: t('tabs.mealPlan'),
          tabBarAccessibilityLabel: t('tabs.mealPlan'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(93, 78, 64, 0.12)'
                  : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? '#5D4E40' : '#6B5B4B'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: t('tabs.grocery'),
          tabBarAccessibilityLabel: t('tabs.grocery'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(93, 78, 64, 0.12)'
                  : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={20}
                color={focused ? '#5D4E40' : '#6B5B4B'}
              />
            </View>
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
