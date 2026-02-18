import {
  RadioGroup,
  SectionLabel,
  SettingToggleRow,
  SurfaceCard,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';
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
      <SurfaceCard radius="lg" style={{ marginBottom: spacing.md }}>
        <SettingToggleRow
          label={t('householdSettings.dietary.seafood')}
          subtitle={t('householdSettings.dietary.seafoodDesc')}
          value={dietary.seafood_ok}
          onValueChange={(value) => onUpdateDietary('seafood_ok', value)}
          disabled={!canEdit}
        />
      </SurfaceCard>

      {/* Dairy Preference */}
      <SectionLabel text={t('householdSettings.dietary.dairy')} />
      <RadioGroup
        options={dairyOptions}
        value={dietary.dairy}
        onChange={(value) => onUpdateDietary('dairy', value)}
        disabled={!canEdit}
      />
    </>
  );
};
