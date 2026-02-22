/**
 * Collapsible single-select picker that renders inside a SurfaceCard.
 *
 * Collapsed: shows the selected option label (+ optional adornment) with a chevron.
 * Expanded:  shows all options; tapping one selects it and collapses the list.
 *
 * The selection indicator is theme-driven via `visibility.showCheckmarkIndicator`:
 *   - true  → Ionicons checkmark-circle (light / pastel)
 *   - false → [X] / [ ] text indicator (terminal)
 */

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SurfaceCard } from '@/components/SurfaceCard';
import { fontSize, spacing, useTheme } from '@/lib/theme';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  adornment?: ReactNode;
}

interface DropdownPickerProps<T extends string> {
  options: DropdownOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  /** Whether the picker is disabled (no interaction). */
  disabled?: boolean;
  testID?: string;
}

export const DropdownPicker = <T extends string>({
  options,
  value,
  onSelect,
  disabled = false,
  testID,
}: DropdownPickerProps<T>) => {
  const { colors, fonts, visibility } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (v: T) => {
    onSelect(v);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <SurfaceCard style={{ overflow: 'hidden' }} padding={0}>
        <Pressable
          onPress={disabled ? undefined : () => setExpanded(true)}
          disabled={disabled}
          testID={testID ? `${testID}-collapsed` : undefined}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor:
              pressed && !disabled ? colors.bgMid : 'transparent',
            opacity: disabled ? 0.5 : 1,
          })}
        >
          {selected?.adornment}
          <Text
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.content.body,
              fontFamily: fonts.body,
            }}
          >
            {selected?.label}
          </Text>
          {visibility.showCheckmarkIndicator ? (
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.content.secondary}
            />
          ) : (
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.md,
                color: colors.content.secondary,
              }}
            >
              [v]
            </Text>
          )}
        </Pressable>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard style={{ overflow: 'hidden' }} padding={0}>
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            testID={testID ? `${testID}-option-${option.value}` : undefined}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              backgroundColor: pressed ? colors.bgMid : 'transparent',
              borderBottomWidth: index < options.length - 1 ? 1 : 0,
              borderBottomColor: colors.surface.pressed,
            })}
          >
            {option.adornment}
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.md,
                color: colors.content.body,
                fontFamily: fonts.body,
              }}
            >
              {option.label}
            </Text>
            <SelectionIndicator
              selected={isSelected}
              showCheckmark={visibility.showCheckmarkIndicator}
              colors={colors}
              fontFamily={fonts.body}
            />
          </Pressable>
        );
      })}
    </SurfaceCard>
  );
};

interface SelectionIndicatorProps {
  selected: boolean;
  showCheckmark: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  fontFamily: string;
}

const SelectionIndicator = ({
  selected,
  showCheckmark,
  colors,
  fontFamily,
}: SelectionIndicatorProps) => {
  if (showCheckmark) {
    return selected ? (
      <Ionicons name="checkmark-circle" size={20} color={colors.ai.primary} />
    ) : null;
  }

  return (
    <Text
      style={{
        fontFamily,
        fontSize: fontSize.lg,
        color: selected ? colors.primary : colors.content.secondary,
      }}
    >
      {selected ? '[X]' : '[ ]'}
    </Text>
  );
};
