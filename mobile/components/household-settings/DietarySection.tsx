import { Switch, Text, TextInput, View } from 'react-native';
import { RadioGroup, SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
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

interface DietarySectionProps {
  dietary: HouseholdSettings['dietary'];
  canEdit: boolean;
  onUpdateDietary: <K extends keyof HouseholdSettings['dietary']>(
    key: K,
    value: HouseholdSettings['dietary'][K],
  ) => void;
}

export const DietarySection = ({
  dietary,
  canEdit,
  onUpdateDietary,
}: DietarySectionProps) => {
  const { t } = useTranslation();

  const meatOptions: {
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

  const dairyOptions: {
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

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="nutrition"
        title={t('householdSettings.dietary.title')}
        subtitle={t('householdSettings.dietary.subtitle')}
      />

      {/* Seafood Toggle */}
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
            value={dietary.seafood_ok}
            onValueChange={(value) => onUpdateDietary('seafood_ok', value)}
            disabled={!canEdit}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Meat Preference */}
      <Text style={categoryLabelStyle}>
        {t('householdSettings.dietary.meatDishes')}
      </Text>
      <View style={{ marginBottom: spacing.lg }}>
        <RadioGroup
          options={meatOptions}
          value={dietary.meat}
          onChange={(value) => onUpdateDietary('meat', value)}
          disabled={!canEdit}
        />
      </View>

      {/* Meat Alternatives (shown when not "all") */}
      {dietary.meat !== 'all' && (
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
            value={dietary.chicken_alternative ?? ''}
            onChangeText={(value) =>
              onUpdateDietary('chicken_alternative', value || null)
            }
            editable={canEdit}
            placeholder={t('householdSettings.dietary.chickenAltPlaceholder')}
            style={textInputStyle}
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
            value={dietary.meat_alternative ?? ''}
            onChangeText={(value) =>
              onUpdateDietary('meat_alternative', value || null)
            }
            editable={canEdit}
            placeholder={t('householdSettings.dietary.meatAltPlaceholder')}
            style={textInputStyle}
          />
        </View>
      )}

      {/* Minced Meat Preference */}
      <Text style={categoryLabelStyle}>
        {t('householdSettings.dietary.mincedMeat')}
      </Text>
      <View style={{ marginBottom: spacing.lg }}>
        <RadioGroup
          options={mincedMeatOptions}
          value={dietary.minced_meat}
          onChange={(value) => onUpdateDietary('minced_meat', value)}
          disabled={!canEdit}
        />
      </View>

      {/* Dairy Preference */}
      <Text style={categoryLabelStyle}>
        {t('householdSettings.dietary.dairy')}
      </Text>
      <RadioGroup
        options={dairyOptions}
        value={dietary.dairy}
        onChange={(value) => onUpdateDietary('dairy', value)}
        disabled={!canEdit}
      />
    </View>
  );
};

const categoryLabelStyle = {
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  color: colors.text.muted,
  marginBottom: spacing.sm,
  textTransform: 'uppercase' as const,
};

const textInputStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  fontSize: fontSize.md,
  color: colors.text.inverse,
  borderWidth: 1,
  borderColor: colors.border,
};
