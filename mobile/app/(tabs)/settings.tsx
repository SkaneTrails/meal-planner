/**
 * Settings screen for app configuration.
 * Organized into sections: Account, Preferences, Grocery List, etc.
 */

import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { GradientBackground, ScreenHeader } from '@/components';
import {
  AboutSection,
  AccountSection,
  AdminSection,
  HouseholdSettingsLink,
  PersonalPreferencesSection,
} from '@/components/settings';
import { showNotification } from '@/lib/alert';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { layout, spacing } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { settings, toggleShowHiddenRecipes } = useSettings();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      showNotification(t('common.error'), t('settings.failedToSignOut'));
    }
  };

  return (
    <GradientBackground>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        <ScreenHeader
          variant="large"
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PersonalPreferencesSection
            showHiddenRecipes={settings.showHiddenRecipes}
            onToggleShowHidden={toggleShowHiddenRecipes}
          />

          <HouseholdSettingsLink
            householdId={currentUser?.household_id}
            isLoading={userLoading}
            onPress={() => {
              if (currentUser?.household_id) {
                router.push(
                  `/household-settings?id=${currentUser.household_id}`,
                );
              }
            }}
          />

          {currentUser?.role === 'superuser' && (
            <AdminSection onNavigateToAdmin={() => router.push('/admin')} />
          )}

          <AccountSection
            userEmail={user?.email}
            displayName={user?.displayName}
            onSignOut={handleSignOut}
          />

          <View style={{ flex: 1 }} />

          <AboutSection />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
