import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IconCircle } from '@/components';
import {
  borderRadius,
  fontSize,
  fontWeight,
  iconSize,
  letterSpacing,
  lineHeight,
  shadows,
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
  const { colors } = useTheme();
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
        <View style={[styles.card, { backgroundColor: colors.white }]}>
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
                      { backgroundColor: colors.successBg },
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
            <Pressable
              onPress={() => onReview('reject')}
              disabled={isReviewPending}
              style={({ pressed }) => [
                styles.rejectButton,
                {
                  backgroundColor: colors.glass.light,
                  borderColor: colors.gray[300],
                  opacity: pressed || isReviewPending ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[styles.rejectLabel, { color: colors.text.inverse }]}
              >
                {rejectLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onReview('approve')}
              disabled={isReviewPending}
              style={({ pressed }) => [
                styles.approveButton,
                {
                  backgroundColor: colors.ai.primary,
                  opacity: pressed || isReviewPending ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.approveContent}>
                <Ionicons
                  name="sparkles"
                  size={iconSize.sm}
                  color={colors.white}
                  style={styles.approveIcon}
                />
                <Text style={[styles.approveLabel, { color: colors.white }]}>
                  {approveLabel}
                </Text>
              </View>
            </Pressable>
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
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.xl,
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
    borderRadius: borderRadius.sm,
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
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  approveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  approveContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveIcon: {
    marginRight: spacing['xs-sm'],
  },
  approveLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
