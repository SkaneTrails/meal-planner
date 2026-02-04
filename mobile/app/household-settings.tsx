/**
 * Household Settings screen.
 * Allows admins to configure dietary preferences, equipment, and other household-level settings.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GradientBackground } from '@/components';
import {
  useHouseholdSettings,
  useUpdateHouseholdSettings,
} from '@/lib/hooks/use-admin';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import type {
  DairyPreference,
  HouseholdSettings,
  MeatPreference,
  MincedMeatPreference,
} from '@/lib/types';

// Options for dropdowns
const MEAT_OPTIONS: {
  value: MeatPreference;
  label: string;
  description: string;
}[] = [
  {
    value: 'all',
    label: 'Everyone eats meat',
    description: 'No substitutions needed',
  },
  {
    value: 'split',
    label: 'Split portions',
    description: '50% meat, 50% vegetarian',
  },
  {
    value: 'none',
    label: 'Vegetarian',
    description: 'Use alternatives for all',
  },
];

const MINCED_MEAT_OPTIONS: {
  value: MincedMeatPreference;
  label: string;
  description: string;
}[] = [
  { value: 'meat', label: 'Regular mince', description: 'Beef, pork, etc.' },
  { value: 'soy', label: 'Soy mince', description: 'Always use soy-based' },
  { value: 'split', label: 'Split portions', description: '50% meat, 50% soy' },
];

const DAIRY_OPTIONS: {
  value: DairyPreference;
  label: string;
  description: string;
}[] = [
  { value: 'regular', label: 'Regular dairy', description: 'No restrictions' },
  {
    value: 'lactose_free',
    label: 'Lactose-free',
    description: 'Prefer lactose-free alternatives',
  },
  {
    value: 'dairy_free',
    label: 'Dairy-free',
    description: 'No dairy products',
  },
];

// Section header component
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
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
          backgroundColor: colors.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.text.muted,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// Radio button group component
function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
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
                  color: colors.text.primary,
                }}
              >
                {option.label}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.text.muted }}>
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Default settings for new households
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

  const { data: remoteSettings, isLoading } = useHouseholdSettings(
    householdId ?? null,
  );
  const updateSettings = useUpdateHouseholdSettings();

  // Local state for editing
  const [settings, setSettings] = useState<HouseholdSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when remote settings load
  useEffect(() => {
    if (remoteSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...remoteSettings,
        dietary: {
          ...DEFAULT_SETTINGS.dietary,
          ...(remoteSettings.dietary ?? {}),
        },
        equipment: {
          ...DEFAULT_SETTINGS.equipment,
          ...(remoteSettings.equipment ?? {}),
        },
      });
    }
  }, [remoteSettings]);

  const handleSave = async () => {
    if (!householdId) return;

    try {
      await updateSettings.mutateAsync({ householdId, settings });
      setHasChanges(false);
      Alert.alert('Saved', 'Household settings updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save settings');
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

  const updateEquipment = <K extends keyof HouseholdSettings['equipment']>(
    key: K,
    value: HouseholdSettings['equipment'][K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      equipment: { ...prev.equipment, [key]: value },
    }));
    setHasChanges(true);
  };

  if (!householdId) {
    return (
      <GradientBackground>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>Invalid household ID</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          title: 'Household Settings',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                marginLeft: -4,
              }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
              <Text style={{ color: '#fff', fontSize: 17, marginLeft: 2 }}>
                Back
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              style={{ padding: 8, opacity: hasChanges ? 1 : 0.5 }}
            >
              {updateSettings.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}
                >
                  Save
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        >
          {/* General Settings */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="home"
              title="General"
              subtitle="Basic household information"
            />

            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                ...shadows.sm,
              }}
            >
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.text.muted,
                    marginBottom: spacing.xs,
                  }}
                >
                  Household Size
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() =>
                      settings.household_size > 1 &&
                      updateField('household_size', settings.household_size - 1)
                    }
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={colors.text.primary}
                    />
                  </Pressable>
                  <Text
                    style={{
                      fontSize: fontSize['2xl'],
                      fontWeight: fontWeight.bold,
                      color: colors.text.primary,
                      minWidth: 60,
                      textAlign: 'center',
                    }}
                  >
                    {settings.household_size}
                  </Text>
                  <Pressable
                    onPress={() =>
                      updateField('household_size', settings.household_size + 1)
                    }
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={colors.text.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.text.muted,
                    marginBottom: spacing.xs,
                  }}
                >
                  Default Servings
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
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={colors.text.primary}
                    />
                  </Pressable>
                  <Text
                    style={{
                      fontSize: fontSize['2xl'],
                      fontWeight: fontWeight.bold,
                      color: colors.text.primary,
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
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: pressed ? colors.bgDark : colors.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={colors.text.primary}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Dietary Preferences */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="nutrition"
              title="Dietary Preferences"
              subtitle="Configure how recipes should be adapted"
            />

            <View
              style={{
                backgroundColor: colors.white,
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
                      color: colors.text.primary,
                    }}
                  >
                    Seafood
                  </Text>
                  <Text
                    style={{ fontSize: fontSize.sm, color: colors.text.muted }}
                  >
                    Household eats fish and shellfish
                  </Text>
                </View>
                <Switch
                  value={settings.dietary.seafood_ok}
                  onValueChange={(value) => updateDietary('seafood_ok', value)}
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
              Meat Dishes
            </Text>
            <View style={{ marginBottom: spacing.lg }}>
              <RadioGroup
                options={MEAT_OPTIONS}
                value={settings.dietary.meat}
                onChange={(value) => updateDietary('meat', value)}
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
                    color: colors.text.muted,
                    marginBottom: spacing.sm,
                  }}
                >
                  Chicken Alternative (e.g., Quorn)
                </Text>
                <TextInput
                  value={settings.dietary.chicken_alternative ?? ''}
                  onChangeText={(value) =>
                    updateDietary('chicken_alternative', value || null)
                  }
                  placeholder="e.g., Quorn"
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    fontSize: fontSize.md,
                    color: colors.text.primary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.text.muted,
                    marginTop: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                >
                  Other Meat Alternative (e.g., Oumph)
                </Text>
                <TextInput
                  value={settings.dietary.meat_alternative ?? ''}
                  onChangeText={(value) =>
                    updateDietary('meat_alternative', value || null)
                  }
                  placeholder="e.g., Oumph"
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    fontSize: fontSize.md,
                    color: colors.text.primary,
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
              Minced Meat
            </Text>
            <View style={{ marginBottom: spacing.lg }}>
              <RadioGroup
                options={MINCED_MEAT_OPTIONS}
                value={settings.dietary.minced_meat}
                onChange={(value) => updateDietary('minced_meat', value)}
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
              Dairy
            </Text>
            <RadioGroup
              options={DAIRY_OPTIONS}
              value={settings.dietary.dairy}
              onChange={(value) => updateDietary('dairy', value)}
            />
          </View>

          {/* Equipment */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="hardware-chip"
              title="Kitchen Equipment"
              subtitle="Available appliances for recipe optimization"
            />

            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                ...shadows.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      fontWeight: fontWeight.medium,
                      color: colors.text.primary,
                    }}
                  >
                    Airfryer
                  </Text>
                  <Text
                    style={{ fontSize: fontSize.sm, color: colors.text.muted }}
                  >
                    Enable airfryer instructions
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.airfryer}
                  onValueChange={(value) => updateEquipment('airfryer', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              {settings.equipment.airfryer && (
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
                      color: colors.text.muted,
                      marginBottom: spacing.sm,
                    }}
                  >
                    Model (optional)
                  </Text>
                  <TextInput
                    value={settings.equipment.airfryer_model ?? ''}
                    onChangeText={(value) =>
                      updateEquipment('airfryer_model', value || null)
                    }
                    placeholder="e.g., Xiaomi Smart Air Fryer"
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      fontSize: fontSize.md,
                      color: colors.text.primary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      fontWeight: fontWeight.medium,
                      color: colors.text.primary,
                    }}
                  >
                    Convection Oven
                  </Text>
                  <Text
                    style={{ fontSize: fontSize.sm, color: colors.text.muted }}
                  >
                    Oven has hot air/fan mode
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.convection_oven}
                  onValueChange={(value) =>
                    updateEquipment('convection_oven', value)
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

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
                      color: colors.text.primary,
                    }}
                  >
                    Grill Function
                  </Text>
                  <Text
                    style={{ fontSize: fontSize.sm, color: colors.text.muted }}
                  >
                    Oven has broil/grill element
                  </Text>
                </View>
                <Switch
                  value={settings.equipment.grill_function}
                  onValueChange={(value) =>
                    updateEquipment('grill_function', value)
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </GradientBackground>
  );
}
