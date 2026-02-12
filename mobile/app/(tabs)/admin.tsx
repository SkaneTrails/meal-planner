/**
 * Admin screen - Household management for superusers.
 * Shows household list, member management, and creation options.
 * Only visible to users with 'superuser' role.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable, GradientBackground } from '@/components';
import { showAlert, showNotification } from '@/lib/alert';
import {
  useAddMember,
  useCreateHousehold,
  useCurrentUser,
  useHouseholdMembers,
  useHouseholds,
  useRemoveMember,
} from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import type { Household, HouseholdMember } from '@/lib/types';

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const {
    data: households,
    isLoading: householdsLoading,
    refetch: refetchHouseholds,
  } = useHouseholds();
  const createHousehold = useCreateHousehold();

  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');

  if (userLoading) {
    return (
      <GradientBackground muted>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  if (!currentUser || currentUser.role !== 'superuser') {
    return (
      <GradientBackground muted>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
          }}
        >
          <Ionicons name="lock-closed" size={64} color={colors.text.muted} />
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.semibold,
              color: colors.text.muted,
              marginTop: spacing.lg,
              textAlign: 'center',
            }}
          >
            {t('admin.accessRequired')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.lg,
              color: colors.text.muted,
              marginTop: spacing.sm,
              textAlign: 'center',
            }}
          >
            {t('admin.accessRequiredMessage')}
          </Text>
        </View>
      </GradientBackground>
    );
  }

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;

    try {
      await createHousehold.mutateAsync({ name: newHouseholdName.trim() });
      setShowCreateModal(false);
      setNewHouseholdName('');
      refetchHouseholds();
    } catch (error) {
      showNotification(
        t('common.error'),
        error instanceof Error
          ? error.message
          : t('admin.failedToCreateHousehold'),
      );
    }
  };

  return (
    <GradientBackground muted>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <AnimatedPressable
            onPress={() => router.back()}
            hoverScale={1.1}
            pressScale={0.9}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
              ...shadows.sm,
            }}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize['4xl'],
                fontWeight: '600',
                color: colors.text.primary,
                letterSpacing: -0.5,
              }}
            >
              {t('tabs.admin')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {t('admin.subtitle')}
            </Text>
          </View>
        </View>

        {/* Current User Info */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.lg,
            ...shadows.sm,
          }}
        >
          <Text
            style={{ fontSize: fontSize.sm, color: colors.text.inverse + '99' }}
          >
            {t('admin.loggedInAs')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.medium,
              color: colors.text.inverse,
            }}
          >
            {currentUser.email}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.xs,
            }}
          >
            <View
              style={{
                backgroundColor: colors.success + '20',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: borderRadius.full,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  color: colors.success,
                  fontWeight: fontWeight.medium,
                  textTransform: 'uppercase',
                }}
              >
                {t(`labels.role.${currentUser.role}` as 'labels.role.member')}
              </Text>
            </View>
          </View>
        </View>

        {/* Households List */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
              }}
            >
              {t('admin.households')}
            </Text>
            <AnimatedPressable
              onPress={() => setShowCreateModal(true)}
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
              <Ionicons name="add" size={18} color="white" />
              <Text
                style={{
                  color: 'white',
                  fontWeight: fontWeight.medium,
                  marginLeft: 4,
                }}
              >
                {t('admin.newButton')}
              </Text>
            </AnimatedPressable>
          </View>

          <FlatList
            data={households || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HouseholdCard
                household={item}
                onPress={() => setSelectedHousehold(item)}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: 70,
            }}
            refreshControl={
              <RefreshControl
                refreshing={householdsLoading}
                onRefresh={() => refetchHouseholds()}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: spacing.xl }}>
                <Ionicons
                  name="home-outline"
                  size={48}
                  color={colors.text.muted}
                />
                <Text
                  style={{ color: colors.text.muted, marginTop: spacing.md }}
                >
                  {t('admin.noHouseholds')}
                </Text>
              </View>
            }
          />
        </View>

        {/* Create Household Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bgLight,
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: '#3D3D3D',
                }}
              >
                {t('admin.createHousehold.button')}
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color="#8B7355" />
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.semibold,
                  color: '#3D3D3D',
                  marginBottom: spacing.sm,
                }}
              >
                {t('admin.createHousehold.nameLabel')}
              </Text>
              <TextInput
                value={newHouseholdName}
                onChangeText={setNewHouseholdName}
                placeholder={t('admin.createHousehold.namePlaceholder')}
                placeholderTextColor="#8B735580"
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  fontSize: fontSize.lg,
                  color: '#3D3D3D',
                  ...shadows.sm,
                }}
                autoFocus
              />
            </View>

            <AnimatedPressable
              onPress={handleCreateHousehold}
              disabled={!newHouseholdName.trim() || createHousehold.isPending}
              hoverScale={1.02}
              pressScale={0.97}
              disableAnimation={
                !newHouseholdName.trim() || createHousehold.isPending
              }
              style={{
                backgroundColor: !newHouseholdName.trim()
                  ? '#C5B8A8'
                  : '#5D4E40',
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                marginTop: spacing.xl,
                alignItems: 'center',
              }}
            >
              {createHousehold.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    color: 'white',
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                  }}
                >
                  {t('admin.createHousehold.button')}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </Modal>

        {/* Household Detail Modal */}
        {selectedHousehold && (
          <HouseholdDetailModal
            household={selectedHousehold}
            onClose={() => setSelectedHousehold(null)}
          />
        )}
      </View>
    </GradientBackground>
  );
}

