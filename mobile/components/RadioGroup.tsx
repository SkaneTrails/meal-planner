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
                ? colors.primary + '15'
                : pressed
                  ? colors.bgDark
                  : colors.white,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
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
                    borderRadius: 6,
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
                  color: colors.text.inverse,
                }}
              >
                {option.label}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.text.inverse + '80',
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
