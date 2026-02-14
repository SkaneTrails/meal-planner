/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { GradientBackground } from '@/components';
import {
  BottomSaveBar,
  DietarySection,
  EquipmentSection,
  GeneralSection,
  MembersSection,
  ReadOnlyBanner,
  ScreenHeader,
} from '@/components/household-settings';
import { useHouseholdSettingsForm } from '@/lib/hooks/useHouseholdSettingsForm';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing } from '@/lib/theme';

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const { id: paramId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const form = useHouseholdSettingsForm(paramId);

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

            <DietarySection
              dietary={form.settings.dietary}
              canEdit={form.canEdit}
              onUpdateDietary={form.updateDietary}
            />

            <EquipmentSection
              equipment={form.settings.equipment}
              canEdit={form.canEdit}
              onToggleEquipment={form.toggleEquipment}
            />
          </ScrollView>

          {form.canEdit && form.hasChanges && (
            <BottomSaveBar isSaving={form.isSaving} onSave={form.handleSave} />
          )}
        </View>
      )}
    </GradientBackground>
  );
}
