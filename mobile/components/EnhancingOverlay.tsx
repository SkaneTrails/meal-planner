/**
 * Fullscreen loading overlay shown while AI enhancement is in progress.
 * Blocks all user interaction until the operation completes.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface EnhancingOverlayProps {
  visible: boolean;
  message: string;
}

export const EnhancingOverlay = ({
  visible,
  message,
}: EnhancingOverlayProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.overlay.backdrop }]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.glass.heavy,
              borderRadius: borderRadius.lg,
              ...shadows.cardRaised,
            },
          ]}
        >
          <Ionicons name="sparkles" size={32} color={colors.ai.primary} />
          <ActivityIndicator
            size="large"
            color={colors.ai.primary}
            style={styles.spinner}
          />
          <Text
            style={[
              styles.message,
              { color: colors.text.inverse, fontFamily: fonts.bodySemibold },
            ]}
          >
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    padding: spacing['3xl'],
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  spinner: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
});
