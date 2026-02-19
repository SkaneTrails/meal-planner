import { Image } from 'expo-image';
import { useMemo } from 'react';
import { View } from 'react-native';
import { DropdownPicker } from '@/components/DropdownPicker';
import { type AppLanguage, LANGUAGES } from '@/lib/settings-context';
import { iconContainer, spacing, useTheme } from '@/lib/theme';

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

  const options = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        value: lang.code,
        label: lang.label,
        adornment: (
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
        ),
      })),
    [colors.gray[200], circleStyle],
  );

  return (
    <DropdownPicker
      options={options}
      value={currentLanguage}
      onSelect={onChangeLanguage}
      testID="language-picker"
    />
  );
};
