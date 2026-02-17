import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import {
  circleStyle,
  fontSize,
  fontWeight,
  iconContainer,
  spacing,
  useTheme,
} from '@/lib/theme';

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
      <Pressable
        onPress={onDecrement}
        disabled={decrementDisabled}
        style={({ pressed }) => ({
          ...circleStyle(iconContainer.md),
          backgroundColor: pressed ? colors.bgDark : colors.bgLight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: decrementDisabled ? 0.4 : 1,
        })}
      >
        <Ionicons name="remove" size={20} color={colors.content.body} />
      </Pressable>
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
      <Pressable
        onPress={onIncrement}
        disabled={incrementDisabled}
        style={({ pressed }) => ({
          ...circleStyle(iconContainer.md),
          backgroundColor: pressed ? colors.bgDark : colors.bgLight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: incrementDisabled ? 0.4 : 1,
        })}
      >
        <Ionicons name="add" size={20} color={colors.content.body} />
      </Pressable>
    </View>
  );
};
