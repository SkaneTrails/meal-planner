/**
 * Admin screen - Household management for superusers.
 * Shows household list, member management, and creation options.
 * Only visible to users with 'superuser' role.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, fontWeight } from '@/lib/theme';
import { GradientBackground } from '@/components';
import { useCurrentUser, useHouseholds, useHouseholdMembers, useCreateHousehold, useAddMember, useRemoveMember } from '@/lib/hooks/use-admin';
import type { Household, HouseholdMember } from '@/lib/types';

export default function AdminScreen() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: households, isLoading: householdsLoading, refetch: refetchHouseholds } = useHouseholds();
  const createHousehold = useCreateHousehold();

  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');

  // Check if user is superuser
  if (userLoading) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  if (!currentUser || currentUser.role !== 'superuser') {
    return (
      <GradientBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="lock-closed" size={64} color={colors.text.muted} />
          <Text style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.semibold,
            color: colors.text.muted,
            marginTop: spacing.lg,
            textAlign: 'center',
          }}>
            Admin Access Required
          </Text>
          <Text style={{
            fontSize: fontSize.lg,
            color: colors.text.muted,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}>
            You need superuser permissions to access this area.
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create household');
    }
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: spacing.md,
        }}>
          <Text style={{
            fontSize: fontSize['4xl'],
            fontWeight: '600',
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}>
            Admin
          </Text>
          <Text style={{
            fontSize: fontSize.lg,
            color: colors.text.secondary,
            marginTop: 4,
          }}>
            Manage households and members
          </Text>
        </View>

        {/* Current User Info */}
        <View style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.lg,
          ...shadows.sm,
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '99' }}>Logged in as</Text>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.medium, color: colors.text.inverse }}>
            {currentUser.email}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <View style={{
              backgroundColor: colors.success + '20',
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: borderRadius.full,
            }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.success, fontWeight: fontWeight.medium }}>
                {currentUser.role.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Households List */}
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.sm,
          }}>
            <Text style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.semibold,
              color: colors.text.inverse,
            }}>
              Households
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDark : colors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
              })}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: fontWeight.medium, marginLeft: 4 }}>
                New
              </Text>
            </Pressable>
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
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={householdsLoading}
                onRefresh={() => refetchHouseholds()}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: spacing.xl }}>
                <Ionicons name="home-outline" size={48} color={colors.text.muted} />
                <Text style={{ color: colors.text.muted, marginTop: spacing.md }}>
                  No households yet
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
          <View style={{
            flex: 1,
            backgroundColor: colors.bgLight,
            padding: spacing.lg,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text.inverse }}>
                Create Household
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={colors.text.muted} />
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Text style={{ fontSize: fontSize.md, color: colors.text.inverse, marginBottom: spacing.sm }}>
                Household Name
              </Text>
              <TextInput
                value={newHouseholdName}
                onChangeText={setNewHouseholdName}
                placeholder="e.g., Smith Family"
                placeholderTextColor={colors.text.inverse + '60'}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  fontSize: fontSize.lg,
                  color: colors.text.inverse,
                  ...shadows.sm,
                }}
                autoFocus
              />
            </View>

            <Pressable
              onPress={handleCreateHousehold}
              disabled={!newHouseholdName.trim() || createHousehold.isPending}
              style={({ pressed }) => ({
                backgroundColor: !newHouseholdName.trim() ? colors.text.muted : (pressed ? colors.primaryDark : colors.primary),
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                marginTop: spacing.xl,
                alignItems: 'center',
              })}
            >
              {createHousehold.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: fontSize.lg, fontWeight: fontWeight.semibold }}>
                  Create Household
                </Text>
              )}
            </Pressable>
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

function HouseholdCard({ household, onPress }: HouseholdCardProps) {
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            color: colors.text.inverse,
          }}>
            {household.name}
          </Text>
          <Text style={{
            fontSize: fontSize.sm,
            color: colors.text.inverse + '99',
            marginTop: 2,
          }}>
            ID: {household.id}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.inverse + '80'} />
      </View>
    </Pressable>
  );
}

interface HouseholdDetailModalProps {
  household: Household;
  onClose: () => void;
}

function HouseholdDetailModal({ household, onClose }: HouseholdDetailModalProps) {
  const router = useRouter();
  const { data: members, isLoading, refetch } = useHouseholdMembers(household.id);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  const handleOpenSettings = () => {
    onClose(); // Close modal first
    router.push(`/household-settings?id=${household.id}`);
  };

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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = (email: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${email} from this household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync({ householdId: household.id, email });
              refetch();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: colors.bgLight,
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text.inverse }}>
              {household.name}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
              Created by: {household.created_by}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              onPress={handleOpenSettings}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: pressed ? colors.bgDark : 'transparent',
              })}
            >
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text.muted} />
            </Pressable>
          </View>
        </View>

        {/* Members */}
        <View style={{ flex: 1, padding: spacing.lg }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text.inverse }}>
              Members
            </Text>
            <Pressable
              onPress={() => setShowAddMember(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDark : colors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
              })}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text style={{ color: 'white', fontWeight: fontWeight.medium, marginLeft: 4 }}>
                Add
              </Text>
            </Pressable>
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
                  <Text style={{ color: colors.text.muted }}>No members yet</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Add Member Form */}
        {showAddMember && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.white,
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...shadows.lg,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.inverse }}>
                Add Member
              </Text>
              <Pressable onPress={() => setShowAddMember(false)}>
                <Ionicons name="close" size={24} color={colors.text.muted} />
              </Pressable>
            </View>

            <TextInput
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              placeholder="Email address"
              placeholderTextColor={colors.text.inverse + '60'}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: colors.bgLight,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: fontSize.md,
                color: colors.text.inverse,
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
                    backgroundColor: newMemberRole === role ? colors.primary : colors.bgMid,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: newMemberRole === role ? 'white' : colors.text.inverse,
                    fontWeight: fontWeight.medium,
                    textTransform: 'capitalize',
                  }}>
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAddMember}
              disabled={!newMemberEmail.trim() || addMember.isPending}
              style={({ pressed }) => ({
                backgroundColor: !newMemberEmail.trim() ? colors.text.muted : (pressed ? colors.primaryDark : colors.primary),
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                alignItems: 'center',
              })}
            >
              {addMember.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
                  Add Member
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

interface MemberCardProps {
  member: HouseholdMember;
  onRemove: () => void;
}

function MemberCard({ member, onRemove }: MemberCardProps) {
  const roleColor = member.role === 'admin' ? colors.warning : colors.text.muted;

  return (
    <View style={{
      backgroundColor: colors.glass.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...shadows.sm,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.medium,
          color: colors.text.inverse,
        }}>
          {member.display_name || member.email}
        </Text>
        {member.display_name && (
          <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
            {member.email}
          </Text>
        )}
        <View style={{
          backgroundColor: roleColor + '20',
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.full,
          alignSelf: 'flex-start',
          marginTop: spacing.xs,
        }}>
          <Text style={{
            fontSize: fontSize.xs,
            color: roleColor,
            fontWeight: fontWeight.medium,
            textTransform: 'uppercase',
          }}>
            {member.role}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => ({
          padding: spacing.sm,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </Pressable>
    </View>
  );
}
