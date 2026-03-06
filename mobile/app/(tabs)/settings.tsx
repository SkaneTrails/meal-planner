/**
 * Settings screen for app configuration.
 * Single page with all settings grouped by category.
 * Each item navigates to a focused detail screen for that setting.
 */

import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import {
  ContentCard,
  GradientBackground,
  ScreenHeader,
  Section,
  ThemeToggle,
} from '@/components';
import {
  AboutSection,
  AccountSection,
  PersonalPreferencesSection,
  SettingsNavLink,
  SettingsSeparator,
} from '@/components/settings';
import { showNotification } from '@/lib/alert';
import {
  useCurrentUser,
  useHouseholdSettings,
  useUpdateHouseholdSettings,
} from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';

import { layout, spacing, useTheme } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { borderRadius, colors } = useTheme();
  const { user, signOut } = useAuth();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { settings, toggleShowHiddenRecipes } = useSettings();
  const { t } = useTranslation();

  const householdId = currentUser?.household_id;
  const hasHousehold = !!householdId;
  const { data: householdSettings } = useHouseholdSettings(householdId ?? null);
  const updateSettings = useUpdateHouseholdSettings();
  const aiEnabled = householdSettings?.ai_features_enabled ?? true;

  const handleToggleAi = (enabled: boolean) => {
    if (householdId) {
      updateSettings.mutate({
        householdId,
        settings: { ai_features_enabled: enabled },
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      showNotification(t('common.error'), t('settings.failedToSignOut'));
    }
  };

  const navigateHousehold = (section: string) => {
    if (householdId) {
      router.push(`/household-settings?id=${householdId}&section=${section}`);
    }
  };

  return (
    <GradientBackground>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        <ScreenHeader title={t('settings.title')} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ContentCard
            label={t('settings.generalSettings')}
            cardStyle={{
              borderRadius: borderRadius.lg,
              padding: spacing['md-lg'],
            }}
            style={{ marginBottom: spacing.lg }}
          >
            <Section
              icon="settings"
              title={t('settings.generalSettings')}
              spacing={0}
            >
              <View
                style={{
                  backgroundColor: colors.surface.subtle,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                }}
              >
                <PersonalPreferencesSection
                  showHiddenRecipes={settings.showHiddenRecipes}
                  onToggleShowHidden={toggleShowHiddenRecipes}
                />
              </View>
            </Section>
          </ContentCard>

          <ContentCard
            label={t('settings.householdSettings')}
            cardStyle={{
              borderRadius: borderRadius.lg,
              padding: spacing['md-lg'],
            }}
            style={{ marginBottom: spacing.lg }}
          >
            <Section
              icon="home"
              title={t('settings.householdSettings')}
              spacing={0}
            />
            <View
              style={{
                backgroundColor: colors.surface.subtle,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
                opacity: !hasHousehold || userLoading ? 0.5 : 1,
              }}
            >
              <SettingsNavLink
                icon="cog"
                title={t('householdSettings.general.title')}
                subtitle={t('householdSettings.general.subtitle')}
                disabled={!hasHousehold}
                isLoading={userLoading}
                onPress={() => navigateHousehold('general')}
              />
              <SettingsSeparator />
              <SettingsNavLink
                icon="people"
                title={t('settings.membersSection')}
                subtitle={t('settings.membersSectionDesc')}
                disabled={!hasHousehold}
                isLoading={userLoading}
                onPress={() => navigateHousehold('members')}
              />
              <SettingsSeparator />
              <SettingsNavLink
                icon="language"
                title={t('settings.language')}
                subtitle={t('settings.languageDesc')}
                disabled={!hasHousehold}
                isLoading={userLoading}
                onPress={() => navigateHousehold('language')}
              />
              <SettingsSeparator />
              <SettingsNavLink
                icon="cart"
                title={t('settings.groceryList')}
                subtitle={t('settings.groceryListDesc')}
                disabled={!hasHousehold}
                isLoading={userLoading}
                onPress={() => navigateHousehold('pantry')}
              />
              <SettingsSeparator />
              <SettingsNavLink
                icon="document-text-outline"
                title={t('settings.noteSuggestions')}
                subtitle={t('settings.noteSuggestionsDesc')}
                disabled={!hasHousehold}
                isLoading={userLoading}
                onPress={() => navigateHousehold('notes')}
              />
            </View>
          </ContentCard>

          <ContentCard
            label={t('settings.aiSettings')}
            cardStyle={{
              borderRadius: borderRadius.lg,
              padding: spacing['md-lg'],
            }}
            style={{ marginBottom: spacing.lg }}
          >
            <Section
              icon="sparkles"
              title={t('settings.aiSettings')}
              rightAccessory={
                hasHousehold ? (
                  <ThemeToggle
                    value={aiEnabled}
                    onValueChange={handleToggleAi}
                  />
                ) : undefined
              }
              spacing={0}
            />
            <View
              style={{
                backgroundColor: colors.surface.subtle,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
                opacity: !hasHousehold || userLoading || !aiEnabled ? 0.5 : 1,
              }}
            >
              <SettingsNavLink
                icon="sparkles"
                title={t('householdSettings.ai.subtitle')}
                subtitle={t('settings.aiSettingsDesc')}
                disabled={!hasHousehold || !aiEnabled}
                isLoading={userLoading}
                onPress={() => {
                  if (householdId) {
                    router.push(`/ai-settings?id=${householdId}`);
                  }
                }}
              />
            </View>
          </ContentCard>

          {currentUser?.role === 'superuser' && (
            <ContentCard
              label={t('settings.adminSection')}
              cardStyle={{
                borderRadius: borderRadius.lg,
                padding: spacing['md-lg'],
              }}
              style={{ marginBottom: spacing.lg }}
            >
              <Section
                icon="shield-checkmark"
                title={t('settings.adminSection')}
                spacing={0}
              />
              <View
                style={{
                  backgroundColor: colors.surface.subtle,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                }}
              >
                <SettingsNavLink
                  icon="terminal"
                  title={t('settings.adminDashboard')}
                  subtitle={t('settings.adminDashboardDesc')}
                  onPress={() => router.push('/admin')}
                />
              </View>
            </ContentCard>
          )}

          <View style={{ flex: 1 }} />

          <ContentCard
            cardStyle={{
              borderRadius: borderRadius.lg,
              padding: spacing['md-lg'],
            }}
            style={{ marginBottom: spacing.lg }}
          >
            <AccountSection
              userEmail={user?.email}
              displayName={user?.displayName}
              onSignOut={handleSignOut}
            />
          </ContentCard>

          <ContentCard
            label={t('settings.about')}
            cardStyle={{
              borderRadius: borderRadius.lg,
              padding: spacing['md-lg'],
            }}
            style={{ marginBottom: spacing.lg }}
          >
            <AboutSection />
          </ContentCard>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
