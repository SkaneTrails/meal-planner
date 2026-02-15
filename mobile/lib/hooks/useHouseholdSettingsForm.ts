import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '@/components/household-settings';
import { showAlert, showNotification } from '@/lib/alert';
import {
  useAddMember,
  useCurrentUser,
  useHousehold,
  useHouseholdMembers,
  useHouseholdSettings,
  useRemoveMember,
  useRenameHousehold,
  useUpdateHouseholdSettings,
} from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import type { HouseholdMember, HouseholdSettings } from '@/lib/types';

export const useHouseholdSettingsForm = (paramId: string | undefined) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const householdId = paramId ?? currentUser?.household_id;

  const { data: remoteSettings, isLoading: settingsLoading } =
    useHouseholdSettings(householdId ?? null);
  const isLoading = userLoading || settingsLoading;
  const updateSettings = useUpdateHouseholdSettings();

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useHouseholdMembers(householdId ?? '');
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>(
    'member',
  );

  const { data: household } = useHousehold(householdId ?? '');
  const renameHousehold = useRenameHousehold();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const canEdit =
    currentUser?.role === 'superuser' ||
    (currentUser?.role === 'admin' &&
      currentUser?.household_id === householdId);

  const [settings, setSettings] = useState<HouseholdSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (remoteSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...remoteSettings,
        dietary: {
          ...DEFAULT_SETTINGS.dietary,
          ...(remoteSettings.dietary ?? {}),
        },
        equipment: Array.isArray(remoteSettings.equipment)
          ? remoteSettings.equipment
          : [],
      });
    }
  }, [remoteSettings]);

  const handleSave = async () => {
    if (!householdId) return;
    try {
      await updateSettings.mutateAsync({ householdId, settings });
      setHasChanges(false);
      showNotification(
        t('householdSettings.saved'),
        t('householdSettings.savedMessage'),
      );
    } catch {
      showNotification(t('common.error'), t('householdSettings.failedToSave'));
    }
  };

  const updateDietary = <K extends keyof HouseholdSettings['dietary']>(
    key: K,
    value: HouseholdSettings['dietary'][K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      dietary: { ...prev.dietary, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateServings = (servings: number) => {
    setSettings((prev) => ({ ...prev, default_servings: servings }));
    setHasChanges(true);
  };

  const toggleEquipment = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(key)
        ? prev.equipment.filter((k) => k !== key)
        : [...prev.equipment, key],
    }));
    setHasChanges(true);
  };

  const updateAiEnabled = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, ai_features_enabled: enabled }));
    setHasChanges(true);
  };

  const handleStartEditName = () => {
    setEditedName(household?.name ?? '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || !householdId || trimmed === household?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await renameHousehold.mutateAsync({ id: householdId, name: trimmed });
      setIsEditingName(false);
      showNotification(t('householdSettings.general.nameUpdated'));
    } catch (error) {
      showNotification(
        t('common.error'),
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !householdId) return;
    try {
      await addMember.mutateAsync({
        householdId,
        data: { email: newMemberEmail.trim(), role: newMemberRole },
      });
      setNewMemberEmail('');
      setNewMemberRole('member');
      refetchMembers();
      showNotification(t('settings.memberAdded'));
    } catch (error) {
      if (__DEV__) console.error('Failed to add member:', error);
      showNotification(t('common.error'), t('admin.failedToAddMember'));
    }
  };

  const handleRemoveMember = (member: HouseholdMember) => {
    if (member.email === user?.email) {
      showNotification(t('common.error'), t('settings.cannotRemoveSelf'));
      return;
    }
    if (!householdId) return;

    showAlert(
      t('admin.removeMember'),
      t('settings.removeMemberConfirm', {
        name: member.display_name || member.email,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync({
                householdId,
                email: member.email,
              });
              refetchMembers();
              showNotification(t('settings.memberRemoved'));
            } catch (error) {
              if (__DEV__) console.error('Failed to remove member:', error);
              showNotification(
                t('common.error'),
                t('admin.failedToRemoveMember'),
              );
            }
          },
        },
      ],
    );
  };

  return {
    householdId,
    userLoading,
    isLoading,
    canEdit,
    settings,
    hasChanges,
    isSaving: updateSettings.isPending,
    handleSave,
    updateDietary,
    updateServings,
    toggleEquipment,
    updateAiEnabled,
    household,
    isEditingName,
    editedName,
    setEditedName,
    handleStartEditName,
    handleSaveName,
    cancelEditName: () => setIsEditingName(false),
    isRenamePending: renameHousehold.isPending,
    members,
    membersLoading,
    currentUserEmail: user?.email,
    newMemberEmail,
    setNewMemberEmail,
    newMemberRole,
    setNewMemberRole,
    handleAddMember,
    handleRemoveMember,
    isAddPending: addMember.isPending,
  };
};
