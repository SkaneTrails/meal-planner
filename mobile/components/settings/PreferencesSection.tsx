import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';
import { SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import {
  borderRadius,
  colors,
  settingsSubtitleStyle,
  settingsTitleStyle,
  shadows,
  spacing,
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

      <View
        style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          ...shadows.sm,
        }}
      >
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
          <Switch
            value={showHiddenRecipes}
            onValueChange={onToggle}
            trackColor={{ false: colors.bgDark, true: colors.accent + '80' }}
            thumbColor={showHiddenRecipes ? colors.accent : colors.bgMid}
          />
        </View>
      </View>
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
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="calendar"
        title={t('settings.weekStart')}
        subtitle={t('settings.weekStartDesc')}
      />

      <View
        style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          ...shadows.sm,
        }}
      >
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
      </View>
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
