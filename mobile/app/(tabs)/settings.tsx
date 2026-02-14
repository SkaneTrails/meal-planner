/**
 * Settings screen for app configuration.
 * Organized into sections: Account, Preferences, Grocery List, etc.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GradientBackground } from '@/components';
import {
  AboutSection,
  AccountSection,
  AdminSection,
  HouseholdSettingsLink,
  ItemsAtHomeSection,
  LanguageSection,
  RecipeLibrarySection,
  WeekStartSection,
} from '@/components/settings';
import { showNotification } from '@/lib/alert';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { type AppLanguage, useSettings } from '@/lib/settings-context';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const {
    settings,
    weekStart,
    addItemAtHome,
    removeItemAtHome,
    setLanguage,
    setWeekStart,
    toggleShowHiddenRecipes,
  } = useSettings();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      showNotification(t('common.error'), t('settings.failedToSignOut'));
    }
  };

  const handleLanguageChange = async (language: AppLanguage) => {
    try {
      await setLanguage(language);
    } catch {
      showNotification(t('common.error'), t('settings.failedToChangeLanguage'));
    }
  };

  return (
    <GradientBackground muted>
      <View style={{ flex: 1, paddingBottom: 70 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingTop: 44, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize['4xl'],
                fontFamily: fontFamily.display,
                color: colors.text.primary,
                letterSpacing: -0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {t('settings.title')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontFamily: fontFamily.body,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {t('settings.subtitle')}
            </Text>
          </View>

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
                router.push(`/household-settings?id=${currentUser.household_id}`);
              }
            }}
          />

          <RecipeLibrarySection
            showHiddenRecipes={settings.showHiddenRecipes}
            onToggle={toggleShowHiddenRecipes}
          />

          <WeekStartSection weekStart={weekStart} onSetWeekStart={setWeekStart} />

          <LanguageSection
            currentLanguage={settings.language}
            onChangeLanguage={handleLanguageChange}
          />

          <ItemsAtHomeSection
            itemsAtHome={settings.itemsAtHome}
            onAddItem={addItemAtHome}
            onRemoveItem={removeItemAtHome}
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
