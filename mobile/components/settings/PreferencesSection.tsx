import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Switch, Text, View } from 'react-native';
import { SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { type AppLanguage, LANGUAGES } from '@/lib/settings-context';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';

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
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.medium,
                color: colors.text.dark,
              }}
            >
              {t('settings.showHiddenRecipes')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.text.dark + '80',
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
              borderBottomColor: 'rgba(93, 78, 64, 0.15)',
            })}
          >
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.md,
                color: colors.text.dark,
              }}
            >
              {t(
                day === 'monday'
                  ? 'settings.weekStartMonday'
                  : 'settings.weekStartSaturday',
              )}
            </Text>
            {weekStart === day && (
              <Ionicons name="checkmark-circle" size={20} color="#6B8E6B" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const FLAG_URLS: Record<AppLanguage, string> = {
  en: 'https://flagcdn.com/w80/gb.png',
  sv: 'https://flagcdn.com/w80/se.png',
  it: 'https://flagcdn.com/w80/it.png',
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
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...shadows.sm,
      }}
    >
      {LANGUAGES.map((lang, index) => (
        <Pressable
          key={lang.code}
          onPress={() => onChangeLanguage(lang.code)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: pressed ? colors.bgMid : 'transparent',
            borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(93, 78, 64, 0.15)',
          })}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: spacing.md,
              backgroundColor: '#E8E8E8',
            }}
          >
            <Image
              source={{ uri: FLAG_URLS[lang.code] }}
              style={{ width: 32, height: 32 }}
              contentFit="cover"
            />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.text.dark,
            }}
          >
            {lang.label}
          </Text>
          {currentLanguage === lang.code && (
            <Ionicons name="checkmark-circle" size={20} color="#6B8E6B" />
          )}
        </Pressable>
      ))}
    </View>
  );
};
