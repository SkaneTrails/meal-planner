import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

interface OriginalEnhancedToggleProps {
  showOriginal: boolean;
  t: TFunction;
  onToggle: () => void;
}

export const OriginalEnhancedToggle = ({
  showOriginal,
  t,
  onToggle,
}: OriginalEnhancedToggleProps) => (
  <View
    style={{
      marginTop: spacing.xl,
      flexDirection: 'row',
      backgroundColor: colors.text.light,
      borderRadius: borderRadius.lg,
      padding: 4,
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
        backgroundColor: showOriginal ? colors.glass.card : 'transparent',
      }}
    >
      <Ionicons
        name="document-text-outline"
        size={16}
        color={showOriginal ? colors.content.body : colors.content.icon}
        style={{ marginRight: spacing.xs }}
      />
      <Text
        style={{
          fontSize: fontSize.md,
          fontFamily: showOriginal ? fontFamily.bodySemibold : fontFamily.body,
          color: showOriginal ? colors.content.body : colors.content.icon,
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
        backgroundColor: showOriginal ? 'transparent' : colors.glass.card,
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
          fontFamily: showOriginal ? fontFamily.body : fontFamily.bodySemibold,
          color: showOriginal ? colors.ai.muted : colors.ai.primary,
        }}
      >
        {t('recipe.showEnhanced')}
      </Text>
    </Pressable>
  </View>
);
