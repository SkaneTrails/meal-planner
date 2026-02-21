import { Text, View } from 'react-native';
import { SettingToggleRow, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { LanguagePicker } from './LanguagePicker';
import { ThemePicker } from './ThemePicker';

interface PersonalPreferencesSectionProps {
  showHiddenRecipes: boolean;
  onToggleShowHidden: () => void;
}

export const PersonalPreferencesSection = ({
  showHiddenRecipes,
  onToggleShowHidden,
}: PersonalPreferencesSectionProps) => {
  const { colors, themeName, setThemeName } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard style={{ marginBottom: spacing['2xl'] }}>
      <SettingToggleRow
        label={t('settings.showHiddenRecipes')}
        subtitle={t('settings.showHiddenRecipesDesc')}
        value={showHiddenRecipes}
        onValueChange={onToggleShowHidden}
      />

      <View style={{ marginTop: spacing.lg }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.content.strong,
            marginBottom: spacing.xs,
          }}
        >
          {t('settings.appearance')}
        </Text>
        <ThemePicker currentTheme={themeName} onChangeTheme={setThemeName} />
      </View>
    </SurfaceCard>
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
