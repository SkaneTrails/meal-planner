/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 * Sections are collapsible accordions — all start collapsed.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import {
  FullScreenLoading,
  GradientBackground,
  Section,
  ThemeToggle,
} from '@/components';
import {
  AiSection,
  DietarySection,
  GeneralSection,
  MembersSection,
  NoteSuggestionsSection,
  ReadOnlyBanner,
  ScreenHeader,
} from '@/components/household-settings';
import { ItemsAtHomeSection, LanguageSection } from '@/components/settings';
import { showNotification } from '@/lib/alert';
import { useHouseholdSettingsForm } from '@/lib/hooks/useHouseholdSettingsForm';
import { useTranslation } from '@/lib/i18n';
import { type AppLanguage, useSettings } from '@/lib/settings-context';
import { layout, spacing, useTheme } from '@/lib/theme';

type SectionKey =
  | 'general'
  | 'members'
  | 'dietary'
  | 'ai'
  | 'pantry'
  | 'notes'
  | 'language';

export default function HouseholdSettingsScreen() {
  const { colors } = useTheme();
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
      return <FullScreenLoading background="muted" />;
    }
    return (
      <FullScreenLoading
        background="muted"
        title={t('householdSettings.invalidHouseholdId')}
      />
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
        <View style={[{ flex: 1 }, layout.contentContainer]}>
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
              paddingBottom: layout.tabBar.contentBottomPadding,
            }}
          >
            {!form.canEdit && <ReadOnlyBanner />}

            <Section
              icon="home"
              title={t('householdSettings.general.title')}
              subtitle={t('householdSettings.general.subtitle')}
              collapsible
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
                onUpdateIncludeBreakfast={form.updateIncludeBreakfast}
              />
            </Section>

            <Section
              icon="people"
              title={t('settings.membersSection')}
              subtitle={t('settings.membersSectionDesc')}
              collapsible
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
            </Section>

            <Section
              icon="nutrition"
              title={t('householdSettings.dietary.title')}
              subtitle={t('householdSettings.dietary.subtitle')}
              collapsible
              expanded={expandedSections.has('dietary')}
              onToggle={() => toggleSection('dietary')}
            >
              <DietarySection
                dietary={form.settings.dietary}
                canEdit={form.canEdit}
                onUpdateDietary={form.updateDietary}
              />
            </Section>

            <Section
              icon="sparkles"
              title={t('householdSettings.ai.title')}
              subtitle={t('householdSettings.ai.subtitle')}
              collapsible
              expanded={
                (form.settings.ai_features_enabled ?? true) &&
                expandedSections.has('ai')
              }
              onToggle={() => toggleSection('ai')}
              disabled={!(form.settings.ai_features_enabled ?? true)}
              rightAccessory={
                <ThemeToggle
                  value={form.settings.ai_features_enabled ?? true}
                  onValueChange={form.updateAiEnabled}
                  disabled={!form.canEdit}
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
            </Section>

            <Section
              icon="cart"
              title={t('settings.itemsAtHome')}
              subtitle={t('settings.itemsAtHomeDesc')}
              collapsible
              expanded={expandedSections.has('pantry')}
              onToggle={() => toggleSection('pantry')}
            >
              <ItemsAtHomeSection
                itemsAtHome={settings.itemsAtHome}
                onAddItem={addItemAtHome}
                onRemoveItem={removeItemAtHome}
              />
            </Section>

            <Section
              icon="document-text-outline"
              title={t('settings.noteSuggestions')}
              subtitle={t('settings.noteSuggestionsDesc')}
              collapsible
              expanded={expandedSections.has('notes')}
              onToggle={() => toggleSection('notes')}
            >
              <NoteSuggestionsSection
                suggestions={form.settings.note_suggestions ?? []}
                canEdit={form.canEdit}
                onAdd={form.addNoteSuggestion}
                onRemove={form.removeNoteSuggestion}
              />
            </Section>

            <Section
              icon="language"
              title={t('settings.language')}
              subtitle={t('settings.languageDesc')}
              collapsible
              expanded={expandedSections.has('language')}
              onToggle={() => toggleSection('language')}
            >
              <LanguageSection
                currentLanguage={settings.language}
                onChangeLanguage={handleLanguageChange}
              />
            </Section>
          </ScrollView>
        </View>
      )}
    </GradientBackground>
  );
}
