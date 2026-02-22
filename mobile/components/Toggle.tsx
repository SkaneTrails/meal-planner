/**
 * Theme-aware toggle switch.
 *
 * Reads default track/thumb colors from `colors.toggle.switch*` tokens.
 * Renders a native `<Switch>` for graphical themes or an ASCII `[X]/[ ]`
 * pressable for flat (terminal) chrome.
 *
 * The `variant` prop selects a pre-configured color palette:
 * - `'default'` — generic toggle (border → primary)
 * - `'ai'` — AI enhancement toggle (muted → ai accent)
 */

import { Pressable, Switch, Text } from 'react-native';
import { fontSize, opacity, spacing, useTheme } from '@/lib/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  variant?: 'default' | 'ai';
}

export const Toggle = ({
  value,
  onValueChange,
  disabled = false,
  variant = 'default',
}: ToggleProps) => {
  const { colors, fonts, chrome } = useTheme();

  if (chrome === 'flat') {
    return (
      <Pressable
        onPress={() => onValueChange(!value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        style={{
          padding: spacing.xs,
          opacity: disabled ? opacity.disabled : 1,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.lg,
            color: disabled
              ? colors.content.placeholder
              : value
                ? colors.primary
                : colors.content.secondary,
          }}
        >
          {value ? '[X]' : '[ ]'}
        </Text>
      </Pressable>
    );
  }

  const trackOff =
    variant === 'ai'
      ? colors.toggle.switchTrackOff
      : colors.toggle.switchTrackOff;
  const trackOn =
    variant === 'ai' ? colors.ai.light : colors.toggle.switchTrackOn;
  const thumbOff = colors.toggle.switchThumbOff;
  const thumbOn =
    variant === 'ai' ? colors.ai.primary : colors.toggle.switchThumbOn;

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: trackOff, true: trackOn }}
      thumbColor={value ? thumbOn : thumbOff}
    />
  );
};
