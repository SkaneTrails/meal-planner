/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 * Sections are collapsible accordions — General is open by default.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { GradientBackground } from '@/components';
import {
  AiSection,
  CollapsibleSection,
  DietarySection,
  GeneralSection,
  MembersSection,
  ReadOnlyBanner,
  ScreenHeader,
} from '@/components/household-settings';
import { ItemsAtHomeSection, LanguageSection } from '@/components/settings';
import { showNotification } from '@/lib/alert';
import { useHouseholdSettingsForm } from '@/lib/hooks/useHouseholdSettingsForm';
import { useTranslation } from '@/lib/i18n';
import { type AppLanguage, useSettings } from '@/lib/settings-context';
import { colors, spacing } from '@/lib/theme';

type SectionKey =
  | 'general'
  | 'members'
  | 'dietary'
  | 'ai'
  | 'pantry'
  | 'language';

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const { id: paramId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const form = useHouseholdSettingsForm(paramId);
  const { settings, addItemAtHome, removeItemAtHome, setLanguage } =
    useSettings();
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(),
  );

  const toggleSection = useCallback((key: SectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleLanguageChange = async (language: AppLanguage) => {
    try {
      await setLanguage(language);
    } catch {
      showNotification(t('common.error'), t('settings.failedToChangeLanguage'));
    }
  };

  if (!form.householdId) {
    if (form.userLoading) {
      return (
        <GradientBackground muted>
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </GradientBackground>
      );
    }
    return (
      <GradientBackground muted>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>{t('householdSettings.invalidHouseholdId')}</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground muted>
      <Stack.Screen options={{ headerShown: false }} />

      {form.isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScreenHeader
            canEdit={form.canEdit}
            hasChanges={form.hasChanges}
            isSaving={form.isSaving}
            onSave={form.handleSave}
            onBack={() => router.back()}
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingTop: 0,
              paddingBottom: 120,
            }}
          >
            {!form.canEdit && <ReadOnlyBanner />}

            <CollapsibleSection
              icon="home"
              title={t('householdSettings.general.title')}
              subtitle={t('householdSettings.general.subtitle')}
              expanded={expandedSections.has('general')}
              onToggle={() => toggleSection('general')}
            >
              <GeneralSection
                settings={form.settings}
                canEdit={form.canEdit}
                householdName={form.household?.name}
                isEditingName={form.isEditingName}
                editedName={form.editedName}
                onEditedNameChange={form.setEditedName}
                onStartEditName={form.handleStartEditName}
                onSaveName={form.handleSaveName}
                onCancelEditName={form.cancelEditName}
                isRenamePending={form.isRenamePending}
                onUpdateServings={form.updateServings}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon="people"
              title={t('settings.membersSection')}
              subtitle={t('settings.membersSectionDesc')}
              expanded={expandedSections.has('members')}
              onToggle={() => toggleSection('members')}
            >
              <MembersSection
                members={form.members}
                membersLoading={form.membersLoading}
                canEdit={form.canEdit}
                currentUserEmail={form.currentUserEmail}
                newMemberEmail={form.newMemberEmail}
                onNewMemberEmailChange={form.setNewMemberEmail}
                newMemberRole={form.newMemberRole}
                onNewMemberRoleChange={form.setNewMemberRole}
                onAddMember={form.handleAddMember}
                onRemoveMember={form.handleRemoveMember}
                isAddPending={form.isAddPending}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon="nutrition"
              title={t('householdSettings.dietary.title')}
              subtitle={t('householdSettings.dietary.subtitle')}
              expanded={expandedSections.has('dietary')}
              onToggle={() => toggleSection('dietary')}
            >
              <DietarySection
                dietary={form.settings.dietary}
                canEdit={form.canEdit}
                onUpdateDietary={form.updateDietary}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon="sparkles"
              title={t('householdSettings.ai.title')}
              subtitle={t('householdSettings.ai.subtitle')}
              expanded={
                (form.settings.ai_features_enabled ?? true) &&
                expandedSections.has('ai')
              }
              onToggle={() => toggleSection('ai')}
              disabled={!(form.settings.ai_features_enabled ?? true)}
              rightAccessory={
                <Switch
                  value={form.settings.ai_features_enabled ?? true}
                  onValueChange={form.updateAiEnabled}
                  disabled={!form.canEdit}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary,
                  }}
                />
              }
            >
              <AiSection
                dietary={form.settings.dietary}
                defaultServings={form.settings.default_servings}
                equipment={form.settings.equipment}
                canEdit={form.canEdit}
                onUpdateDietary={form.updateDietary}
                onToggleEquipment={form.toggleEquipment}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon="cart"
              title={t('settings.itemsAtHome')}
              subtitle={t('settings.itemsAtHomeDesc')}
              expanded={expandedSections.has('pantry')}
              onToggle={() => toggleSection('pantry')}
            >
              <ItemsAtHomeSection
                itemsAtHome={settings.itemsAtHome}
                onAddItem={addItemAtHome}
                onRemoveItem={removeItemAtHome}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon="language"
              title={t('settings.language')}
              subtitle={t('settings.languageDesc')}
              expanded={expandedSections.has('language')}
              onToggle={() => toggleSection('language')}
            >
              <LanguageSection
                currentLanguage={settings.language}
                onChangeLanguage={handleLanguageChange}
              />
            </CollapsibleSection>
          </ScrollView>
        </View>
      )}
    </GradientBackground>
  );
}
