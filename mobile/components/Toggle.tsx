/**
 * Theme-aware toggle control.
 *
 * Renders one of three visual forms based on the active theme:
 * - `chrome === 'flat'` → ASCII `[X]/[ ]` pressable (terminal).
 * - `toggleStyle === 'switch'` → custom animated sliding switch.
 * - `toggleStyle === 'checkbox'` → tick-box with theme border radius.
 *
 * The `variant` prop selects a pre-configured color palette:
 * - `'default'` — generic toggle (border → primary)
 * - `'ai'` — AI enhancement toggle (muted → ai accent)
 */

import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import type { BorderRadiusTokens, ColorTokens } from '@/lib/theme';
import { fontSize, opacity, spacing, useTheme } from '@/lib/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  variant?: 'default' | 'ai';
}

const SWITCH_TRACK_WIDTH = 44;
const SWITCH_TRACK_HEIGHT = 24;
const SWITCH_THUMB_SIZE = 20;
const SWITCH_THUMB_INSET = 2;

const CHECKBOX_SIZE = 22;
const CHECKMARK = '\u2713';

export const Toggle = ({
  value,
  onValueChange,
  disabled = false,
  variant = 'default',
}: ToggleProps) => {
  const { colors, fonts, chrome, toggleStyle, borderRadius, overrides } =
    useTheme();

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

  if (toggleStyle === 'checkbox') {
    return (
      <CheckboxToggle
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        variant={variant}
        colors={colors}
        borderRadius={borderRadius.sm}
        borderWidth={overrides.checkboxBorderWidth}
      />
    );
  }

  return (
    <SwitchToggle
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      variant={variant}
      colors={colors}
      borderRadius={borderRadius}
    />
  );
};

// ── Switch (sliding track + thumb) ─────────────────────────────────────

interface SwitchToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
  variant: 'default' | 'ai';
  colors: ColorTokens;
  borderRadius: BorderRadiusTokens;
}

const SwitchToggle = ({
  value,
  onValueChange,
  disabled,
  variant,
  colors,
  borderRadius,
}: SwitchToggleProps) => {
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, position]);

  const trackOn =
    variant === 'ai' ? colors.ai.light : colors.toggle.switchTrackOn;
  const trackOff = colors.toggle.switchTrackOff;
  const thumbOn =
    variant === 'ai' ? colors.ai.primary : colors.toggle.switchThumbOn;
  const thumbOff = colors.toggle.switchThumbOff;

  const trackColor = position.interpolate({
    inputRange: [0, 1],
    outputRange: [trackOff, trackOn],
  });

  const thumbTranslateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [
      SWITCH_THUMB_INSET,
      SWITCH_TRACK_WIDTH - SWITCH_THUMB_SIZE - SWITCH_THUMB_INSET,
    ],
  });

  const thumbColor = position.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbOff, thumbOn],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      role="switch"
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? opacity.disabled : 1 }}
    >
      <Animated.View
        style={{
          width: SWITCH_TRACK_WIDTH,
          height: SWITCH_TRACK_HEIGHT,
          borderRadius: borderRadius.full,
          backgroundColor: trackColor,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: SWITCH_THUMB_SIZE,
            height: SWITCH_THUMB_SIZE,
            borderRadius: SWITCH_THUMB_SIZE / 2,
            backgroundColor: thumbColor,
            transform: [{ translateX: thumbTranslateX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

// ── Checkbox (tick-box) ────────────────────────────────────────────────

interface CheckboxToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
  variant: 'default' | 'ai';
  colors: ColorTokens;
  borderRadius: number;
  borderWidth: number;
}

const CheckboxToggle = ({
  value,
  onValueChange,
  disabled,
  variant,
  colors,
  borderRadius,
  borderWidth,
}: CheckboxToggleProps) => {
  const fillColor =
    variant === 'ai' ? colors.ai.primary : colors.toggle.switchTrackOn;
  const borderColor = value ? fillColor : colors.content.secondary;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? opacity.disabled : 1 }}
    >
      <View
        style={{
          width: CHECKBOX_SIZE,
          height: CHECKBOX_SIZE,
          borderRadius,
          borderWidth,
          borderColor,
          backgroundColor: value ? fillColor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value && (
          <Text
            style={{
              color: colors.toggle.switchThumbOn,
              fontSize: fontSize.sm,
              fontWeight: '700',
              lineHeight: CHECKBOX_SIZE - borderWidth * 2,
            }}
          >
            {CHECKMARK}
          </Text>
        )}
      </View>
    </Pressable>
  );
};
