/**
 * Full-screen loading spinner or message state.
 * Wraps GradientBackground with centered content for loading, error, and info screens.
 *
 * Usage:
 *   <FullScreenLoading />                          — spinner
 *   <FullScreenLoading icon="lock-closed" ... />   — message with icon
 */

import type { ReactNode } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { GradientBackground } from '@/components/GradientBackground';
import { type IoniconName, ThemeIcon } from '@/components/ThemeIcon';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  fontSize,
  iconContainer,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

interface FullScreenLoadingProps {
  /** GradientBackground visual mode (default: 'default') */
  background?: 'default' | 'animated';
  /** Ionicons name — shows icon instead of spinner */
  icon?: IoniconName;
  /** Primary message text */
  title?: string;
  /** Secondary message text */
  subtitle?: string;
  /** Extra content rendered below the main content (e.g., action buttons) */
  children?: ReactNode;
}

const bgVariant = (bg: FullScreenLoadingProps['background']) => ({
  animated: bg === 'animated',
});

export const FullScreenLoading = ({
  background = 'default',
  icon,
  title,
  subtitle,
  children,
}: FullScreenLoadingProps) => {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const isMessage = Boolean(icon || title);

  const effectiveBg = isMessage ? background : 'animated';

  return (
    <GradientBackground {...bgVariant(effectiveBg)} style={styles.container}>
      {isMessage ? (
        <View style={styles.content}>
          {icon && (
            <ThemeIcon name={icon} size={64} color={colors.text.muted} />
          )}
          {title && (
            <Text
              style={[
                styles.title,
                { color: colors.text.muted, fontFamily: fonts.bodySemibold },
                icon && { marginTop: spacing.lg },
              ]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.muted, fontFamily: fonts.body },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.card.bg,
                borderColor: colors.card.borderColor,
              },
            ]}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.appIcon}
            />
          </View>
          <Text
            style={[
              styles.appName,
              { color: colors.text.primary, fontFamily: fonts.displayBold },
            ]}
          >
            {t('signIn.appName')}
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.text.muted}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      )}
      {children}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  iconBox: {
    width: iconContainer['2xl'],
    height: iconContainer['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  appName: {
    fontSize: fontSize['2xl'],
    letterSpacing: letterSpacing.wide,
    textAlign: 'center',
  },
});
