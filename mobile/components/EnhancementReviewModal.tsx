import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, Button, IconCircle } from '@/components';
import {
  fontSize,
  fontWeight,
  iconSize,
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
  const { colors, borderRadius } = useTheme();
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onRequestClose ?? (() => {})}
      dismissable={!!onRequestClose}
      title={headerLabel}
      subtitle={title}
      headerRight={
        <IconCircle size="lg" bg={colors.ai.light}>
          <Ionicons
            name="sparkles"
            size={iconSize.xl}
            color={colors.ai.primary}
          />
        </IconCircle>
      }
      footer={
        <View style={styles.buttonRow}>
          <Button
            variant="text"
            tone="cancel"
            label={rejectLabel}
            onPress={() => onReview('reject')}
            disabled={isReviewPending}
            style={styles.footerButton}
          />
          <Button
            variant="text"
            tone="ai"
            icon="sparkles"
            label={approveLabel}
            onPress={() => onReview('approve')}
            disabled={isReviewPending}
            isPending={isReviewPending}
            style={styles.footerButton}
          />
        </View>
      }
    >
      {changesMade.length > 0 ? (
        <>
          <Text style={[styles.changesLabel, { color: colors.content.strong }]}>
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
                style={[styles.changeText, { color: colors.content.strong }]}
              >
                {change}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={[styles.noChanges, { color: colors.text.muted }]}>
          {noChangesLabel}
        </Text>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
});
