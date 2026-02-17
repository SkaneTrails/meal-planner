/**
 * Full-screen loading spinner or message state.
 * Wraps GradientBackground with centered content for loading, error, and info screens.
 *
 * Usage:
 *   <FullScreenLoading background="muted" />                          — spinner
 *   <FullScreenLoading background="muted" icon="lock-closed" ... />   — message with icon
 */

import type { Ionicons as IoniconsType } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GradientBackground } from '@/components/GradientBackground';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface FullScreenLoadingProps {
  /** GradientBackground visual mode (default: 'default') */
  background?: 'default' | 'muted' | 'animated';
  /** Ionicons name — shows icon instead of spinner */
  icon?: ComponentProps<typeof IoniconsType>['name'];
  /** Primary message text */
  title?: string;
  /** Secondary message text */
  subtitle?: string;
  /** Extra content rendered below the main content (e.g., action buttons) */
  children?: ReactNode;
}

const bgVariant = (bg: FullScreenLoadingProps['background']) => ({
  muted: bg === 'muted',
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
  const isMessage = Boolean(icon || title);

  return (
    <GradientBackground {...bgVariant(background)} style={styles.container}>
      {isMessage ? (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={64} color={colors.text.muted} />}
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
        <ActivityIndicator size="large" color={colors.primary} />
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
});
