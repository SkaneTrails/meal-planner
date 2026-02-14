/**
 * Banner shown on enhanced recipes that haven't been reviewed yet.
 * Lets users approve (keep enhanced) or reject (revert to original).
 */

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
}: EnhancementReviewBannerProps) => (
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
          fontFamily: fontFamily.bodySemibold,
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
        fontFamily: fontFamily.body,
        color: 'rgba(93, 78, 64, 0.7)',
        marginBottom: spacing.lg,
      }}
    >
      {t('recipe.reviewBannerDescription')}
    </Text>

    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Pressable
        onPress={onApprove}
        disabled={isSubmitting}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: pressed ? colors.ai.bgPressed : colors.ai.iconBg,
          opacity: isSubmitting ? 0.5 : 1,
        })}
      >
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={colors.ai.primary}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
            color: colors.ai.primary,
          }}
        >
          {t('recipe.approveEnhancement')}
        </Text>
      </Pressable>

      <Pressable
        onPress={onReject}
        disabled={isSubmitting}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: pressed
            ? 'rgba(93, 78, 64, 0.15)'
            : 'rgba(93, 78, 64, 0.08)',
          opacity: isSubmitting ? 0.5 : 1,
        })}
      >
        <Ionicons
          name="close-circle"
          size={18}
          color="#5D4E40"
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
            color: '#5D4E40',
          }}
        >
          {t('recipe.rejectEnhancement')}
        </Text>
      </Pressable>
    </View>
  </View>
);
