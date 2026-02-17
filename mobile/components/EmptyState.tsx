import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import {
  borderRadius,
  fontSize,
  iconContainer,
  letterSpacing,
  lineHeight,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: IoniconsName;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
  style?: ViewStyle;
}

const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
  style,
}: EmptyStateProps) => {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          paddingVertical: spacing['4xl'] * 2,
          paddingHorizontal: spacing['3xl'],
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: iconContainer['2xl'],
            height: iconContainer['2xl'],
            borderRadius: iconContainer['2xl'] / 2,
            backgroundColor: colors.glass.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <Ionicons name={icon} size={36} color={colors.text.inverse} />
        </View>
      )}
      <Text
        style={{
          color: colors.text.inverse,
          fontSize: fontSize['3xl'],
          fontFamily: fonts.bodySemibold,
          textAlign: 'center',
          letterSpacing: letterSpacing.normal,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: colors.gray[600],
            fontSize: fontSize.lg,
            fontFamily: fonts.body,
            marginTop: spacing.sm,
            textAlign: 'center',
            lineHeight: lineHeight.lg,
          }}
        >
          {subtitle}
        </Text>
      )}
      {action && (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => ({
            marginTop: spacing['2xl'],
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.sm,
            ...shadows.lg,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export { EmptyState };
export type { EmptyStateProps, EmptyStateAction };
