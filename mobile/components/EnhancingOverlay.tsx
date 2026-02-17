/**
 * Fullscreen loading overlay shown while AI enhancement is in progress.
 * Blocks all user interaction until the operation completes.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import {
  borderRadius,
  fontFamily,
  fontSize,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';

interface EnhancingOverlayProps {
  visible: boolean;
  message: string;
}

export const EnhancingOverlay = ({
  visible,
  message,
}: EnhancingOverlayProps) => {
  const { colors } = useTheme();
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
        <View style={[styles.card, { backgroundColor: colors.glass.heavy }]}>
          <Ionicons name="sparkles" size={32} color={colors.ai.primary} />
          <ActivityIndicator
            size="large"
            color={colors.ai.primary}
            style={styles.spinner}
          />
          <Text style={[styles.message, { color: colors.text.inverse }]}>
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
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    ...shadows.cardRaised,
    maxWidth: 300,
    width: '100%',
  },
  spinner: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemibold,
    textAlign: 'center',
  },
});
