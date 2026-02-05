/**
 * Tab layout for main navigation.
 * Modern floating tab bar design.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 */

import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';

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
        tabBarActiveTintColor: '#4A3728',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 0,
          borderRadius: 20,
          height: 56,
          paddingBottom: 0,
          paddingTop: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarAccessibilityLabel: 'Recipes',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarAccessibilityLabel: 'Meal Plan',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarAccessibilityLabel: 'Grocery List',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarAccessibilityLabel: 'Admin',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
          // Only show admin tab for superusers
          href: isSuperuser ? '/admin' : null,
        }}
      />
    </Tabs>
  );
}
