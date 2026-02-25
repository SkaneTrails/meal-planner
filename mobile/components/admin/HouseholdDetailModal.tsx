import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { BottomSheetModal, Chip, IconButton, SurfaceCard } from '@/components';
import { AddMemberForm } from '@/components/admin/AddMemberForm';
import { showAlert, showNotification } from '@/lib/alert';
import {
  useAddMember,
  useHouseholdMembers,
  useHouseholdRecipeCount,
  useHouseholdSettings,
  useRemoveMember,
} from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { Household, HouseholdMember } from '@/lib/types';

type Tab = 'members' | 'info';

interface HouseholdDetailModalProps {
  household: Household;
  onClose: () => void;
}

export const HouseholdDetailModal = ({
  household,
  onClose,
}: HouseholdDetailModalProps) => {
  const { t } = useTranslation();
  const {
    data: members,
    isLoading: membersLoading,
    refetch,
  } = useHouseholdMembers(household.id);
  const { data: settings, isLoading: settingsLoading } = useHouseholdSettings(
    household.id,
  );
  const { data: recipeCountData, isLoading: recipeCountLoading } =
    useHouseholdRecipeCount(household.id);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>(
    'member',
  );

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    try {
      await addMember.mutateAsync({
        householdId: household.id,
        data: { email: newMemberEmail.trim(), role: newMemberRole },
      });
      setShowAddMember(false);
      setNewMemberEmail('');
      refetch();
    } catch (error) {
      if (__DEV__) console.error('Failed to add member:', error);
      showNotification(t('common.error'), t('admin.failedToAddMember'));
    }
  };

  const handleRemoveMember = (email: string) => {
    showAlert(
      t('admin.removeMember'),
      t('admin.removeMemberConfirm', {
        name: email,
        household: household.name,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync({
                householdId: household.id,
                email,
              });
              refetch();
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

  return (
    <BottomSheetModal
      visible={true}
      onClose={onClose}
      title={household.name}
      subtitle={t('admin.createdBy', {
        email: household.created_by || '—',
        date: household.created_at
          ? new Date(household.created_at).toLocaleDateString()
          : '—',
      })}
      headerRight={
        activeTab === 'members' ? (
          <IconButton
            onPress={() => setShowAddMember(true)}
            icon="person-add"
            iconSize={18}
            size="md"
            tone="glass"
          />
        ) : undefined
      }
      footer={
        showAddMember && activeTab === 'members' ? (
          <AddMemberForm
            newMemberEmail={newMemberEmail}
            onEmailChange={setNewMemberEmail}
            newMemberRole={newMemberRole}
            onRoleChange={setNewMemberRole}
            onSubmit={handleAddMember}
            onClose={() => setShowAddMember(false)}
            isPending={addMember.isPending}
          />
        ) : undefined
      }
    >
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'members' ? (
        <MembersSection
          members={members}
          isLoading={membersLoading}
          onRemove={handleRemoveMember}
        />
      ) : (
        <HouseholdInfoSection
          settings={settings}
          recipeCount={recipeCountData?.recipe_count}
          isLoading={settingsLoading || recipeCountLoading}
        />
      )}
    </BottomSheetModal>
  );
};

const TabBar = ({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        marginBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <TabButton
        label={t('admin.members')}
        active={activeTab === 'members'}
        onPress={() => onTabChange('members')}
      />
      <TabButton
        label={t('admin.householdInfo')}
        active={activeTab === 'info'}
        onPress={() => onTabChange('info')}
      />
    </View>
  );
};

const TabButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.primary : 'transparent',
      }}
    >
      <Text
        onPress={onPress}
        style={{
          textAlign: 'center',
          paddingVertical: spacing.sm,
          fontSize: fontSize.md,
          fontWeight: active ? fontWeight.semibold : fontWeight.normal,
          color: active ? colors.primary : colors.text.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const MembersSection = ({
  members,
  isLoading,
  onRemove,
}: {
  members: HouseholdMember[] | undefined;
  isLoading: boolean;
  onRemove: (email: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if ((members || []).length === 0) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.text.muted }}>{t('admin.noMembers')}</Text>
      </View>
    );
  }

  return (
    <>
      {(members || []).map((member) => (
        <MemberCard
          key={member.email}
          member={member}
          onRemove={() => onRemove(member.email)}
        />
      ))}
    </>
  );
};

const MemberCard = ({
  member,
  onRemove,
}: {
  member: HouseholdMember;
  onRemove: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const roleColor =
    member.role === 'admin' ? colors.warning : colors.text.muted;

  return (
    <SurfaceCard
      radius="lg"
      padding={spacing.md}
      style={{
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.medium,
            color: colors.content.heading,
          }}
        >
          {member.display_name || member.email}
        </Text>
        {member.display_name && (
          <Text style={{ fontSize: fontSize.sm, color: colors.content.strong }}>
            {member.email}
          </Text>
        )}
        <View style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}>
          <Chip
            label={t(`labels.role.${member.role}` as 'labels.role.member')}
            variant="display"
            bg={roleColor + '20'}
            color={roleColor}
            uppercase
            size="sm"
          />
        </View>
      </View>
      <IconButton
        tone="warning"
        onPress={onRemove}
        icon="trash-outline"
        iconSize={20}
        hitSlop={8}
      />
    </SurfaceCard>
  );
};

const HouseholdInfoSection = ({
  settings,
  recipeCount,
  isLoading,
}: {
  settings: import('@/lib/types').HouseholdSettings | undefined;
  recipeCount: number | undefined;
  isLoading: boolean;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (!settings) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.text.muted }}>
          {t('admin.noSettings')}
        </Text>
      </View>
    );
  }

  const weekStartLabel =
    settings.week_start === 'sunday'
      ? t('admin.info.sunday')
      : t('admin.info.monday');

  return (
    <SurfaceCard radius="lg" padding={spacing.md}>
      <InfoRow
        label={t('admin.info.language')}
        value={settings.language || '—'}
      />
      <InfoRow
        label={t('admin.info.portions')}
        value={String(settings.default_servings)}
      />
      <InfoRow label={t('admin.info.weekStart')} value={weekStartLabel} />
      <InfoRow
        label={t('admin.info.breakfast')}
        value={settings.include_breakfast ? t('common.yes') : t('common.no')}
      />
      <InfoRow
        label={t('admin.info.aiEnabled')}
        value={settings.ai_features_enabled ? t('common.yes') : t('common.no')}
      />
      <InfoRow
        label={t('admin.info.recipeCount')}
        value={recipeCount != null ? String(recipeCount) : '—'}
        isLast
      />
    </SurfaceCard>
  );
};

const InfoRow = ({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.text.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.medium,
          color: colors.content.heading,
        }}
      >
        {value}
      </Text>
    </View>
  );
};
