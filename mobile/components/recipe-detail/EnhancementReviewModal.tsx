/**
 * Modal shown after enhancing an existing recipe.
 * Displays changes_made summary and approve/reject buttons so users
 * can review the AI enhancement before committing.
 */

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  iconContainer,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { ReviewAiChanges } from '../review-recipe/ReviewAiChanges';

interface EnhancementReviewModalProps {
  visible: boolean;
  recipe: Recipe;
  t: TFunction;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const EnhancementReviewModal = ({
  visible,
  recipe,
  t,
  isSubmitting,
  onApprove,
  onReject,
  onClose,
}: EnhancementReviewModalProps) => {
  const changes = recipe.changes_made ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay.backdrop,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: spacing['2xl'],
            width: '100%',
            maxWidth: 420,
            maxHeight: '85%',
            ...shadows.xl,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: iconContainer.lg,
                height: iconContainer.lg,
                borderRadius: iconContainer.lg / 2,
                backgroundColor: colors.ai.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <Ionicons name="sparkles" size={22} color={colors.ai.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize['2xl'],
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.text.inverse,
                  letterSpacing: letterSpacing.normal,
                }}
              >
                {t('recipe.enhanceSuccess')}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fontFamily.body,
                  color: colors.gray[600],
                  marginTop: spacing.xs,
                }}
                numberOfLines={1}
              >
                {recipe.title}
              </Text>
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
          >
            {/* AI Changes */}
            <ReviewAiChanges changes={changes} t={t} />
          </ScrollView>

          {/* Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              marginTop: spacing.lg,
            }}
          >
            <Pressable
              onPress={onReject}
              disabled={isSubmitting}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.glass.light,
                alignItems: 'center',
                opacity: pressed || isSubmitting ? 0.7 : 1,
                borderWidth: 1,
                borderColor: colors.gray[300],
              })}
            >
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.text.inverse,
                }}
              >
                {t('recipe.rejectEnhancement')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onApprove}
              disabled={isSubmitting}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.ai.primary,
                alignItems: 'center',
                opacity: pressed || isSubmitting ? 0.7 : 1,
                ...shadows.sm,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={colors.white}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: fontSize.lg,
                    fontFamily: fontFamily.bodySemibold,
                    color: colors.white,
                  }}
                >
                  {t('recipe.approveEnhancement')}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
