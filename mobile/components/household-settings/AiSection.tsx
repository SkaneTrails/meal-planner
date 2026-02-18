import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { RadioGroup, StepperControl } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { HouseholdSettings, MincedMeatPreference } from '@/lib/types';
import { EQUIPMENT_CATEGORIES } from './constants';

interface AiSectionProps {
  dietary: HouseholdSettings['dietary'];
  defaultServings: number;
  equipment: string[];
  canEdit: boolean;
  onUpdateDietary: <K extends keyof HouseholdSettings['dietary']>(
    key: K,
    value: HouseholdSettings['dietary'][K],
  ) => void;
  onToggleEquipment: (key: string) => void;
}

export const AiSection = ({
  dietary,
  defaultServings,
  equipment,
  canEdit,
  onUpdateDietary,
  onToggleEquipment,
}: AiSectionProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  const meatPortions = Math.min(
    dietary.meat_portions ?? defaultServings,
    defaultServings,
  );

  const handleMeatPortionsChange = (delta: number) => {
    const next = Math.max(0, Math.min(defaultServings, meatPortions + delta));
    onUpdateDietary('meat_portions', next);
    if (next === 0) {
      onUpdateDietary('meat', 'none');
    } else if (next >= defaultServings) {
      onUpdateDietary('meat', 'all');
    } else {
      onUpdateDietary('meat', 'split');
    }
  };

  const mincedMeatOptions: {
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

  const disabledByAi = !canEdit;

  return (
    <>
      {/* Meat Portions Stepper */}
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.text.muted,
          marginBottom: spacing.sm,
          textTransform: 'uppercase' as const,
        }}
      >
        {t('householdSettings.dietary.meatDishes')}
      </Text>
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
            fontSize: fontSize.sm,
            color: colors.content.strong,
            marginBottom: spacing.md,
          }}
        >
          {t('householdSettings.dietary.meatPortionsDesc')}
        </Text>
        <StepperControl
          value={meatPortions}
          onDecrement={() => handleMeatPortionsChange(-1)}
          onIncrement={() => handleMeatPortionsChange(1)}
          decrementDisabled={disabledByAi || meatPortions <= 0}
          incrementDisabled={disabledByAi || meatPortions >= defaultServings}
          subtitle={t('householdSettings.dietary.portionsOf', {
            total: defaultServings,
          })}
        />
        {meatPortions === 0 && (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.subtitle,
              textAlign: 'center',
              marginTop: spacing.sm,
              fontStyle: 'italic',
            }}
          >
            {t('householdSettings.dietary.meatNoneHint')}
          </Text>
        )}
      </View>

      {/* Meat Alternatives (shown when not all meat) */}
      {meatPortions < defaultServings && (
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
              color: colors.content.strong,
              marginBottom: spacing.sm,
            }}
          >
            {t('householdSettings.dietary.chickenAlt')}
          </Text>
          <TextInput
            value={dietary.chicken_alternative ?? ''}
            onChangeText={(value) =>
              onUpdateDietary('chicken_alternative', value || null)
            }
            editable={!disabledByAi}
            placeholder={t('householdSettings.dietary.chickenAltPlaceholder')}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              fontSize: fontSize.md,
              color: colors.content.body,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.strong,
              marginTop: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            {t('householdSettings.dietary.meatAlt')}
          </Text>
          <TextInput
            value={dietary.meat_alternative ?? ''}
            onChangeText={(value) =>
              onUpdateDietary('meat_alternative', value || null)
            }
            editable={!disabledByAi}
            placeholder={t('householdSettings.dietary.meatAltPlaceholder')}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              fontSize: fontSize.md,
              color: colors.content.body,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>
      )}

      {/* Minced Meat Preference */}
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.text.muted,
          marginBottom: spacing.sm,
          textTransform: 'uppercase' as const,
        }}
      >
        {t('householdSettings.dietary.mincedMeat')}
      </Text>
      <View style={{ marginBottom: spacing.lg }}>
        <RadioGroup
          options={mincedMeatOptions}
          value={dietary.minced_meat}
          onChange={(value) => onUpdateDietary('minced_meat', value)}
          disabled={disabledByAi}
        />
      </View>

      {/* Equipment */}
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.text.muted,
          marginBottom: spacing.sm,
          textTransform: 'uppercase' as const,
        }}
      >
        {t('householdSettings.equipment.title')}
      </Text>
      <SelectedEquipment
        equipment={equipment}
        canEdit={!disabledByAi}
        onToggle={onToggleEquipment}
      />
      <AvailableEquipment
        equipment={equipment}
        canEdit={!disabledByAi}
        onToggle={onToggleEquipment}
      />
    </>
  );
};

const SelectedEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  if (equipment.length === 0) return null;

  return (
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
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {t('householdSettings.equipment.yourEquipment', {
          count: equipment.length,
        })}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing['xs-sm'],
        }}
      >
        {equipment.map((item) => (
          <Pressable
            key={item}
            onPress={() => canEdit && onToggle(item)}
            disabled={!canEdit}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.errorBg : colors.bgDark,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              gap: 4,
            })}
          >
            <Text style={{ fontSize: fontSize.sm, color: colors.content.body }}>
              {t(`householdSettings.equipment.items.${item}`)}
            </Text>
            {canEdit && (
              <Ionicons
                name="close-circle"
                size={14}
                color={colors.content.subtitle}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const AvailableEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
      }}
    >
      {EQUIPMENT_CATEGORIES.map(({ key, items }) => {
        const available = items.filter((item) => !equipment.includes(item));
        if (available.length === 0) return null;
        return (
          <View key={key} style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.content.strong,
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
                gap: spacing['xs-sm'],
              }}
            >
              {available.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => canEdit && onToggle(item)}
                  disabled={!canEdit}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.successBg : 'transparent',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.surface.borderLight,
                    borderStyle: 'dashed',
                    gap: 4,
                  })}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={colors.content.strong}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.content.strong,
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
  );
};
