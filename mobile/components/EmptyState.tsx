import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import {
  fontSize,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';
import { Button } from './Button';
import { IconCircle } from './IconCircle';

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
  const { colors, fonts, borderRadius } = useTheme();
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
        <IconCircle
          size="2xl"
          bg={colors.glass.card}
          style={{ marginBottom: spacing.xl }}
        >
          <Ionicons name={icon} size={36} color={colors.text.inverse} />
        </IconCircle>
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
        <Button
          variant="primary"
          label={action.label}
          onPress={action.onPress}
          style={{
            marginTop: spacing['2xl'],
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing.md,
            borderRadius: borderRadius.sm,
          }}
        />
      )}
    </View>
  );
};

export { EmptyState };
export type { EmptyStateProps, EmptyStateAction };
