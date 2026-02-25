/**
 * Household Settings screen.
 * Allows admins to configure household-level settings: general info, members,
 * language, items at home, and note suggestions.
 *
 * When navigated with a `section` query param (e.g. ?section=general),
 * only that section is shown (expanded). Otherwise all sections render
 * as collapsible accordions — all start collapsed.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { FullScreenLoading, GradientBackground, Section } from '@/components';
import {
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
import { fontSize, layout, spacing, useTheme } from '@/lib/theme';

type SectionKey = 'general' | 'members' | 'pantry' | 'notes' | 'language';

type TranslationFn = ReturnType<typeof useTranslation>['t'];

const sectionTitles: Record<SectionKey, (t: TranslationFn) => string> = {
  general: (t) => t('householdSettings.general.title'),
  members: (t) => t('settings.membersSection'),
  language: (t) => t('settings.language'),
  pantry: (t) => t('settings.itemsAtHome'),
  notes: (t) => t('settings.noteSuggestions'),
};

const sectionSubtitles: Record<SectionKey, (t: TranslationFn) => string> = {
  general: (t) => t('householdSettings.general.subtitle'),
  members: (t) => t('settings.membersSectionDesc'),
  language: (t) => t('settings.languageDesc'),
  pantry: (t) => t('settings.itemsAtHomeDesc'),
  notes: (t) => t('settings.noteSuggestionsDesc'),
};

export default function HouseholdSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id: paramId, section: sectionParam } = useLocalSearchParams<{
    id: string;
    section?: SectionKey;
  }>();
  const { t } = useTranslation();
  const form = useHouseholdSettingsForm(paramId);
  const {
    settings,
    weekStart,
    setWeekStart,
    addItemAtHome,
    removeItemAtHome,
    setLanguage,
  } = useSettings();

  const focusedSection = sectionParam as SectionKey | undefined;

  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    () =>
      focusedSection
        ? new Set<SectionKey>([focusedSection])
        : new Set<SectionKey>(),
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
      return <FullScreenLoading />;
    }
    return (
      <FullScreenLoading title={t('householdSettings.invalidHouseholdId')} />
    );
  }

  return (
    <GradientBackground>
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
            isFormValid={form.isFormValid}
            isSaving={form.isSaving}
            onSave={form.handleSave}
            onBack={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/(tabs)/settings')
            }
            title={
              focusedSection ? sectionTitles[focusedSection]?.(t) : undefined
            }
            subtitle={
              focusedSection ? sectionSubtitles[focusedSection]?.(t) : undefined
            }
          />

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingTop: 0,
              paddingBottom: layout.tabBar.contentBottomPadding,
            }}
          >
            {!form.canEdit && <ReadOnlyBanner />}

            {(!focusedSection || focusedSection === 'general') && (
              <Section
                icon="home"
                title={t('householdSettings.general.title')}
                subtitle={t('householdSettings.general.subtitle')}
                collapsible={!focusedSection}
                expanded={
                  focusedSection === 'general' ||
                  expandedSections.has('general')
                }
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
                  weekStart={weekStart}
                  onSetWeekStart={setWeekStart}
                />
              </Section>
            )}

            {(!focusedSection || focusedSection === 'members') &&
              form.canEdit && (
                <Section
                  icon="people"
                  title={t('settings.membersSection')}
                  subtitle={t('settings.membersSectionDesc')}
                  collapsible={!focusedSection}
                  expanded={
                    focusedSection === 'members' ||
                    expandedSections.has('members')
                  }
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
              )}

            {(!focusedSection || focusedSection === 'language') && (
              <Section
                icon="language"
                title={t('settings.language')}
                subtitle={t('settings.languageDesc')}
                collapsible={!focusedSection}
                expanded={
                  focusedSection === 'language' ||
                  expandedSections.has('language')
                }
                onToggle={() => toggleSection('language')}
              >
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.content.subtitle,
                    fontStyle: 'italic',
                    marginBottom: spacing.md,
                  }}
                >
                  {t('settings.languageAiNote')}
                </Text>
                <LanguageSection
                  currentLanguage={settings.language}
                  onChangeLanguage={handleLanguageChange}
                />
              </Section>
            )}

            {(!focusedSection || focusedSection === 'pantry') && (
              <Section
                icon="cart"
                title={t('settings.itemsAtHome')}
                subtitle={t('settings.itemsAtHomeDesc')}
                collapsible={!focusedSection}
                expanded={
                  focusedSection === 'pantry' || expandedSections.has('pantry')
                }
                onToggle={() => toggleSection('pantry')}
              >
                <ItemsAtHomeSection
                  itemsAtHome={settings.itemsAtHome}
                  onAddItem={addItemAtHome}
                  onRemoveItem={removeItemAtHome}
                />
              </Section>
            )}

            {(!focusedSection || focusedSection === 'notes') && (
              <Section
                icon="document-text-outline"
                title={t('settings.noteSuggestions')}
                subtitle={t('settings.noteSuggestionsDesc')}
                collapsible={!focusedSection}
                expanded={
                  focusedSection === 'notes' || expandedSections.has('notes')
                }
                onToggle={() => toggleSection('notes')}
              >
                <NoteSuggestionsSection
                  suggestions={form.settings.note_suggestions ?? []}
                  canEdit={form.canEdit}
                  onAdd={form.addNoteSuggestion}
                  onRemove={form.removeNoteSuggestion}
                />
              </Section>
            )}
          </ScrollView>
        </View>
      )}
    </GradientBackground>
  );
}
