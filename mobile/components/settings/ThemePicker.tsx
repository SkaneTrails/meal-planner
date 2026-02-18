import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SurfaceCard } from '@/components';
import {
  fontSize,
  spacing,
  type ThemeName,
  themes,
  useTheme,
} from '@/lib/theme';

const THEME_ENTRIES = Object.entries(themes) as [
  ThemeName,
  (typeof themes)[ThemeName],
][];

interface ThemePickerProps {
  currentTheme: string;
  onChangeTheme: (name: string) => void;
}

export const ThemePicker = ({
  currentTheme,
  onChangeTheme,
}: ThemePickerProps) => {
  const { colors, borderRadius } = useTheme();

  return (
    <SurfaceCard style={{ overflow: 'hidden' }} padding={0}>
      {THEME_ENTRIES.map(([key, definition], index) => (
        <Pressable
          key={key}
          onPress={() => onChangeTheme(key)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: pressed ? colors.bgMid : 'transparent',
            borderBottomWidth: index < THEME_ENTRIES.length - 1 ? 1 : 0,
            borderBottomColor: colors.surface.pressed,
          })}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: borderRadius.full,
              backgroundColor: definition.colors.primary,
              marginRight: spacing.md,
              borderWidth: 1,
              borderColor: colors.gray[200],
            }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.content.body,
              fontFamily: definition.fonts.body,
            }}
          >
            {definition.name}
          </Text>
          {currentTheme === key && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.ai.primary}
            />
          )}
        </Pressable>
      ))}
    </SurfaceCard>
  );
};
