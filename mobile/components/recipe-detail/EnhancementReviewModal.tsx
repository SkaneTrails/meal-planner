/**
 * Modal shown after enhancing an existing recipe.
 * Displays changes_made, version toggle (original/enhanced ingredients
 * & instructions), and approve/reject buttons so users can review
 * the AI enhancement before committing.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

type VersionTab = 'original' | 'enhanced';

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
  const [selectedTab, setSelectedTab] = useState<VersionTab>('enhanced');

  const hasOriginal = recipe.original != null;
  const changes = recipe.changes_made ?? [];

  const displayIngredients =
    selectedTab === 'original' && hasOriginal
      ? (recipe.original?.ingredients ?? recipe.ingredients)
      : recipe.ingredients;

  const displayInstructions =
    selectedTab === 'original' && hasOriginal
      ? (recipe.original?.instructions ?? recipe.instructions)
      : recipe.instructions;

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

            {/* Version Toggle */}
            {hasOriginal && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontFamily: fontFamily.bodySemibold,
                    color: colors.gray[500],
                    marginBottom: spacing.sm,
                    textTransform: 'uppercase',
                    letterSpacing: letterSpacing.wide,
                  }}
                >
                  {t('reviewRecipe.version')}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: colors.glass.light,
                    borderRadius: borderRadius.md,
                    padding: spacing.xs,
                  }}
                >
                  <Pressable
                    onPress={() => setSelectedTab('original')}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: borderRadius.sm,
                      backgroundColor:
                        selectedTab === 'original'
                          ? colors.primary
                          : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.md,
                        fontFamily: fontFamily.bodyMedium,
                        color:
                          selectedTab === 'original'
                            ? colors.white
                            : colors.text.inverse,
                      }}
                    >
                      {t('reviewRecipe.original')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedTab('enhanced')}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: borderRadius.sm,
                      backgroundColor:
                        selectedTab === 'enhanced'
                          ? colors.ai.primary
                          : 'transparent',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={
                        selectedTab === 'enhanced'
                          ? colors.white
                          : colors.ai.primary
                      }
                      style={{ marginRight: spacing.xs }}
                    />
                    <Text
                      style={{
                        fontSize: fontSize.md,
                        fontFamily: fontFamily.bodyMedium,
                        color:
                          selectedTab === 'enhanced'
                            ? colors.white
                            : colors.ai.primary,
                      }}
                    >
                      {t('reviewRecipe.enhanced')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Ingredients preview */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.text.inverse,
                  marginBottom: spacing.sm,
                }}
              >
                {t('recipe.ingredients')} ({displayIngredients.length})
              </Text>
              {displayIngredients.slice(0, 5).map((ing, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: fontSize.md,
                    fontFamily: fontFamily.body,
                    color: colors.content.body,
                    lineHeight: 22,
                    paddingLeft: spacing.sm,
                  }}
                >
                  • {ing}
                </Text>
              ))}
              {displayIngredients.length > 5 && (
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    fontFamily: fontFamily.body,
                    color: colors.gray[500],
                    paddingLeft: spacing.sm,
                    marginTop: spacing.xs,
                  }}
                >
                  +{displayIngredients.length - 5} more...
                </Text>
              )}
            </View>

            {/* Instructions preview */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.text.inverse,
                  marginBottom: spacing.sm,
                }}
              >
                {t('recipe.instructions')} ({displayInstructions.length}{' '}
                {t('reviewRecipe.steps')})
              </Text>
              {displayInstructions.slice(0, 3).map((step, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: fontSize.md,
                    fontFamily: fontFamily.body,
                    color: colors.content.body,
                    lineHeight: 22,
                    paddingLeft: spacing.sm,
                    marginBottom: spacing.xs,
                  }}
                  numberOfLines={2}
                >
                  {i + 1}. {step}
                </Text>
              ))}
              {displayInstructions.length > 3 && (
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    fontFamily: fontFamily.body,
                    color: colors.gray[500],
                    paddingLeft: spacing.sm,
                  }}
                >
                  +{displayInstructions.length - 3} more...
                </Text>
              )}
            </View>
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
