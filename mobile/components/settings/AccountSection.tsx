import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
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
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="person-circle"
        title={t('settings.account')}
        subtitle={userEmail || 'Email unavailable'}
      />

      <View
        style={{
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing.md,
          ...shadows.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.bgDark,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: colors.text.dark,
              }}
            >
              {userEmail?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.dark,
              }}
            >
              {displayName || userEmail?.split('@')[0] || 'User'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.text.dark + '80',
                marginTop: 2,
              }}
            >
              {userEmail}
            </Text>
          </View>
        </View>
      </View>

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
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text
          style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
            color: '#DC2626',
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
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: colors.text.dark }}
          >
            {t('settings.householdSettings')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.text.dark + '80',
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
          <ActivityIndicator size="small" color={colors.text.dark + '80'} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.dark + '80'}
          />
        )}
      </AnimatedPressable>
    </View>
  );
};
