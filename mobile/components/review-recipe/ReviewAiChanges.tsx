import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SurfaceCard } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';

interface ReviewAiChangesProps {
  changes: string[];
  t: TFunction;
}

export const ReviewAiChanges = ({ changes, t }: ReviewAiChangesProps) => {
  const { colors, fonts } = useTheme();
  if (changes.length === 0) return null;

  return (
    <SurfaceCard style={{ marginBottom: spacing.xl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Ionicons name="sparkles" size={18} color={colors.ai.primary} />
        <Text
          style={{
            marginLeft: spacing.sm,
            fontSize: fontSize.lg,
            fontFamily: fonts.bodySemibold,
            color: colors.text.inverse,
          }}
        >
          {t('reviewRecipe.aiImprovements')}
        </Text>
      </View>
      {changes.map((change, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: spacing.sm,
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colors.success}
            style={{ marginRight: spacing.sm, marginTop: 2 }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: fontSize.md,
              color: colors.text.inverse,
              lineHeight: lineHeight.md,
            }}
          >
            {change}
          </Text>
        </View>
      ))}
    </SurfaceCard>
  );
};
