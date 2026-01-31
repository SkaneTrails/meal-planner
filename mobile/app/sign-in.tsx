/**
 * Sign-in screen with Google authentication.
 */

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/hooks/use-auth';

export default function SignInScreen() {
  const { user, loading, error, signIn } = useAuth();

  // If already signed in, redirect to home
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* App Title */}
      <Text className="text-4xl font-bold text-emerald-600 mb-2">
        Meal Planner
      </Text>
      <Text className="text-gray-500 mb-12 text-center">
        Plan your meals, organize recipes, and create grocery lists
      </Text>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 w-full">
          <Text className="text-red-700 text-center">{error}</Text>
        </View>
      )}

      {/* Sign In Button */}
      <Pressable
        onPress={signIn}
        className="bg-white border border-gray-300 rounded-lg px-6 py-4 flex-row items-center justify-center w-full shadow-sm active:bg-gray-50"
      >
        {/* Google Icon */}
        <View className="w-6 h-6 mr-3">
          <Text className="text-xl">🔐</Text>
        </View>
        <Text className="text-gray-700 font-semibold text-lg">
          Sign in with Google
        </Text>
      </Pressable>

      {/* Footer */}
      <Text className="text-gray-400 text-sm mt-12 text-center">
        Only authorized users can access this app
      </Text>
    </View>
  );
}
