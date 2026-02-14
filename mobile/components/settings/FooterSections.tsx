import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AnimatedPressable, SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';

interface AdminSectionProps {
  onNavigateToAdmin: () => void;
}

export const AdminSection = ({ onNavigateToAdmin }: AdminSectionProps) => {
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="shield-checkmark"
        title={t('settings.adminSection')}
        subtitle={t('settings.adminSectionDesc')}
      />

      <AnimatedPressable
        onPress={onNavigateToAdmin}
        hoverScale={1.02}
        pressScale={0.97}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          ...shadows.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.dark }}>
            {t('settings.adminDashboard')}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.dark + '80', marginTop: 4 }}>
            {t('settings.adminDashboardDesc')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.dark + '80'} />
      </AnimatedPressable>
    </View>
  );
};

export const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="information-circle"
        title={t('settings.about')}
        subtitle={t('settings.aboutDesc')}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>
            {t('settings.version')}
          </Text>
          <Text
            style={{ fontSize: fontSize.md, color: colors.text.dark, fontWeight: fontWeight.medium }}
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
          <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>
            {t('settings.madeWith')}
          </Text>
          <Text style={{ fontSize: fontSize.md }}>❤️</Text>
        </View>
      </View>
    </View>
  );
};
