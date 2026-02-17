import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  borderRadius,
  circleStyle,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
  iconSize,
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
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="sparkles"
              size={iconSize.xl}
              color={colors.ai.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>{headerLabel}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        {/* Changes list */}
        <ScrollView style={styles.changesList}>
          {changesMade.length > 0 ? (
            <>
              <Text style={styles.changesLabel}>{changesLabel}</Text>
              {changesMade.map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={iconSize.md}
                    color={colors.success}
                    style={styles.changeIcon}
                  />
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noChanges}>{noChangesLabel}</Text>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => onReview('reject')}
            disabled={isReviewPending}
            style={({ pressed }) => [
              styles.rejectButton,
              { opacity: pressed || isReviewPending ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.rejectLabel}>{rejectLabel}</Text>
          </Pressable>
          <Pressable
            onPress={() => onReview('approve')}
            disabled={isReviewPending}
            style={({ pressed }) => [
              styles.approveButton,
              { opacity: pressed || isReviewPending ? 0.7 : 1 },
            ]}
          >
            <View style={styles.approveContent}>
              <Ionicons
                name="sparkles"
                size={iconSize.sm}
                color={colors.white}
                style={styles.approveIcon}
              />
              <Text style={styles.approveLabel}>{approveLabel}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  card: {
    backgroundColor: colors.white,
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
  iconCircle: {
    ...circleStyle(iconContainer.lg),
    backgroundColor: colors.ai.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerLabel: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
    letterSpacing: letterSpacing.normal,
  },
  title: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  changesList: {
    maxHeight: 300,
    marginBottom: spacing.xl,
  },
  changesLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.md,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    backgroundColor: colors.successBg,
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
    color: colors.text.inverse,
    lineHeight: 22,
  },
  noChanges: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
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
    backgroundColor: colors.glass.light,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  rejectLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  approveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.ai.primary,
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
    color: colors.white,
  },
});
