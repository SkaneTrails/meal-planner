import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  AnimatedPressable,
  Button,
  IconCircle,
  Section,
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
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="person-circle"
      title={t('settings.account')}
      subtitle={userEmail || 'Email unavailable'}
      spacing={spacing['2xl']}
    >
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

      <Button
        variant="text"
        tone="warning"
        icon="log-out-outline"
        label={t('settings.signOut')}
        onPress={onSignOut}
        iconSize={20}
        style={{
          justifyContent: 'center',
        }}
      />
    </Section>
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
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isLoading || !householdId}
      hoverScale={1.02}
      pressScale={0.97}
      disableAnimation={isLoading || !householdId}
      style={{ marginBottom: spacing['2xl'] }}
    >
      <SurfaceCard
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          opacity: isLoading ? 0.6 : householdId ? 1 : 0.5,
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
      </SurfaceCard>
    </AnimatedPressable>
  );
};
