/**
 * Sign-in screen with Google authentication.
 * Luxurious design matching app theme.
 */

import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/hooks/use-auth';
import { useTranslation } from '../lib/i18n';
import { GoogleLogo } from '../components/GoogleLogo';
import { GradientBackground } from '../components';
import { fontFamily, fontSize, colors, spacing, borderRadius } from '../lib/theme';

export default function SignInScreen() {
  const { user, loading, error, signIn, signOut } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      if (__DEV__) {
        console.error('Failed to sign out', err);
      }
    }
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (loading) {
    return (
      <GradientBackground animated style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: 48,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: fontSize.sm, fontFamily: fontFamily.body, textDecorationLine: 'underline' }}>
            {t('signIn.signOut')}
          </Text>
        </Pressable>
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
          {t('signIn.appName')}
        </Text>
        <Text style={{
          fontFamily: fontFamily.body,
          color: colors.text.secondary,
          textAlign: 'center',
          fontSize: fontSize.xl,
          letterSpacing: 1,
          marginBottom: 64,
        }}>
          {t('signIn.tagline')}
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
            <Text style={{ color: colors.error, textAlign: 'center', fontSize: fontSize.lg, fontFamily: fontFamily.body }}>{t(`signIn.${error}` as 'signIn.signInFailed') || t('signIn.somethingWentWrong')}</Text>
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
            {t('signIn.continueWithGoogle')}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 48, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.md }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: fontSize.sm, fontFamily: fontFamily.body, textAlign: 'center' }}>
          {t('signIn.syncMessage')}
        </Text>
        <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: fontSize.sm, fontFamily: fontFamily.body, textDecorationLine: 'underline' }}>
              {t('signIn.signOut')}
            </Text>
          </Pressable>
      </View>
    </GradientBackground>
  );
}
