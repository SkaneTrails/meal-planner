import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  AnimatedPressable,
  IconCircle,
  SectionHeader,
  SurfaceCard,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  fontSize,
  fontWeight,
  settingsSubtitleStyle,
  settingsTitleStyle,
  spacing,
  useTheme,
} from '@/lib/theme';

interface AccountSectionProps {
  userEmail: string | null | undefined;
  displayName: string | null | undefined;
  onSignOut: () => void;
}

export const AccountSection = ({
  userEmail,
  displayName,
  onSignOut,
}: AccountSectionProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="person-circle"
        title={t('settings.account')}
        subtitle={userEmail || 'Email unavailable'}
      />

      <SurfaceCard style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircle
            size="lg"
            bg={colors.bgDark}
            style={{ marginRight: spacing.md }}
          >
            <Text
              style={{
                fontSize: fontSize['3xl'],
                fontWeight: fontWeight.semibold,
                color: colors.content.body,
              }}
            >
              {userEmail?.[0]?.toUpperCase() || '?'}
            </Text>
          </IconCircle>
          <View style={{ flex: 1 }}>
            <Text style={settingsTitleStyle}>
              {displayName || userEmail?.split('@')[0] || 'User'}
            </Text>
            <Text
              style={{
                ...settingsSubtitleStyle,
                marginTop: 2,
              }}
            >
              {userEmail}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <AnimatedPressable
        onPress={onSignOut}
        hoverScale={1.02}
        pressScale={0.97}
        style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text
          style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
            color: colors.danger,
            marginLeft: spacing.sm,
          }}
        >
          {t('settings.signOut')}
        </Text>
      </AnimatedPressable>
    </View>
  );
};

interface HouseholdSettingsLinkProps {
  householdId: string | null | undefined;
  isLoading: boolean;
  onPress: () => void;
}

export const HouseholdSettingsLink = ({
  householdId,
  isLoading,
  onPress,
}: HouseholdSettingsLinkProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="people"
        title={t('settings.householdInfo')}
        subtitle={t('settings.householdSettingsDesc')}
      />

      <AnimatedPressable
        onPress={onPress}
        disabled={isLoading || !householdId}
        hoverScale={1.02}
        pressScale={0.97}
        disableAnimation={isLoading || !householdId}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          opacity: isLoading ? 0.6 : householdId ? 1 : 0.5,
          ...shadows.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={settingsTitleStyle}>
            {t('settings.householdSettings')}
          </Text>
          <Text
            style={{
              ...settingsSubtitleStyle,
              marginTop: 4,
            }}
          >
            {isLoading
              ? t('settings.loadingHousehold')
              : householdId
                ? t('settings.householdSettingsDesc')
                : t('settings.noHousehold')}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.content.strong} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.content.strong}
          />
        )}
      </AnimatedPressable>
    </View>
  );
};
