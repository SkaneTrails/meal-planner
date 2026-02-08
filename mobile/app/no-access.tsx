/**
 * No access screen - shown to authenticated users without a household.
 * Provides logout option and explains the situation.
 */

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { GradientBackground } from '@/components';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '@/lib/theme';

export default function NoAccessScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { t } = useTranslation();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser({
    enabled: !loading && !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      showNotification(t('common.error'), t('noAccess.failedToSignOut'));
    }
  };

  if (!loading && !user) {
    return <Redirect href="/sign-in" />;
  }

  if (currentUser?.household_id || currentUser?.role === 'superuser') {
    return <Redirect href="/(tabs)" />;
  }

  if (loading || userLoading) {
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
        {/* Icon */}
        <View style={{
          width: 96,
          height: 96,
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <Ionicons name="lock-closed" size={48} color={colors.text.primary} />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 32,
          fontFamily: fontFamily.displayBold,
          color: colors.text.primary,
          marginBottom: spacing.sm,
        }}>
          {t('noAccess.title')}
        </Text>
        <Text style={{
          fontFamily: fontFamily.body,
          color: colors.text.secondary,
          textAlign: 'center',
          fontSize: fontSize.lg,
          marginBottom: spacing.sm,
        }}>
          {t('noAccess.signedInAs')}
        </Text>
        <Text style={{
          fontFamily: fontFamily.bodySemibold,
          color: colors.text.primary,
          fontSize: fontSize.lg,
          marginBottom: spacing.sm,
        }}>
          {user?.email}
        </Text>
        <Text style={{
          fontFamily: fontFamily.body,
          color: colors.text.secondary,
          textAlign: 'center',
          fontSize: fontSize.lg,
          lineHeight: 26,
          marginBottom: 48,
        }}>
          {t('noAccess.notInHousehold')}{'\n\n'}
          {t('noAccess.askAdmin')}
        </Text>

        {/* Sign Out Button - Glass style */}
        <Pressable
          onPress={handleSignOut}
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
          <Ionicons name="log-out-outline" size={20} color={colors.text.primary} />
          <Text style={{
            color: colors.text.primary,
            fontFamily: fontFamily.bodySemibold,
            fontSize: fontSize.lg,
            marginLeft: spacing.md,
          }}>
            {t('noAccess.signOutButton')}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 48, paddingHorizontal: spacing.xl }}>
        <Text style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: fontSize.sm,
          fontFamily: fontFamily.body,
          textAlign: 'center',
        }}>
          {t('noAccess.contactAdmin')}
        </Text>
      </View>
    </GradientBackground>
  );
}
