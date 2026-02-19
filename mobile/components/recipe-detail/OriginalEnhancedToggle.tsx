import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface OriginalEnhancedToggleProps {
  showOriginal: boolean;
  t: TFunction;
  onToggle: () => void;
}

export const OriginalEnhancedToggle = ({
  showOriginal,
  t,
  onToggle,
}: OriginalEnhancedToggleProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  const trackBg = colors.toggle.trackBg;
  const activeBg = colors.toggle.activeBg;
  const activeColor = colors.toggle.activeText;
  const inactiveColor = colors.toggle.inactiveText;

  return (
    <View
      style={{
        marginTop: spacing.xl,
        flexDirection: 'row',
        backgroundColor: trackBg,
        borderRadius: borderRadius.lg,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.toggle.borderColor,
      }}
    >
      <Pressable
        onPress={showOriginal ? undefined : onToggle}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: showOriginal ? activeBg : 'transparent',
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={16}
          color={showOriginal ? activeColor : inactiveColor}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: showOriginal ? fonts.bodySemibold : fonts.body,
            color: showOriginal ? activeColor : inactiveColor,
          }}
        >
          {t('recipe.showOriginal')}
        </Text>
      </Pressable>
      <Pressable
        onPress={showOriginal ? onToggle : undefined}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: showOriginal ? 'transparent' : activeBg,
        }}
      >
        <Ionicons
          name="sparkles"
          size={16}
          color={showOriginal ? colors.ai.muted : colors.ai.primary}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: showOriginal ? fonts.body : fonts.bodySemibold,
            color: showOriginal ? colors.ai.muted : colors.ai.primary,
          }}
        >
          {t('recipe.showEnhanced')}
        </Text>
      </Pressable>
    </View>
  );
};
