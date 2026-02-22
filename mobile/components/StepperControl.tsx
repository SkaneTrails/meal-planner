import { Text, View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

interface StepperControlProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  subtitle?: string;
}

export const StepperControl = ({
  value,
  onDecrement,
  onIncrement,
  decrementDisabled = false,
  incrementDisabled = false,
  subtitle,
}: StepperControlProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
      }}
    >
      <IconButton
        icon="remove"
        onPress={onDecrement}
        disabled={decrementDisabled}
        tone="alt"
        size="md"
      />
      <View style={{ alignItems: 'center', minWidth: 60 }}>
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.content.heading,
            textAlign: 'center',
          }}
        >
          {value}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.content.strong,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <IconButton
        icon="add"
        onPress={onIncrement}
        disabled={incrementDisabled}
        tone="alt"
        size="md"
      />
    </View>
  );
};
