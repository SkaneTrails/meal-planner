import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, IconCircle } from '@/components';
import {
  fontSize,
  fontWeight,
  iconSize,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
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
}: EnhancementReviewModalProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.overlay.backdrop }]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              ...shadows.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <IconCircle
              size="lg"
              bg={colors.ai.light}
              style={{ marginRight: spacing.md }}
            >
              <Ionicons
                name="sparkles"
                size={iconSize.xl}
                color={colors.ai.primary}
              />
            </IconCircle>
            <View style={styles.headerText}>
              <Text
                style={[styles.headerLabel, { color: colors.text.inverse }]}
              >
                {headerLabel}
              </Text>
              <Text
                style={[styles.title, { color: colors.gray[600] }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          </View>

          {/* Changes list */}
          <ScrollView style={styles.changesList}>
            {changesMade.length > 0 ? (
              <>
                <Text
                  style={[styles.changesLabel, { color: colors.text.inverse }]}
                >
                  {changesLabel}
                </Text>
                {changesMade.map((change, index) => (
                  <View
                    key={index}
                    style={[
                      styles.changeItem,
                      {
                        backgroundColor: colors.successBg,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={iconSize.md}
                      color={colors.success}
                      style={styles.changeIcon}
                    />
                    <Text
                      style={[
                        styles.changeText,
                        { color: colors.text.inverse },
                      ]}
                    >
                      {change}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.noChanges, { color: colors.gray[600] }]}>
                {noChangesLabel}
              </Text>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button
              variant="text"
              tone="cancel"
              label={rejectLabel}
              onPress={() => onReview('reject')}
              disabled={isReviewPending}
              style={styles.rejectButton}
            />
            <Button
              variant="text"
              tone="ai"
              icon="sparkles"
              label={approveLabel}
              onPress={() => onReview('approve')}
              disabled={isReviewPending}
              isPending={isReviewPending}
              style={styles.approveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  card: {
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  headerLabel: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.normal,
  },
  title: {
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
  },
  changesList: {
    maxHeight: 300,
    marginBottom: spacing.xl,
  },
  changesLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  changeIcon: {
    marginRight: spacing.sm,
    marginTop: spacing['2xs'],
  },
  changeText: {
    flex: 1,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  noChanges: {
    fontSize: fontSize.lg,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
  },
  approveButton: {
    flex: 1,
    alignItems: 'center',
  },
});
