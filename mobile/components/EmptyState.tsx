import { Text, View, type ViewStyle } from 'react-native';
import {
  fontSize,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';
import { Button } from './Button';
import { ContentCard } from './ContentCard';
import { IconCircle } from './IconCircle';
import { type IoniconName, ThemeIcon } from './ThemeIcon';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
  /** Full-page layout (default) or card-wrapped compact layout for settings. */
  variant?: 'default' | 'compact';
  style?: ViewStyle;
}

const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
  variant = 'default',
  style,
}: EmptyStateProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  if (variant === 'compact') {
    return (
      <ContentCard
        variant="surface"
        style={{ alignItems: 'center' as const, ...style }}
      >
        {icon && (
          <IconCircle
            size="lg"
            bg={colors.bgDark}
            style={{ marginBottom: spacing.sm }}
          >
            <ThemeIcon name={icon} size={24} color={colors.content.body} />
          </IconCircle>
        )}
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fonts.bodySemibold,
            color: colors.content.heading,
            marginBottom: spacing['2xs'],
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              color: colors.content.icon,
              textAlign: 'center',
            }}
          >
            {subtitle}
          </Text>
        )}
      </ContentCard>
    );
  }

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
          <ThemeIcon name={icon} size={36} color={colors.text.inverse} />
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
