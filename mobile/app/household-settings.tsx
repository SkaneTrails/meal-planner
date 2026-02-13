/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable, GradientBackground } from '@/components';
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
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';
import type {
  DairyPreference,
  HouseholdMember,
  HouseholdSettings,
  MeatPreference,
  MincedMeatPreference,
} from '@/lib/types';

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.glass.card,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name={icon} size={20} color="#5D4E40" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            color: colors.white,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.white + '80',
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

interface RadioGroupProps<T extends string> {
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const RadioGroup = <T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: RadioGroupProps<T>) => {
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isSelected
                ? colors.primary + '15'
                : pressed
                  ? colors.bgDark
                  : colors.white,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : colors.text.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              {isSelected && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: isSelected
                    ? fontWeight.semibold
                    : fontWeight.normal,
                  color: colors.text.inverse,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.text.inverse + '80',
                }}
              >
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

/**
 * Equipment categories with their item keys.
 * Mirrors the API catalog in api/models/equipment.py.
 * To add equipment: add the key here + add i18n translations.
 */
const EQUIPMENT_CATEGORIES = [
  {
    key: 'appliances',
    items: ['air_fryer', 'stand_mixer', 'food_processor', 'immersion_blender', 'pressure_cooker', 'slow_cooker', 'sous_vide', 'pasta_machine', 'pizza_oven'],
  },
  { key: 'oven_features', items: ['convection_oven', 'grill_function', 'steam_oven'] },
  { key: 'cookware', items: ['dutch_oven', 'cast_iron_skillet', 'wok', 'pizza_stone'] },
  { key: 'tools', items: ['probe_thermometer', 'outdoor_grill', 'kitchen_torch'] },
] as const;

