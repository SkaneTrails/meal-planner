/**
 * Sign-in screen with Google authentication.
 * Luxurious design matching app theme.
 */

import { Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FullScreenLoading, GradientBackground } from '../components';
import { GoogleLogo } from '../components/GoogleLogo';
import { useAuth } from '../lib/hooks/use-auth';
import { useTranslation } from '../lib/i18n';
import { borderRadius, fontSize, spacing, useTheme } from '../lib/theme';

export default function SignInScreen() {
  const { colors, fonts } = useTheme();
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
      <FullScreenLoading background="animated">
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
          <Text
            style={{
              color: colors.glass.subtle,
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              textDecorationLine: 'underline',
            }}
          >
            {t('signIn.signOut')}
          </Text>
        </Pressable>
      </FullScreenLoading>
    );
  }

  return (
    <GradientBackground animated style={{ flex: 1 }}>
      {/* Main content - centered */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
        }}
      >
        {/* Brand Name - elegant typography */}
        <Text
          style={{
            fontSize: 56,
            fontFamily: fonts.displayBold,
            color: colors.text.primary,
            letterSpacing: -1,
            marginBottom: spacing.sm,
          }}
        >
          {t('signIn.appName')}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            color: colors.text.secondary,
            textAlign: 'center',
            fontSize: fontSize.xl,
            letterSpacing: 1,
            marginBottom: 64,
          }}
        >
          {t('signIn.tagline')}
        </Text>

        {/* Error Message */}
        {error && (
          <View
            style={{
              backgroundColor: colors.errorBg,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              marginBottom: spacing.xl,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: colors.error,
                textAlign: 'center',
                fontSize: fontSize.lg,
                fontFamily: fonts.body,
              }}
            >
              {(() => {
                const translationKey = `signIn.${error}`;
                const translated = t(translationKey);
                return translated === translationKey
                  ? t('signIn.somethingWentWrong')
                  : translated;
              })()}
            </Text>
          </View>
        )}

        {/* Sign In Button - Glass style */}
        <Pressable
          onPress={signIn}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? colors.glass.buttonPressed
              : colors.glass.buttonDefault,
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
          <Text
            style={{
              color: colors.text.inverse,
              fontFamily: fonts.bodySemibold,
              fontSize: fontSize.lg,
              marginLeft: spacing.md,
            }}
          >
            {t('signIn.continueWithGoogle')}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View
        style={{
          paddingBottom: 48,
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.glass.bright,
            fontSize: fontSize.sm,
            fontFamily: fonts.body,
            textAlign: 'center',
          }}
        >
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
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              textDecorationLine: 'underline',
            }}
          >
            {t('signIn.signOut')}
          </Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}
