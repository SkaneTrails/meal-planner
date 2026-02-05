/**
 * No access screen - shown to authenticated users without a household.
 * Provides logout option and explains the situation.
 */

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';

export default function NoAccessScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser({
    enabled: !loading && !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  // If not authenticated, redirect to sign-in
  if (!loading && !user) {
    return <Redirect href="/sign-in" />;
  }

  // If user has a household or is a superuser, redirect to home
  if (currentUser?.household_id || currentUser?.role === 'superuser') {
    return <Redirect href="/(tabs)" />;
  }

  // Show loading while checking user state
  if (loading || userLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#4A3728" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50">
      {/* Main content - centered */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View className="w-24 h-24 bg-amber-100 rounded-3xl items-center justify-center mb-6 shadow-sm">
          <Ionicons name="lock-closed" size={48} color="#92400e" />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-stone-800 mb-2">
          No Access
        </Text>
        <Text className="text-stone-500 text-center text-base leading-relaxed mb-4">
          You're signed in as
        </Text>
        <Text className="text-stone-700 font-semibold text-lg mb-4">
          {user?.email}
        </Text>
        <Text className="text-stone-500 text-center text-base leading-relaxed mb-12">
          but you haven't been added to a household yet.{'\n\n'}
          Ask a household admin to invite you.
        </Text>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          className="bg-white border border-stone-200 rounded-2xl px-6 py-4 flex-row items-center justify-center w-full shadow-sm active:bg-stone-50"
          style={{ elevation: 2 }}
        >
          <Ionicons name="log-out-outline" size={20} color="#4A3728" />
          <Text className="text-stone-700 font-semibold text-base ml-3">
            Sign Out
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="pb-12 px-8">
        <Text className="text-stone-400 text-xs text-center">
          Contact the app administrator if you need help
        </Text>
      </View>
    </View>
  );
}
