/**
 * Horizontal "or" divider — a line, label text, and another line.
 *
 * Renders centered separator text flanked by thin horizontal rules,
 * typically used between alternative actions (e.g., "import" or "add manually").
 */

import { Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface DividerProps {
  label: string;
}

export const Divider = ({ label }: DividerProps) => {
  const { colors, fonts } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.surface.dividerSolid,
        }}
      />
      <Text
        style={{
          color: colors.content.secondary,
          fontSize: fontSize.sm,
          fontFamily: fonts.body,
          marginHorizontal: spacing.md,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.surface.dividerSolid,
        }}
      />
    </View>
  );
};
