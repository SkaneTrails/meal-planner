import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { Section, SettingToggleRow, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import { settingsTitleStyle, spacing, useTheme } from '@/lib/theme';
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

interface WeekStartSectionProps {
  weekStart: 'monday' | 'saturday';
  onSetWeekStart: (day: 'monday' | 'saturday') => void;
}

export const WeekStartSection = ({
  weekStart,
  onSetWeekStart,
}: WeekStartSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="calendar"
      title={t('settings.weekStart')}
      subtitle={t('settings.weekStartDesc')}
      spacing={spacing['2xl']}
    >
      <SurfaceCard style={{ overflow: 'hidden' }} padding={0}>
        {(['monday', 'saturday'] as const).map((day, index) => (
          <Pressable
            key={day}
            onPress={() => onSetWeekStart(day)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              backgroundColor: pressed ? colors.bgMid : 'transparent',
              borderBottomWidth: index === 0 ? 1 : 0,
              borderBottomColor: colors.surface.pressed,
            })}
          >
            <Text
              style={{
                flex: 1,
                ...settingsTitleStyle,
              }}
            >
              {t(
                day === 'monday'
                  ? 'settings.weekStartMonday'
                  : 'settings.weekStartSaturday',
              )}
            </Text>
            {weekStart === day && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.ai.primary}
              />
            )}
          </Pressable>
        ))}
      </SurfaceCard>
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
