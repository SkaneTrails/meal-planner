import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SectionHeader, SurfaceCard, ThemeToggle } from '@/components';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import {
  settingsSubtitleStyle,
  settingsTitleStyle,
  spacing,
  useTheme,
} from '@/lib/theme';
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
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="book"
        title={t('settings.recipeLibrary')}
        subtitle={t('settings.recipeLibraryDesc')}
      />

      <SurfaceCard>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={settingsTitleStyle}>
              {t('settings.showHiddenRecipes')}
            </Text>
            <Text
              style={{
                ...settingsSubtitleStyle,
                marginTop: 4,
              }}
            >
              {t('settings.showHiddenRecipesDesc')}
            </Text>
          </View>
          <ThemeToggle value={showHiddenRecipes} onValueChange={onToggle} />
        </View>
      </SurfaceCard>
    </View>
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
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="calendar"
        title={t('settings.weekStart')}
        subtitle={t('settings.weekStartDesc')}
      />

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
    </View>
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