const DEFAULT_SETTINGS: HouseholdSettings = {
  household_size: 2,
  default_servings: 2,
  language: 'sv',
  dietary: {
    seafood_ok: true,
    meat: 'all',
    minced_meat: 'meat',
    dairy: 'regular',
    chicken_alternative: null,
    meat_alternative: null,
  },
  equipment: [],
};

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const { id: paramId } = useLocalSearchParams<{ id: string }>();

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const householdId = paramId ?? currentUser?.household_id;

  const { data: remoteSettings, isLoading: settingsLoading } = useHouseholdSettings(
    householdId ?? null,
  );
  const isLoading = userLoading || settingsLoading;
  const updateSettings = useUpdateHouseholdSettings();
  const { user } = useAuth();
  const { t } = useTranslation();

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

  // Options for dropdowns (inside component for i18n)
  const MEAT_OPTIONS: {
    value: MeatPreference;
    label: string;
    description: string;
  }[] = [
    {
      value: 'all',
      label: t('householdSettings.dietary.meatRegular'),
      description: t('householdSettings.dietary.meatRegularDesc'),
    },
    {
      value: 'split',
      label: t('householdSettings.dietary.splitMeatVeg'),
      description: t('householdSettings.dietary.splitMeatVegDesc'),
    },
    {
      value: 'none',
      label: t('householdSettings.dietary.meatNone'),
      description: t('householdSettings.dietary.meatNoneDesc'),
    },
  ];

  const MINCED_MEAT_OPTIONS: {
    value: MincedMeatPreference;
    label: string;
    description: string;
  }[] = [
    {
      value: 'meat',
      label: t('householdSettings.dietary.mincedRegular'),
      description: t('householdSettings.dietary.mincedRegularDesc'),
    },
    {
      value: 'soy',
      label: t('householdSettings.dietary.mincedSoy'),
      description: t('householdSettings.dietary.mincedSoyDesc'),
    },
    {
      value: 'split',
      label: t('householdSettings.dietary.mincedSplit'),
      description: t('householdSettings.dietary.mincedSplitDesc'),
    },
  ];

  const DAIRY_OPTIONS: {
    value: DairyPreference;
    label: string;
    description: string;
  }[] = [
    {
      value: 'regular',
      label: t('householdSettings.dietary.dairyRegular'),
      description: t('householdSettings.dietary.dairyRegularDesc'),
    },
    {
      value: 'lactose_free',
      label: t('householdSettings.dietary.dairyLactoseFree'),
      description: t('householdSettings.dietary.dairyLactoseFreeDesc'),
    },
    {
      value: 'dairy_free',
      label: t('householdSettings.dietary.dairyFree'),
      description: t('householdSettings.dietary.dairyFreeDesc'),
    },
  ];

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
        equipment: Array.isArray(remoteSettings.equipment) ? remoteSettings.equipment : [],
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

  const updateField = <K extends keyof HouseholdSettings>(
    key: K,
    value: HouseholdSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
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

  const toggleEquipment = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(key)
        ? prev.equipment.filter((k) => k !== key)
        : [...prev.equipment, key],
    }));
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
      showNotification(
        t('common.error'),
        error instanceof Error ? error.message : t('admin.failedToAddMember'),
      );
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

  if (!householdId) {
    if (userLoading) {
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
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Custom header matching app theme */}
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: 44,
              paddingBottom: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 8,
                  marginLeft: -8,
                }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.text.primary}
                />
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 17,
                    marginLeft: 2,
                  }}
                >
                  {t('common.back')}
                </Text>
              </Pressable>
              {canEdit && hasChanges && (
                <Pressable
                  onPress={handleSave}
                  disabled={updateSettings.isPending}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.accentDark
                      : colors.accent,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    opacity: updateSettings.isPending ? 0.6 : 1,
                  })}
                >
                  {updateSettings.isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 15,
                        fontWeight: '600',
                      }}
                    >
                      {t('common.save')}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  fontSize: fontSize['4xl'],
                  fontFamily: fontFamily.display,
                  color: colors.text.primary,
                  letterSpacing: letterSpacing.tight,
                  textShadowColor: 'rgba(0, 0, 0, 0.15)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {t('householdSettings.title')}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontFamily: fontFamily.body,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                {t('householdSettings.subtitle')}
              </Text>
            </View>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingTop: 0,
              paddingBottom: 120,
            }}
          >
            {/* Read-only banner for non-admin members */}
            {!canEdit && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: fontSize.sm,
                    flex: 1,
                  }}
                >
                  {t('householdSettings.readOnly')}
                </Text>
              </View>
            )}

            {/* General Settings */}
            <View style={{ marginBottom: spacing['2xl'] }}>
              <SectionHeader
                icon="home"
                title={t('householdSettings.general.title')}
                subtitle={t('householdSettings.general.subtitle')}
              />

              <View
                style={{
                  backgroundColor: colors.glass.card,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  ...shadows.sm,
                }}
              >
                {/* Household Name */}
                <View style={{ marginBottom: spacing.lg }}>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.inverse + '80',
                      marginBottom: spacing.xs,
                    }}
                  >
                    {t('householdSettings.general.nameLabel')}
                  </Text>
                  {isEditingName ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <TextInput
                        value={editedName}
                        onChangeText={setEditedName}
                        autoFocus
                        maxLength={100}
                        onSubmitEditing={handleSaveName}
                        style={{
                          flex: 1,
                          fontSize: fontSize.lg,
                          fontWeight: fontWeight.bold,
                          color: colors.text.inverse,
                          backgroundColor: colors.bgLight,
                          borderRadius: borderRadius.md,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                        }}
                      />
                      <Pressable
                        onPress={handleSaveName}
                        disabled={renameHousehold.isPending}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: renameHousehold.isPending ? 0.6 : 1,
                        }}
                      >
                        {renameHousehold.isPending ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Ionicons name="checkmark" size={20} color="white" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => setIsEditingName(false)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.bgLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.text.inverse} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={canEdit ? handleStartEditName : undefined}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.lg,
                          fontWeight: fontWeight.bold,
                          color: colors.text.inverse,
                          flex: 1,
                        }}
                      >
                        {household?.name ?? '—'}
                      </Text>
                      {canEdit && (
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.text.inverse + '60'}
                        />
                      )}
                    </Pressable>
                  )}
                </View>

                {/* Household Size */}
                <View style={{ marginBottom: spacing.lg }}>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.inverse + '80',
                      marginBottom: spacing.xs,
                    }}
                  >
                    {t('householdSettings.general.householdSize')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() =>
                        settings.household_size > 1 &&
                        updateField(
                          'household_size',
                          settings.household_size - 1,
                        )
                      }
                      disabled={!canEdit}
                      style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed
                          ? colors.bgDark
                          : colors.bgLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: canEdit ? 1 : 0.4,
                      })}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                    <Text
                      style={{
                        fontSize: fontSize['2xl'],
                        fontWeight: fontWeight.bold,
                        color: colors.text.inverse,
                        minWidth: 60,
                        textAlign: 'center',
                      }}
                    >
                      {settings.household_size}
                    </Text>
                    <Pressable
                      onPress={() =>
                        updateField(
                          'household_size',
                          settings.household_size + 1,
                        )
                      }
                      disabled={!canEdit}
                      style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed
                          ? colors.bgDark
                          : colors.bgLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: canEdit ? 1 : 0.4,
                      })}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.inverse + '80',
                      marginBottom: spacing.xs,
                    }}
                  >
                    {t('householdSettings.general.defaultServings')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() =>
                        settings.default_servings > 1 &&
                        updateField(
                          'default_servings',
                          settings.default_servings - 1,
                        )
                      }
                      disabled={!canEdit}
                      style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed
                          ? colors.bgDark
                          : colors.bgLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: canEdit ? 1 : 0.4,
                      })}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                    <Text
                      style={{
                        fontSize: fontSize['2xl'],
                        fontWeight: fontWeight.bold,
                        color: colors.text.inverse,
                        minWidth: 60,
                        textAlign: 'center',
                      }}
                    >
                      {settings.default_servings}
                    </Text>
                    <Pressable
                      onPress={() =>
                        updateField(
                          'default_servings',
                          settings.default_servings + 1,
                        )
                      }
                      disabled={!canEdit}
                      style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed
                          ? colors.bgDark
                          : colors.bgLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: canEdit ? 1 : 0.4,
                      })}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Members */}
            <View style={{ marginBottom: spacing['2xl'] }}>
              <SectionHeader
                icon="people"
                title={t('settings.membersSection')}
                subtitle={t('settings.membersSectionDesc')}
              />

              {membersLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: spacing.md }}
                />
              ) : members && members.length > 0 ? (
                <View style={{ gap: spacing.xs }}>
                  {members.map((member) => {
                    const roleColor =
                      member.role === 'admin'
                        ? colors.warning
                        : colors.text.muted;
                    const isSelf = member.email === user?.email;

                    return (
                      <View
                        key={member.email}
                        style={{
                          backgroundColor: colors.glass.card,
                          borderRadius: borderRadius.lg,
                          padding: spacing.md,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          ...shadows.sm,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: spacing.xs,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize.md,
                                fontWeight: fontWeight.medium,
                                color: colors.text.inverse,
                              }}
                            >
                              {member.display_name || member.email}
                            </Text>
                            {isSelf && (
                              <Text
                                style={{
                                  fontSize: fontSize.xs,
                                  color: colors.text.inverse + '60',
                                }}
                              >
                                (you)
                              </Text>
                            )}
                          </View>
                          {member.display_name && (
                            <Text
                              style={{
                                fontSize: fontSize.sm,
                                color: colors.text.inverse + '80',
                              }}
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
                              {t(
                                `labels.role.${member.role}` as 'labels.role.member',
                              )}
                            </Text>
                          </View>
                        </View>
                        {canEdit && !isSelf && (
                          <AnimatedPressable
                            onPress={() => handleRemoveMember(member)}
                            hoverScale={1.1}
                            pressScale={0.9}
                            style={{ padding: spacing.sm }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.error}
                            />
                          </AnimatedPressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.glass.card,
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    alignItems: 'center',
                    ...shadows.sm,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text.inverse + '80',
                      fontSize: fontSize.sm,
                    }}
                  >
                    {t('admin.noMembers')}
                  </Text>
                </View>
              )}

              {canEdit && (
                <View
                  style={{
                    backgroundColor: colors.glass.card,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginTop: spacing.sm,
                    ...shadows.sm,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <TextInput
                      value={newMemberEmail}
                      onChangeText={setNewMemberEmail}
                      placeholder={t('settings.addMemberPlaceholder')}
                      placeholderTextColor={colors.text.inverse + '60'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        backgroundColor: colors.white,
                        borderRadius: borderRadius.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        fontSize: fontSize.md,
                        color: colors.text.inverse,
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    {(['member', 'admin'] as const).map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setNewMemberRole(role)}
                        style={{
                          flex: 1,
                          paddingVertical: spacing.xs,
                          backgroundColor:
                            newMemberRole === role
                              ? colors.primary
                              : colors.white,
                          borderRadius: borderRadius.sm,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color:
                              newMemberRole === role
                                ? colors.white
                                : colors.text.inverse,
                            fontWeight: fontWeight.medium,
                            fontSize: fontSize.sm,
                          }}
                        >
                          {t(`labels.role.${role}` as 'labels.role.member')}
                        </Text>
                      </Pressable>
                    ))}

                    <AnimatedPressable
                      onPress={handleAddMember}
                      disabled={!newMemberEmail.trim() || addMember.isPending}
                      hoverScale={1.02}
                      pressScale={0.97}
                      disableAnimation={
                        !newMemberEmail.trim() || addMember.isPending
                      }
                      style={{
                        backgroundColor: newMemberEmail.trim()
                          ? colors.primary
                          : colors.bgDark,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {addMember.isPending ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="person-add"
                            size={14}
                            color={
                              newMemberEmail.trim()
                                ? colors.white
                                : colors.text.inverse + '60'
                            }
                          />
                          <Text
                            style={{
                              color: newMemberEmail.trim()
                                ? colors.white
                                : colors.text.inverse + '60',
                              fontWeight: fontWeight.medium,
                              fontSize: fontSize.sm,
                            }}
                          >
                            {t('admin.addMemberButton')}
                          </Text>
                        </>
                      )}
                    </AnimatedPressable>
                  </View>
                </View>
              )}
            </View>

            {/* Dietary Preferences */}
            <View style={{ marginBottom: spacing['2xl'] }}>
              <SectionHeader
                icon="nutrition"
                title={t('householdSettings.dietary.title')}
                subtitle={t('householdSettings.dietary.subtitle')}
              />

              <View
                style={{
                  backgroundColor: colors.glass.card,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: fontSize.md,
                        fontWeight: fontWeight.medium,
                        color: colors.text.inverse,
                      }}
                    >
                      {t('householdSettings.dietary.seafood')}
                    </Text>
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        color: colors.text.inverse + '80',
                      }}
                    >
                      {t('householdSettings.dietary.seafoodDesc')}
                    </Text>
                  </View>
                  <Switch
                    value={settings.dietary.seafood_ok}
                    onValueChange={(value) =>
                      updateDietary('seafood_ok', value)
                    }
                    disabled={!canEdit}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>

              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.muted,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                }}
              >
                {t('householdSettings.dietary.meatDishes')}
              </Text>
              <View style={{ marginBottom: spacing.lg }}>
                <RadioGroup
                  options={MEAT_OPTIONS}
                  value={settings.dietary.meat}
                  onChange={(value) => updateDietary('meat', value)}
                  disabled={!canEdit}
                />
              </View>

              {settings.dietary.meat !== 'all' && (
                <View
                  style={{
                    backgroundColor: colors.bgLight,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.inverse + '80',
                      marginBottom: spacing.sm,
                    }}
                  >
                    {t('householdSettings.dietary.chickenAlt')}
                  </Text>
                  <TextInput
                    value={settings.dietary.chicken_alternative ?? ''}
                    onChangeText={(value) =>
                      updateDietary('chicken_alternative', value || null)
                    }
                    editable={canEdit}
                    placeholder={t(
                      'householdSettings.dietary.chickenAltPlaceholder',
                    )}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      fontSize: fontSize.md,
                      color: colors.text.inverse,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.inverse + '80',
                      marginTop: spacing.md,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {t('householdSettings.dietary.meatAlt')}
                  </Text>
                  <TextInput
                    value={settings.dietary.meat_alternative ?? ''}
                    onChangeText={(value) =>
                      updateDietary('meat_alternative', value || null)
                    }
                    editable={canEdit}
                    placeholder={t(
                      'householdSettings.dietary.meatAltPlaceholder',
                    )}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      fontSize: fontSize.md,
                      color: colors.text.inverse,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>
              )}

              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.muted,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                }}
              >
                {t('householdSettings.dietary.mincedMeat')}
              </Text>
              <View style={{ marginBottom: spacing.lg }}>
                <RadioGroup
                  options={MINCED_MEAT_OPTIONS}
                  value={settings.dietary.minced_meat}
                  onChange={(value) => updateDietary('minced_meat', value)}
                  disabled={!canEdit}
                />
              </View>

              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.muted,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                }}
              >
                {t('householdSettings.dietary.dairy')}
              </Text>
              <RadioGroup
                options={DAIRY_OPTIONS}
                value={settings.dietary.dairy}
                onChange={(value) => updateDietary('dairy', value)}
                disabled={!canEdit}
              />
            </View>

            {/* Equipment */}
            <View style={{ marginBottom: spacing['2xl'] }}>
              <SectionHeader
                icon="hardware-chip"
                title={t('householdSettings.equipment.title')}
                subtitle={t('householdSettings.equipment.subtitle')}
              />

              {/* Selected equipment */}
              {settings.equipment.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.glass.card,
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.md,
                    ...shadows.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.semibold,
                      color: colors.text.inverse + '80',
                      marginBottom: spacing.sm,
                    }}
                  >
                    {t('householdSettings.equipment.yourEquipment', {
                      count: settings.equipment.length,
                    })}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                  >
                    {settings.equipment.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => canEdit && toggleEquipment(item)}
                        disabled={!canEdit}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: pressed
                            ? colors.errorBg
                            : colors.bgDark,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: borderRadius.full,
                          gap: 4,
                        })}
                      >
                        <Text
                          style={{
                            fontSize: fontSize.sm,
                            color: colors.text.inverse,
                          }}
                        >
                          {t(`householdSettings.equipment.items.${item}`)}
                        </Text>
                        {canEdit && (
                          <Ionicons
                            name="close-circle"
                            size={14}
                            color={colors.text.inverse + '60'}
                          />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Available equipment grouped by category */}
              <View
                style={{
                  backgroundColor: colors.glass.card,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  ...shadows.sm,
                }}
              >
                {EQUIPMENT_CATEGORIES.map(({ key, items }) => {
                  const available = items.filter(
                    (item) => !settings.equipment.includes(item),
                  );
                  if (available.length === 0) return null;
                  return (
                    <View key={key} style={{ marginBottom: spacing.lg }}>
                      <Text
                        style={{
                          fontSize: fontSize.xs,
                          fontWeight: fontWeight.semibold,
                          color: colors.text.inverse + '80',
                          marginBottom: spacing.sm,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t(`householdSettings.equipment.categories.${key}`)}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        {available.map((item) => (
                          <Pressable
                            key={item}
                            onPress={() => canEdit && toggleEquipment(item)}
                            disabled={!canEdit}
                            style={({ pressed }) => ({
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: pressed
                                ? colors.successBg
                                : 'transparent',
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              borderRadius: borderRadius.full,
                              borderWidth: 1,
                              borderColor: colors.text.inverse + '30',
                              borderStyle: 'dashed',
                              gap: 4,
                            })}
                          >
                            <Ionicons
                              name="add"
                              size={14}
                              color={colors.text.inverse + '80'}
                            />
                            <Text
                              style={{
                                fontSize: fontSize.sm,
                                color: colors.text.inverse + '80',
                              }}
                            >
                              {t(`householdSettings.equipment.items.${item}`)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Persistent bottom save bar */}
          {canEdit && hasChanges && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(253, 246, 240, 0.95)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(139, 115, 85, 0.2)',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                paddingBottom: spacing.xl,
              }}
            >
              <Pressable
                onPress={handleSave}
                disabled={updateSettings.isPending}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#5D4E40' : colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                })}
              >
                {updateSettings.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      {t('householdSettings.saveChanges')}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}
    </GradientBackground>
  );
}
