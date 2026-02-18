import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { SurfaceCard } from '@/components';
import { type AppLanguage, LANGUAGES } from '@/lib/settings-context';
import { fontSize, iconContainer, spacing, useTheme } from '@/lib/theme';

const FLAG_URLS: Record<AppLanguage, string> = {
  en: 'https://flagcdn.com/w80/gb.png',
  sv: 'https://flagcdn.com/w80/se.png',
  it: 'https://flagcdn.com/w80/it.png',
};

interface LanguagePickerProps {
  currentLanguage: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
}

export const LanguagePicker = ({
  currentLanguage,
  onChangeLanguage,
}: LanguagePickerProps) => {
  const { colors, circleStyle } = useTheme();

  return (
    <SurfaceCard style={{ overflow: 'hidden' }} padding={0}>
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
    </SurfaceCard>
  );
};
