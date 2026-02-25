import { Pressable, Text, View } from 'react-native';
import { StepperControl } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface PortionStepperProps {
  currentPortions: number;
  originalPortions: number;
  isScaled: boolean;
  t: TFunction;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

export const PortionStepper = ({
  currentPortions,
  originalPortions,
  isScaled,
  t,
  onIncrement,
  onDecrement,
  onReset,
}: PortionStepperProps) => {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }}>
      <StepperControl
        value={currentPortions}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        decrementDisabled={currentPortions <= 1}
        subtitle={t('recipe.portions')}
      />
      {isScaled && (
        <Pressable onPress={onReset} hitSlop={8}>
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              color: colors.primary,
              textDecorationLine: 'underline',
            }}
          >
            {t('recipe.portionsReset')} ({originalPortions})
          </Text>
        </Pressable>
      )}
    </View>
  );
};
