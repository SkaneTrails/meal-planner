import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';

interface EnhancementReviewModalProps {
  visible: boolean;
  title: string;
  headerLabel: string;
  changesMade: string[];
  changesLabel: string;
  noChangesLabel: string;
  rejectLabel: string;
  approveLabel: string;
  isReviewPending: boolean;
  onReview: (action: 'approve' | 'reject') => void;
  onRequestClose?: () => void;
}

export const EnhancementReviewModal = ({
  visible,
  title,
  headerLabel,
  changesMade,
  changesLabel,
  noChangesLabel,
  rejectLabel,
  approveLabel,
  isReviewPending,
  onReview,
  onRequestClose,
}: EnhancementReviewModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onRequestClose}
  >
    <View
      style={{
        flex: 1,
        backgroundColor: colors.overlay.backdrop,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing['2xl'],
      }}
    >
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing['2xl'],
          width: '100%',
          maxWidth: 400,
          maxHeight: '80%',
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
                fontSize: fontSize['3xl'],
                fontWeight: '700',
                color: colors.text.inverse,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {headerLabel}
            </Text>
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.gray[600],
                marginTop: spacing.xs,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Changes list */}
        <ScrollView style={{ maxHeight: 300, marginBottom: spacing.xl }}>
          {changesMade.length > 0 ? (
            <>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.inverse,
                  marginBottom: spacing.md,
                }}
              >
                {changesLabel}
              </Text>
              {changesMade.map((change, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm,
                    backgroundColor: colors.successBg,
                    padding: spacing.md,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                    style={{ marginRight: spacing.sm, marginTop: 1 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: fontSize.lg,
                      color: colors.text.inverse,
                      lineHeight: 22,
                    }}
                  >
                    {change}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.gray[600],
                fontStyle: 'italic',
              }}
            >
              {noChangesLabel}
            </Text>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable
            onPress={() => onReview('reject')}
            disabled={isReviewPending}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.glass.light,
              alignItems: 'center',
              opacity: pressed || isReviewPending ? 0.7 : 1,
              borderWidth: 1,
              borderColor: colors.gray[300],
            })}
          >
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
              }}
            >
              {rejectLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onReview('approve')}
            disabled={isReviewPending}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.ai.primary,
              alignItems: 'center',
              opacity: pressed || isReviewPending ? 0.7 : 1,
              ...shadows.sm,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="sparkles"
                size={16}
                color={colors.white}
                style={{ marginRight: spacing['xs-sm'] }}
              />
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                }}
              >
                {approveLabel}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);
