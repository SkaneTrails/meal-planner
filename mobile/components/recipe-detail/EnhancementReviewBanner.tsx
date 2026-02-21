/**
 * Banner shown on enhanced recipes that haven't been reviewed yet.
 * Lets users approve (keep enhanced) or reject (revert to original).
 */

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface EnhancementReviewBannerProps {
  t: TFunction;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const EnhancementReviewBanner = ({
  t,
  isSubmitting,
  onApprove,
  onReject,
}: EnhancementReviewBannerProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  return (
    <View
      style={{
        marginTop: spacing.lg,
        backgroundColor: colors.ai.bg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.ai.primary,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons
          name="sparkles"
          size={20}
          color={colors.ai.primary}
          style={{ marginRight: spacing.sm }}
        />
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fonts.bodySemibold,
            color: colors.ai.primary,
            flex: 1,
          }}
        >
          {t('recipe.reviewBanner')}
        </Text>
      </View>

      <Text
        style={{
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          color: colors.content.tertiary,
          marginBottom: spacing.lg,
        }}
      >
        {t('recipe.reviewBannerDescription')}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          variant="text"
          tone="ai"
          onPress={onApprove}
          disabled={isSubmitting}
          icon="checkmark-circle"
          iconSize={18}
          label={t('recipe.approveEnhancement')}
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
          }}
        />

        <Button
          variant="text"
          tone="cancel"
          onPress={onReject}
          disabled={isSubmitting}
          icon="close-circle"
          iconSize={18}
          label={t('recipe.rejectEnhancement')}
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
          }}
        />
      </View>
    </View>
  );
};
