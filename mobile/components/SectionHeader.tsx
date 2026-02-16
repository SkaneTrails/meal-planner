import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/lib/theme';

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconColor?: string;
  variant?: 'light' | 'dark';
}

export const SectionHeader = ({
  icon,
  title,
  subtitle,
  iconColor = colors.content.body,
  variant = 'light',
}: SectionHeaderProps) => {
  const titleColor = variant === 'dark' ? colors.white : colors.text.primary;
  const subtitleColor =
    variant === 'dark' ? colors.white + '80' : colors.text.secondary;
  const bgColor = variant === 'dark' ? colors.glass.card : colors.glass.faint;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            color: titleColor,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: subtitleColor,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};
