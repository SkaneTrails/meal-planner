/**
 * Sign-in screen with Google authentication.
 * Clean, minimal design with centered content.
 */

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/hooks/use-auth';
import { GoogleLogo } from '../components/GoogleLogo';

export default function SignInScreen() {
  const { user, loading, error, signIn } = useAuth();

  // If already signed in, redirect to home
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (loading) {
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
        {/* App Icon - using emoji instead of Ionicons to avoid font loading issues */}
        <View className="w-24 h-24 bg-amber-100 rounded-3xl items-center justify-center mb-6 shadow-sm">
          <Text style={{ fontSize: 48 }}>🍽️</Text>
        </View>

        {/* App Title */}
        <Text className="text-3xl font-bold text-stone-800 mb-2">
          Meal Planner
        </Text>
        <Text className="text-stone-500 text-center text-base leading-relaxed mb-12">
          Plan meals, save recipes,{'\n'}and create grocery lists
        </Text>

        {/* Error Message */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 w-full">
            <Text className="text-red-600 text-center text-sm">{error}</Text>
          </View>
        )}

        {/* Sign In Button */}
        <Pressable
          onPress={signIn}
          className="bg-white border border-stone-200 rounded-2xl px-6 py-4 flex-row items-center justify-center w-full shadow-sm active:bg-stone-50"
          style={{ elevation: 2 }}
        >
          <GoogleLogo size={20} />
          <Text className="text-stone-700 font-semibold text-base ml-3">
            Continue with Google
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="pb-12 px-8">
        <Text className="text-stone-400 text-xs text-center">
          Sign in to sync your recipes across devices
        </Text>
      </View>
    </View>
  );
}
