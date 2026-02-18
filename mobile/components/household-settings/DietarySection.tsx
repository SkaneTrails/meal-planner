import { Text, View } from 'react-native';
import { RadioGroup, ThemeToggle } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { DairyPreference, HouseholdSettings } from '@/lib/types';

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
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

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
    <>
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
                color: colors.content.body,
              }}
            >
              {t('householdSettings.dietary.seafood')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.content.strong,
              }}
            >
              {t('householdSettings.dietary.seafoodDesc')}
            </Text>
          </View>
          <ThemeToggle
            value={dietary.seafood_ok}
            onValueChange={(value) => onUpdateDietary('seafood_ok', value)}
            disabled={!canEdit}
          />
        </View>
      </View>

      {/* Dairy Preference */}
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.text.muted,
          marginBottom: spacing.sm,
          textTransform: 'uppercase' as const,
        }}
      >
        {t('householdSettings.dietary.dairy')}
      </Text>
      <RadioGroup
        options={dairyOptions}
        value={dietary.dairy}
        onChange={(value) => onUpdateDietary('dairy', value)}
        disabled={!canEdit}
      />
    </>
  );
};
