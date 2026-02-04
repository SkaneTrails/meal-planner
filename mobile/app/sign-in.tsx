/**
 * Sign-in screen with Google authentication.
 * Luxurious design matching app theme.
 */

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#D4C4B8', '#D8C0AC', '#DDB89C', '#E2AC88', '#D8A078']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color="#5D4E40" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#D4C4B8', '#D8C0AC', '#DDB89C', '#E2AC88', '#D8A078']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Main content - centered */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* App Icon - Flat white design */}
        <View style={{
          width: 140,
          height: 140,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <View style={{ alignItems: 'center' }}>
            {/* Plate */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 3,
              borderColor: 'rgba(200, 200, 200, 0.8)',
              backgroundColor: 'rgba(240, 240, 240, 0.9)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: 'rgba(180, 180, 180, 0.6)',
              }} />
            </View>
            {/* Fork and knife */}
            <View style={{ flexDirection: 'row', position: 'absolute', top: 8 }}>
              {/* Fork */}
              <View style={{
                width: 3,
                height: 50,
                backgroundColor: 'rgba(160, 160, 160, 0.9)',
                borderRadius: 1.5,
                marginRight: 56,
                marginTop: 6,
              }} />
              {/* Knife */}
              <View style={{
                width: 4,
                height: 50,
                backgroundColor: 'rgba(160, 160, 160, 0.9)',
                borderRadius: 2,
                marginTop: 6,
              }} />
            </View>
          </View>
        </View>

        {/* App Title */}
        <Text style={{
          fontSize: 34,
          fontWeight: '700',
          color: '#5D4E40',
          marginBottom: 8,
          letterSpacing: -0.5,
        }}>
          Meal Planner
        </Text>
        <Text style={{
          color: '#7A6858',
          textAlign: 'center',
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 48,
        }}>
          Plan meals, save recipes,{'\n'}and create grocery lists
        </Text>

        {/* Error Message */}
        {error && (
          <View style={{
            backgroundColor: 'rgba(239, 83, 80, 0.15)',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 24,
            width: '100%',
          }}>
            <Text style={{ color: '#C62828', textAlign: 'center', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Sign In Button - Glass style with brown text */}
        <Pressable
          onPress={signIn}
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)',
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          })}
        >
          <GoogleLogo size={20} />
          <Text style={{ color: '#5D4E40', fontWeight: '600', fontSize: 16, marginLeft: 12 }}>
            Continue with Google
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 48, paddingHorizontal: 32 }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, textAlign: 'center' }}>
          Sign in to sync your recipes across devices
        </Text>
      </View>
    </LinearGradient>
  );
}
