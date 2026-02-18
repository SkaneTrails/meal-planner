import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AnimatedPressable, Section, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  fontWeight,
  settingsSubtitleStyle,
  settingsTitleStyle,
  spacing,
  useTheme,
} from '@/lib/theme';

interface AdminSectionProps {
  onNavigateToAdmin: () => void;
}

export const AdminSection = ({ onNavigateToAdmin }: AdminSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="shield-checkmark"
      title={t('settings.adminSection')}
      subtitle={t('settings.adminSectionDesc')}
      spacing={spacing['2xl']}
    >
      <AnimatedPressable
        onPress={onNavigateToAdmin}
        hoverScale={1.02}
        pressScale={0.97}
      >
        <SurfaceCard
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={settingsTitleStyle}>
              {t('settings.adminDashboard')}
            </Text>
            <Text
              style={{
                ...settingsSubtitleStyle,
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
    </Section>
  );
};

export const AboutSection = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="information-circle"
      title={t('settings.about')}
      subtitle={t('settings.aboutDesc')}
      spacing={spacing['2xl']}
    >
      <SurfaceCard>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ ...settingsTitleStyle, color: colors.content.strong }}>
            {t('settings.version')}
          </Text>
          <Text
            style={{
              ...settingsTitleStyle,
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
          <Text style={{ ...settingsTitleStyle, color: colors.content.strong }}>
            {t('settings.madeWith')}
          </Text>
          <Text style={settingsTitleStyle}>❤️</Text>
        </View>
      </SurfaceCard>
    </Section>
  );
};
