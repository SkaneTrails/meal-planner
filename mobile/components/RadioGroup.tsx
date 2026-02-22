import { Pressable, Text, View } from 'react-native';
import { fontSize, fontWeight, opacity, spacing, useTheme } from '@/lib/theme';

interface RadioOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export const RadioGroup = <T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: RadioGroupProps<T>) => {
  const { colors, borderRadius, circleStyle } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isSelected
                ? colors.glass.card
                : pressed
                  ? colors.glass.pressed
                  : colors.glass.dim,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1.5,
              borderColor: isSelected ? colors.border : colors.glass.button,
              opacity: disabled ? opacity.disabled : 1,
            })}
          >
            <View
              style={{
                ...circleStyle(22),
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : colors.text.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              {isSelected && (
                <View
                  style={{
                    ...circleStyle(12),
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: isSelected
                    ? fontWeight.semibold
                    : fontWeight.normal,
                  color: isSelected ? colors.text.inverse : colors.text.primary,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: isSelected
                    ? colors.text.inverse + '80'
                    : colors.text.secondary,
                }}
              >
                {option.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
