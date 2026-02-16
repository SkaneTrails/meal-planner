/**
 * Fullscreen loading overlay shown while AI enhancement is in progress.
 * Blocks all user interaction until the operation completes.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

interface EnhancingOverlayProps {
  visible: boolean;
  message: string;
}

export const EnhancingOverlay = ({
  visible,
  message,
}: EnhancingOverlayProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={() => {}}
  >
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Ionicons name="sparkles" size={32} color={colors.ai.primary} />
        <ActivityIndicator
          size="large"
          color={colors.ai.primary}
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.glass.heavy,
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    boxShadow: '2px 4px 16px 0px rgba(0, 0, 0, 0.12)',
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
    color: colors.text.inverse,
    textAlign: 'center',
  },
});
