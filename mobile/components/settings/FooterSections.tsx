import { Text, View } from 'react-native';
import { Section } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontWeight, spacing, useTheme } from '@/lib/theme';

export const AboutSection = () => {
  const { colors, styles: themeStyles, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <Section icon="information-circle" title={t('settings.about')} spacing={0}>
      <View
        style={{
          backgroundColor: colors.surface.subtle,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginTop: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              ...themeStyles.settingsTitleStyle,
              color: colors.content.strong,
            }}
          >
            {t('settings.version')}
          </Text>
          <Text
            style={{
              ...themeStyles.settingsTitleStyle,
              fontWeight: fontWeight.medium,
            }}
          >
            1.0.0
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...themeStyles.settingsTitleStyle,
              color: colors.content.strong,
            }}
          >
            {t('settings.madeWith')}
          </Text>
          <Text style={themeStyles.settingsTitleStyle}>❤️</Text>
        </View>
      </View>
    </Section>
  );
};
