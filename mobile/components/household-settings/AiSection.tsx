import { Text, TextInput, View } from 'react-native';
import {
  RadioGroup,
  SectionLabel,
  StepperControl,
  SurfaceCard,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { HouseholdSettings, MincedMeatPreference } from '@/lib/types';
import { AvailableEquipment, SelectedEquipment } from './EquipmentSection';

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
  const { colors, borderRadius } = useTheme();
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
      <SectionLabel text={t('householdSettings.dietary.meatDishes')} />
      <SurfaceCard radius="lg" style={{ marginBottom: spacing.md }}>
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
      </SurfaceCard>

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
              backgroundColor: colors.input.bg,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              fontSize: fontSize.md,
              color: colors.input.text,
              borderWidth: 1,
              borderColor: colors.input.border,
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
              backgroundColor: colors.input.bg,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              fontSize: fontSize.md,
              color: colors.input.text,
              borderWidth: 1,
              borderColor: colors.input.border,
            }}
          />
        </View>
      )}

      {/* Minced Meat Preference */}
      <SectionLabel text={t('householdSettings.dietary.mincedMeat')} />
      <View style={{ marginBottom: spacing.lg }}>
        <RadioGroup
          options={mincedMeatOptions}
          value={dietary.minced_meat}
          onChange={(value) => onUpdateDietary('minced_meat', value)}
          disabled={disabledByAi}
        />
      </View>

      {/* Equipment */}
      <SectionLabel text={t('householdSettings.equipment.title')} />
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
