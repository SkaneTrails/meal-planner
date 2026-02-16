/**
 * Settings screen for app configuration.
 * Organized into sections: Account, Preferences, Grocery List, etc.
 */

import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { GradientBackground } from '@/components';
import { ScreenTitle } from '@/components/ScreenTitle';
import {
  AboutSection,
  AccountSection,
  AdminSection,
  HouseholdSettingsLink,
  RecipeLibrarySection,
  WeekStartSection,
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
  const { settings, weekStart, setWeekStart, toggleShowHiddenRecipes } =
    useSettings();
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
    <GradientBackground muted>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingTop: 44,
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            variant="large"
            title={t('settings.title')}
            subtitle={t('settings.subtitle')}
            style={{ marginBottom: spacing.lg }}
          />

          <AccountSection
            userEmail={user?.email}
            displayName={user?.displayName}
            onSignOut={handleSignOut}
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

          <RecipeLibrarySection
            showHiddenRecipes={settings.showHiddenRecipes}
            onToggle={toggleShowHiddenRecipes}
          />

          <WeekStartSection
            weekStart={weekStart}
            onSetWeekStart={setWeekStart}
          />

          {currentUser?.role === 'superuser' && (
            <AdminSection onNavigateToAdmin={() => router.push('/admin')} />
          )}

          <AboutSection />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
