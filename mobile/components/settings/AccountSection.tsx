import { ActivityIndicator, Text, View } from 'react-native';
import {
  ActionButton,
  AnimatedPressable,
  IconCircle,
  Section,
} from '@/components';
import { type IoniconName, ThemeIcon } from '@/components/ThemeIcon';
import { useTranslation } from '@/lib/i18n';
import { fontSize, iconSize, spacing, useTheme } from '@/lib/theme';

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
  const { colors, styles: themeStyles, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <Section icon="person-circle" title={t('settings.account')} spacing={0}>
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
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <IconCircle
            size="lg"
            bg={colors.bgDark}
            style={{ marginRight: spacing.md }}
          >
            <Text
              style={{
                ...themeStyles.settingsTitleStyle,
                fontSize: fontSize['3xl'],
              }}
            >
              {userEmail?.[0]?.toUpperCase() || '?'}
            </Text>
          </IconCircle>
          <View style={{ flex: 1 }}>
            <Text style={themeStyles.settingsTitleStyle}>
              {displayName || userEmail?.split('@')[0] || 'User'}
            </Text>
            <Text
              style={{
                ...themeStyles.settingsSubtitleStyle,
                marginTop: 2,
              }}
            >
              {userEmail}
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: colors.surface.divider,
            marginBottom: spacing.md,
          }}
        />
        <ActionButton.SignOut
          label={t('settings.signOut')}
          onPress={onSignOut}
          style={{
            justifyContent: 'center',
          }}
        />
      </View>
    </Section>
  );
};

interface SettingsNavLinkProps {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
}

export const SettingsNavLink = ({
  icon,
  title,
  subtitle,
  disabled = false,
  isLoading = false,
  onPress,
}: SettingsNavLinkProps) => {
  const { colors, styles: themeStyles } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isLoading || disabled}
      hoverScale={1.01}
      pressScale={0.98}
      disableAnimation={isLoading || disabled}
      accessibilityRole="button"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          opacity: isLoading ? 0.6 : disabled ? 0.5 : 1,
        }}
      >
        <IconCircle
          size="sm"
          bg={colors.glass.faint}
          style={{ marginRight: spacing.md }}
        >
          <ThemeIcon
            name={icon}
            size={iconSize.sm}
            color={colors.content.body}
          />
        </IconCircle>
        <View style={{ flex: 1 }}>
          <Text style={themeStyles.settingsTitleStyle}>{title}</Text>
          {subtitle && (
            <Text
              style={{
                ...themeStyles.settingsSubtitleStyle,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.content.strong} />
        ) : (
          <ThemeIcon
            name="chevron-forward"
            size={iconSize.md}
            color={colors.content.subtitle}
          />
        )}
      </View>
    </AnimatedPressable>
  );
};
