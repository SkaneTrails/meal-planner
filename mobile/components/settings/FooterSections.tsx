import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AnimatedPressable, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

interface AdminSectionProps {
  onNavigateToAdmin: () => void;
}

export const AdminSection = ({ onNavigateToAdmin }: AdminSectionProps) => {
  const { colors, styles: themeStyles } = useTheme();
  const { t } = useTranslation();

  return (
    <AnimatedPressable
      onPress={onNavigateToAdmin}
      hoverScale={1.02}
      pressScale={0.97}
      style={{ marginBottom: spacing['2xl'] }}
    >
      <SurfaceCard
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={themeStyles.settingsTitleStyle}>
            {t('settings.adminDashboard')}
          </Text>
          <Text
            style={{
              ...themeStyles.settingsSubtitleStyle,
              marginTop: 4,
            }}
          >
            {t('settings.adminDashboardDesc')}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.content.strong}
        />
      </SurfaceCard>
    </AnimatedPressable>
  );
};

export const AboutSection = () => {
  const { colors, styles: themeStyles } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard style={{ marginBottom: spacing['2xl'] }}>
      <Text
        style={{
          ...themeStyles.settingsTitleStyle,
          fontWeight: '700',
          color: colors.content.heading,
          marginBottom: spacing.md,
        }}
      >
        {t('settings.about')}
      </Text>
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
            fontWeight: '500',
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
    </SurfaceCard>
  );
};
