/**
 * Labelled toggle row for settings screens.
 *
 * Renders a title + optional subtitle on the left and a ThemeToggle on the right.
 * Used inside SurfaceCard or Section children for preference switches.
 */

import { Text, View } from 'react-native';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import { ThemeToggle } from './ThemeToggle';

interface SettingToggleRowProps {
  /** Primary label text. */
  label: string;
  /** Optional description shown below the label. */
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SettingToggleRow = ({
  label,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: SettingToggleRowProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text
          style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.medium,
            color: colors.content.body,
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.strong,
              marginTop: spacing['2xs'],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <ThemeToggle
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </View>
  );
};