interface HouseholdCardProps {
  household: Household;
  onPress: () => void;
}

const HouseholdCard = ({ household, onPress }: HouseholdCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bgMid : colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.text.inverse,
            }}
          >
            {household.name}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.text.inverse + '99',
              marginTop: 2,
            }}
          >
            ID: {household.id}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.inverse + '80'}
        />
      </View>
    </Pressable>
  );
};

interface HouseholdDetailModalProps {
  household: Household;
  onClose: () => void;
}

const HouseholdDetailModal = ({
  household,
  onClose,
}: HouseholdDetailModalProps) => {
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
      showNotification(
        t('common.error'),
        error instanceof Error ? error.message : t('admin.failedToAddMember'),
      );
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
              showNotification(
                t('common.error'),
                error instanceof Error
                  ? error.message
                  : t('admin.failedToRemoveMember'),
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
        <View
          style={{
            flex: 1,
          }}
        >
          {/* Header */}
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
                ...shadows.sm,
              }}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </AnimatedPressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: colors.text.inverse,
                }}
              >
                {household.name}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.text.inverse + '80',
                }}
              >
                {t('admin.createdBy', { email: household.created_by })}
              </Text>
            </View>
          </View>

          {/* Members */}
          <View style={{ flex: 1, padding: spacing.lg }}>
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
                  color: colors.text.inverse,
                }}
              >
                {t('admin.members')}
              </Text>
              <AnimatedPressable
                onPress={() => setShowAddMember(true)}
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
                <Ionicons name="person-add" size={16} color="white" />
                <Text
                  style={{
                    color: 'white',
                    fontWeight: fontWeight.medium,
                    marginLeft: 4,
                  }}
                >
                  {t('admin.addMemberButton')}
                </Text>
              </AnimatedPressable>
            </View>

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

          {/* Add Member Form */}
          {showAddMember && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.bgLight,
                padding: spacing.lg,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                ...shadows.lg,
              }}
            >
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
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: '#3D3D3D',
                  }}
                >
                  {t('admin.addMember.title')}
                </Text>
                <Pressable onPress={() => setShowAddMember(false)}>
                  <Ionicons name="close" size={24} color="#8B7355" />
                </Pressable>
              </View>

              <TextInput
                value={newMemberEmail}
                onChangeText={setNewMemberEmail}
                placeholder={t('admin.addMember.emailPlaceholder')}
                placeholderTextColor="#8B735580"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: fontSize.md,
                  color: '#3D3D3D',
                  marginBottom: spacing.sm,
                }}
              />

              <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                {(['member', 'admin'] as const).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setNewMemberRole(role)}
                    style={{
                      flex: 1,
                      padding: spacing.sm,
                      marginRight: role === 'member' ? spacing.sm : 0,
                      backgroundColor:
                        newMemberRole === role ? '#3D3D3D' : colors.white,
                      borderRadius: borderRadius.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: newMemberRole === role ? 'white' : '#3D3D3D',
                        fontWeight: fontWeight.medium,
                      }}
                    >
                      {t(`labels.role.${role}` as 'labels.role.member')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <AnimatedPressable
                onPress={handleAddMember}
                disabled={!newMemberEmail.trim() || addMember.isPending}
                hoverScale={1.02}
                pressScale={0.97}
                disableAnimation={!newMemberEmail.trim() || addMember.isPending}
                style={{
                  backgroundColor: !newMemberEmail.trim()
                    ? '#C5B8A8'
                    : '#3D3D3D',
                  padding: spacing.md,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                }}
              >
                {addMember.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{
                      color: 'white',
                      fontSize: fontSize.md,
                      fontWeight: fontWeight.semibold,
                    }}
                  >
                    {t('admin.addMember.button')}
                  </Text>
                )}
              </AnimatedPressable>
            </View>
          )}
        </View>
      </GradientBackground>
    </Modal>
  );
};

interface MemberCardProps {
  member: HouseholdMember;
  onRemove: () => void;
}

const MemberCard = ({ member, onRemove }: MemberCardProps) => {
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
            color: colors.text.inverse,
          }}
        >
          {member.display_name || member.email}
        </Text>
        {member.display_name && (
          <Text
            style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}
          >
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
        style={{
          padding: spacing.sm,
        }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </AnimatedPressable>
    </View>
  );
};
