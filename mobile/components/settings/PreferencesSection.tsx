import { useMemo } from 'react';
import { Section, SettingToggleRow, SurfaceCard } from '@/components';
import { DropdownPicker } from '@/components/DropdownPicker';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import { spacing } from '@/lib/theme';
import { WEEK_DAYS, type WeekStart } from '@/lib/utils/dateFormatter';
import { LanguagePicker } from './LanguagePicker';

interface RecipeLibrarySectionProps {
  showHiddenRecipes: boolean;
  onToggle: () => void;
}

export const RecipeLibrarySection = ({
  showHiddenRecipes,
  onToggle,
}: RecipeLibrarySectionProps) => {
  const { t } = useTranslation();

  return (
    <Section
      icon="book"
      title={t('settings.recipeLibrary')}
      subtitle={t('settings.recipeLibraryDesc')}
      spacing={spacing['2xl']}
    >
      <SurfaceCard>
        <SettingToggleRow
          label={t('settings.showHiddenRecipes')}
          subtitle={t('settings.showHiddenRecipesDesc')}
          value={showHiddenRecipes}
          onValueChange={onToggle}
        />
      </SurfaceCard>
    </Section>
  );
};

const WEEKDAY_I18N_KEY: Record<WeekStart, string> = {
  sunday: 'settings.weekStartSunday',
  monday: 'settings.weekStartMonday',
  tuesday: 'settings.weekStartTuesday',
  wednesday: 'settings.weekStartWednesday',
  thursday: 'settings.weekStartThursday',
  friday: 'settings.weekStartFriday',
  saturday: 'settings.weekStartSaturday',
};

interface WeekStartSectionProps {
  weekStart: WeekStart;
  onSetWeekStart: (day: WeekStart) => void;
}

export const WeekStartSection = ({
  weekStart,
  onSetWeekStart,
}: WeekStartSectionProps) => {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      WEEK_DAYS.map((day) => ({
        value: day,
        label: t(WEEKDAY_I18N_KEY[day]),
      })),
    [t],
  );

  return (
    <Section
      icon="calendar"
      title={t('settings.weekStart')}
      subtitle={t('settings.weekStartDesc')}
      spacing={spacing['2xl']}
    >
      <DropdownPicker
        options={options}
        value={weekStart}
        onSelect={onSetWeekStart}
        testID="week-start-picker"
      />
    </Section>
  );
};

interface LanguageSectionProps {
  currentLanguage: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
}

export const LanguageSection = ({
  currentLanguage,
  onChangeLanguage,
}: LanguageSectionProps) => {
  return (
    <LanguagePicker
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    />
  );
};
