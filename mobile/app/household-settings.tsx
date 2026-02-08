/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, fontWeight, fontFamily, letterSpacing } from '@/lib/theme';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { useCurrentUser, useHouseholdSettings, useUpdateHouseholdSettings } from '@/lib/hooks/use-admin';
import { GradientBackground } from '@/components';
import type { MeatPreference, MincedMeatPreference, DairyPreference, HouseholdSettings } from '@/lib/types';



interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glass.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
      }}>
        <Ionicons name={icon} size={20} color="#5D4E40" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white }}>
          {title}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.white + '80', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

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
              backgroundColor: isSelected ? colors.primary + '15' : pressed ? colors.bgDark : colors.white,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <View style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : colors.text.muted,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              {isSelected && (
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                }} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: fontSize.md,
                fontWeight: isSelected ? fontWeight.semibold : fontWeight.normal,
                color: colors.text.inverse,
              }}>
                {option.label}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  equipment: {
    airfryer: false,
    airfryer_model: null,
    airfryer_capacity_liters: null,
    convection_oven: true,
    grill_function: true,
  },
};

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const { id: householdId } = useLocalSearchParams<{ id: string }>();

  const { data: remoteSettings, isLoading } = useHouseholdSettings(householdId ?? null);
  const updateSettings = useUpdateHouseholdSettings();
  const { data: currentUser } = useCurrentUser();
  const { t } = useTranslation();

  // Options for dropdowns (inside component for i18n)
  const MEAT_OPTIONS: { value: MeatPreference; label: string; description: string }[] = [
    { value: 'all', label: t('householdSettings.dietary.meatRegular'), description: t('householdSettings.dietary.meatRegularDesc') },
    { value: 'split', label: t('householdSettings.dietary.splitMeatVeg'), description: t('householdSettings.dietary.splitMeatVegDesc') },
    { value: 'none', label: t('householdSettings.dietary.meatNone'), description: t('householdSettings.dietary.meatNoneDesc') },
  ];

  const MINCED_MEAT_OPTIONS: { value: MincedMeatPreference; label: string; description: string }[] = [
    { value: 'meat', label: t('householdSettings.dietary.mincedRegular'), description: t('householdSettings.dietary.mincedRegularDesc') },
    { value: 'soy', label: t('householdSettings.dietary.mincedSoy'), description: t('householdSettings.dietary.mincedSoyDesc') },
    { value: 'split', label: t('householdSettings.dietary.mincedSplit'), description: t('householdSettings.dietary.mincedSplitDesc') },
  ];

  const DAIRY_OPTIONS: { value: DairyPreference; label: string; description: string }[] = [
    { value: 'regular', label: t('householdSettings.dietary.dairyRegular'), description: t('householdSettings.dietary.dairyRegularDesc') },
    { value: 'lactose_free', label: t('householdSettings.dietary.dairyLactoseFree'), description: t('householdSettings.dietary.dairyLactoseFreeDesc') },
    { value: 'dairy_free', label: t('householdSettings.dietary.dairyFree'), description: t('householdSettings.dietary.dairyFreeDesc') },
  ];

  const canEdit = currentUser?.role === 'superuser' ||
    (currentUser?.role === 'admin' && currentUser?.household_id === householdId);

  const [settings, setSettings] = useState<HouseholdSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (remoteSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...remoteSettings,
        dietary: { ...DEFAULT_SETTINGS.dietary, ...(remoteSettings.dietary ?? {}) },
        equipment: { ...DEFAULT_SETTINGS.equipment, ...(remoteSettings.equipment ?? {}) },
      });
    }
  }, [remoteSettings]);

  const handleSave = async () => {
    if (!householdId) return;

    try {
      await updateSettings.mutateAsync({ householdId, settings });
      setHasChanges(false);
      showNotification(t('householdSettings.saved'), t('householdSettings.savedMessage'));
    } catch {
      showNotification(t('common.error'), t('householdSettings.failedToSave'));
    }
  };

  const updateField = <K extends keyof HouseholdSettings>(key: K, value: HouseholdSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateDietary = <K extends keyof HouseholdSettings['dietary']>(
    key: K,
    value: HouseholdSettings['dietary'][K]
  ) => {
    setSettings(prev => ({
      ...prev,
      dietary: { ...prev.dietary, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateEquipment = <K extends keyof HouseholdSettings['equipment']>(
    key: K,
    value: HouseholdSettings['equipment'][K]
  ) => {
    setSettings(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [key]: value },
    }));
    setHasChanges(true);
  };

  if (!householdId) {
    return (
      <GradientBackground muted>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        {/* Custom header matching app theme */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 44, paddingBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
              <Text style={{ color: colors.text.primary, fontSize: 17, marginLeft: 2 }}>{t('common.back')}</Text>
            </Pressable>
            {canEdit && hasChanges && (
              <Pressable
                onPress={handleSave}
                disabled={updateSettings.isPending}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.accentDark : colors.accent,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.md,
                  opacity: updateSettings.isPending ? 0.6 : 1,
                })}
              >
                {updateSettings.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>{t('common.save')}</Text>
                )}
              </Pressable>
            )}
          </View>
          <View style={{ marginTop: spacing.md }}>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontFamily: fontFamily.display,
              color: colors.text.primary,
              letterSpacing: letterSpacing.tight,
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>{t('householdSettings.title')}</Text>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.body,
              color: colors.text.secondary,
              marginTop: 4,
            }}>{t('householdSettings.subtitle')}</Text>
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, paddingBottom: 120 }}
        >
          {/* Read-only banner for non-admin members */}
          {!canEdit && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: spacing.md,
              marginBottom: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
              <Ionicons name="lock-closed" size={16} color={colors.text.secondary} />
              <Text style={{
                color: colors.text.secondary,
                fontSize: fontSize.sm,
                flex: 1,
              }}>
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

            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              ...shadows.sm,
            }}>
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80', marginBottom: spacing.xs }}>
                  {t('householdSettings.general.householdSize')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() => settings.household_size > 1 && updateField('household_size', settings.household_size - 1)}
                    disabled={!canEdit}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: canEdit ? 1 : 0.4,
                    })}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.inverse} />
                  </Pressable>
                  <Text style={{
                    fontSize: fontSize['2xl'],
                    fontWeight: fontWeight.bold,
                    color: colors.text.inverse,
                    minWidth: 60,
                    textAlign: 'center',
                  }}>
                    {settings.household_size}
                  </Text>
                  <Pressable
                    onPress={() => updateField('household_size', settings.household_size + 1)}
                    disabled={!canEdit}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: canEdit ? 1 : 0.4,
                    })}
                  >
                    <Ionicons name="add" size={20} color={colors.text.inverse} />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80', marginBottom: spacing.xs }}>
                  {t('householdSettings.general.defaultServings')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() => settings.default_servings > 1 && updateField('default_servings', settings.default_servings - 1)}
                    disabled={!canEdit}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: canEdit ? 1 : 0.4,
                    })}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.inverse} />
                  </Pressable>
                  <Text style={{
                    fontSize: fontSize['2xl'],
                    fontWeight: fontWeight.bold,
                    color: colors.text.inverse,
                    minWidth: 60,
                    textAlign: 'center',
                  }}>
                    {settings.default_servings}
                  </Text>
                  <Pressable
                    onPress={() => updateField('default_servings', settings.default_servings + 1)}
                    disabled={!canEdit}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: canEdit ? 1 : 0.4,
                    })}
                  >
                    <Ionicons name="add" size={20} color={colors.text.inverse} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Dietary Preferences */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="nutrition"
              title={t('householdSettings.dietary.title')}
              subtitle={t('householdSettings.dietary.subtitle')}
            />

            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              ...shadows.sm,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <View>
                  <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.inverse }}>
                    {t('householdSettings.dietary.seafood')}
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
                    {t('householdSettings.dietary.seafoodDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.dietary.seafood_ok}
                  onValueChange={(value) => updateDietary('seafood_ok', value)}
                  disabled={!canEdit}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            <Text style={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
              color: colors.text.muted,
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
            }}>
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
              <View style={{
                backgroundColor: colors.bgLight,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              }}>
                <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80', marginBottom: spacing.sm }}>
                  {t('householdSettings.dietary.chickenAlt')}
                </Text>
                <TextInput
                  value={settings.dietary.chicken_alternative ?? ''}
                  onChangeText={(value) => updateDietary('chicken_alternative', value || null)}
                  editable={canEdit}
                  placeholder={t('householdSettings.dietary.chickenAltPlaceholder')}
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
                <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80', marginTop: spacing.md, marginBottom: spacing.sm }}>
                  {t('householdSettings.dietary.meatAlt')}
                </Text>
                <TextInput
                  value={settings.dietary.meat_alternative ?? ''}
                  onChangeText={(value) => updateDietary('meat_alternative', value || null)}
                  editable={canEdit}
                  placeholder={t('householdSettings.dietary.meatAltPlaceholder')}
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

            <Text style={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
              color: colors.text.muted,
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
            }}>
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

            <Text style={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
              color: colors.text.muted,
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
            }}>
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

            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              ...shadows.sm,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}>
                <View>
                  <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.inverse }}>
                    {t('householdSettings.equipment.airfryer')}
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
                    {t('householdSettings.equipment.airfryerDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.airfryer}
                  onValueChange={(value) => updateEquipment('airfryer', value)}
                  disabled={!canEdit}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              {settings.equipment.airfryer && (
                <View style={{
                  backgroundColor: colors.bgLight,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                }}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80', marginBottom: spacing.sm }}>
                    {t('householdSettings.equipment.model')}
                  </Text>
                  <TextInput
                    value={settings.equipment.airfryer_model ?? ''}
                    onChangeText={(value) => updateEquipment('airfryer_model', value || null)}
                    editable={canEdit}
                    placeholder={t('householdSettings.equipment.modelPlaceholder')}
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

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}>
                <View>
                  <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.inverse }}>
                    {t('householdSettings.equipment.convectionOven')}
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
                    {t('householdSettings.equipment.convectionDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.convection_oven}
                  onValueChange={(value) => updateEquipment('convection_oven', value)}
                  disabled={!canEdit}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <View>
                  <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.inverse }}>
                    {t('householdSettings.equipment.grillFunction')}
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
                    {t('householdSettings.equipment.grillDesc')}
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.grill_function}
                  onValueChange={(value) => updateEquipment('grill_function', value)}
                  disabled={!canEdit}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Persistent bottom save bar */}
        {canEdit && hasChanges && (
          <View style={{
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
          }}>
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
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
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
