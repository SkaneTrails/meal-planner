import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Switch, Text, View } from 'react-native';
import { SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { type AppLanguage, LANGUAGES } from '@/lib/settings-context';
import {
  borderRadius,
  circleStyle,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
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
                color: colors.content.body,
              }}
            >
              {t('settings.showHiddenRecipes')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.content.strong,
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
                fontSize: fontSize.md,
                color: colors.content.body,
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
            borderBottomColor: colors.surface.pressed,
          })}
        >
          <View
            style={{
              ...circleStyle(iconContainer.sm),
              overflow: 'hidden',
              marginRight: spacing.md,
              backgroundColor: colors.gray[200],
            }}
          >
            <Image
              source={{ uri: FLAG_URLS[lang.code] }}
              style={{ width: iconContainer.sm, height: iconContainer.sm }}
              contentFit="cover"
            />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.content.body,
            }}
          >
            {lang.label}
          </Text>
          {currentLanguage === lang.code && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.ai.primary}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
};
