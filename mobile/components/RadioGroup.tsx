import { Pressable, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from '@/lib/theme';

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
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.06)',
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1.5,
              borderColor: isSelected ? colors.border : colors.glass.button,
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: borderRadius.sm,
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
                    width: 12,
                    height: 12,
                    borderRadius: borderRadius['xs-sm'],
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
