import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, View } from 'react-native';
import { AnimatedPressable, GradientBackground } from '@/components';
import { AddMemberForm } from '@/components/admin/AddMemberForm';
import { showAlert, showNotification } from '@/lib/alert';
import {
  useAddMember,
  useHouseholdMembers,
  useRemoveMember,
} from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import {
  fontSize,
  fontWeight,
  iconContainer,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { Household, HouseholdMember } from '@/lib/types';

interface HouseholdDetailModalProps {
  household: Household;
  onClose: () => void;
}

export const HouseholdDetailModal = ({
  household,
  onClose,
}: HouseholdDetailModalProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    data: members,
    isLoading,
    refetch,
  } = useHouseholdMembers(household.id);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

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
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GradientBackground muted>
        <View style={{ flex: 1 }}>
          <ModalHeader household={household} onClose={onClose} />

          <View style={{ flex: 1, padding: spacing.lg }}>
            <MembersListHeader onAddMember={() => setShowAddMember(true)} />

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={members || []}
                keyExtractor={(item) => item.email}
                renderItem={({ item }) => (
                  <MemberCard
                    member={item}
                    onRemove={() => handleRemoveMember(item.email)}
                  />
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', padding: spacing.xl }}>
                    <Text style={{ color: colors.text.muted }}>
                      {t('admin.noMembers')}
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {showAddMember && (
            <AddMemberForm
              newMemberEmail={newMemberEmail}
              onEmailChange={setNewMemberEmail}
              newMemberRole={newMemberRole}
              onRoleChange={setNewMemberRole}
              onSubmit={handleAddMember}
              onClose={() => setShowAddMember(false)}
              isPending={addMember.isPending}
            />
          )}
        </View>
      </GradientBackground>
    </Modal>
  );
};

const ModalHeader = ({
  household,
  onClose,
}: {
  household: Household;
  onClose: () => void;
}) => {
  const { colors, circleStyle, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
      }}
    >
      <AnimatedPressable
        onPress={onClose}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          ...circleStyle(iconContainer.md),
          backgroundColor: colors.glass.button,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          ...shadows.sm,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.white} />
      </AnimatedPressable>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {household.name}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary }}>
          {t('admin.createdBy', { email: household.created_by })}
        </Text>
      </View>
    </View>
  );
};

const MembersListHeader = ({ onAddMember }: { onAddMember: () => void }) => {
  const { colors, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xl,
          fontWeight: fontWeight.semibold,
          color: colors.content.heading,
        }}
      >
        {t('admin.members')}
      </Text>
      <AnimatedPressable
        onPress={onAddMember}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="person-add" size={16} color={colors.white} />
        <Text
          style={{
            color: colors.white,
            fontWeight: fontWeight.medium,
            marginLeft: 4,
          }}
        >
          {t('admin.addMemberButton')}
        </Text>
      </AnimatedPressable>
    </View>
  );
};

const MemberCard = ({
  member,
  onRemove,
}: {
  member: HouseholdMember;
  onRemove: () => void;
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();
  const roleColor =
    member.role === 'admin' ? colors.warning : colors.text.muted;

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
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
        <View
          style={{
            backgroundColor: roleColor + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: borderRadius.full,
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xs,
              color: roleColor,
              fontWeight: fontWeight.medium,
              textTransform: 'uppercase',
            }}
          >
            {t(`labels.role.${member.role}` as 'labels.role.member')}
          </Text>
        </View>
      </View>
      <AnimatedPressable
        onPress={onRemove}
        hoverScale={1.1}
        pressScale={0.9}
        style={{ padding: spacing.sm }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </AnimatedPressable>
    </View>
  );
};
