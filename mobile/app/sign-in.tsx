/**
 * Sign-in screen with Google authentication.
 * Luxurious design matching app theme.
 */

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/hooks/use-auth';
import { GoogleLogo } from '../components/GoogleLogo';
import { GradientBackground } from '../components';
import { fontFamily, fontSize, colors, spacing, borderRadius } from '../lib/theme';

export default function SignInScreen() {
  const { user, loading, error, signIn } = useAuth();

  // If already signed in, redirect to home
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (loading) {
    return (
      <GradientBackground animated style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground animated style={{ flex: 1 }}>
      {/* Main content - centered */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        {/* Brand Name - elegant typography */}
        <Text style={{
          fontSize: 56,
          fontFamily: fontFamily.displayBold,
          color: colors.text.primary,
          letterSpacing: -1,
          marginBottom: spacing.sm,
        }}>
          Aroma
        </Text>
        <Text style={{
          fontFamily: fontFamily.body,
          color: colors.text.secondary,
          textAlign: 'center',
          fontSize: fontSize.xl,
          letterSpacing: 1,
          marginBottom: 64,
        }}>
          Cook with intention.
        </Text>

        {/* Error Message */}
        {error && (
          <View style={{
            backgroundColor: colors.errorBg,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            marginBottom: spacing.xl,
            width: '100%',
          }}>
            <Text style={{ color: colors.error, textAlign: 'center', fontSize: fontSize.lg, fontFamily: fontFamily.body }}>{error}</Text>
          </View>
        )}

        {/* Sign In Button - Glass style */}
        <Pressable
          onPress={signIn}
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.35)',
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 320,
          })}
        >
          <GoogleLogo size={20} />
          <Text style={{ color: colors.text.inverse, fontFamily: fontFamily.bodySemibold, fontSize: fontSize.lg, marginLeft: spacing.md }}>
            Continue with Google
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 48, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: fontSize.sm, fontFamily: fontFamily.body, textAlign: 'center' }}>
          Sign in to sync your recipes across devices
        </Text>
      </View>
    </GradientBackground>
  );
}
